/**
 * Script de capturas para LinkedIn — usa Chrome headless + CDP (ws ya instalado)
 * Uso: node scripts/screenshot.mjs
 */
import { execSync, spawn } from "child_process";
import WebSocket from "ws";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../../capturas-flujo-qa");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9222;
const BASE = "http://localhost:3000";

// Cookie de sesión — se obtiene del proceso dev que ya está corriendo
// Se pasa por variable de entorno SESSION_TOKEN o se lee de la DB
const SESSION_TOKEN = process.env.SESSION_TOKEN;

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Lanzar Chrome headless ────────────────────────────────────────────────────
const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--window-size=1440,900",
  "--hide-scrollbars",
], { stdio: "ignore", detached: true });

await new Promise((r) => setTimeout(r, 2000));

// ── CDP helpers ───────────────────────────────────────────────────────────────
async function cdp(method, params = {}, ws) {
  return new Promise((resolve, reject) => {
    const id = Math.random();
    ws.send(JSON.stringify({ id, method, params }));
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
  });
}

async function openPage() {
  // Obtener lista de targets
  const res = await fetch(`http://localhost:${PORT}/json/new`);
  const target = await res.json();
  const wsUrl = target.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

  await cdp("Network.enable", {}, ws);
  await cdp("Page.enable", {}, ws);
  await cdp("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 1.5, mobile: false,
  }, ws);

  return ws;
}

async function navigate(ws, url) {
  await cdp("Page.navigate", { url }, ws);
  await new Promise((r) => {
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.method === "Page.loadEventFired") {
        ws.removeEventListener("message", handler);
        r();
      }
    };
    ws.addEventListener("message", handler);
  });
  await new Promise((r) => setTimeout(r, 800)); // esperar hidratación React
}

async function setCookie(ws, token) {
  await cdp("Network.setCookie", {
    name: "session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
  }, ws);
}

async function screenshot(ws, filename) {
  const { data } = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, ws);
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
  console.log("✓", filename);
}

async function clickEl(ws, selector) {
  const { result } = await cdp("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width/2, y: r.top + r.height/2 };
      })()
    `,
    returnByValue: true,
  }, ws);
  if (result.value) {
    const { x, y } = result.value;
    await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 }, ws);
    await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 }, ws);
    await new Promise((r) => setTimeout(r, 600));
  }
}

async function typeIn(ws, selector, text) {
  await clickEl(ws, selector);
  await cdp("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(selector)}).value = ${JSON.stringify(text)};
                 document.querySelector(${JSON.stringify(selector)}).dispatchEvent(new Event('input', {bubbles:true}));`,
  }, ws);
}

// ── Main ──────────────────────────────────────────────────────────────────────
try {
  const ws = await openPage();

  // 1. Login page (sin cookie → muestra el form)
  await navigate(ws, `${BASE}/login`);
  await screenshot(ws, "00-login.png");
  console.log("  → captura login (sin sesión)");

  // 2. Eye icon visible — click en el ojo
  await typeIn(ws, "input[name='username']", "mateo");
  await typeIn(ws, "input[name='password']", "QaTester2026");
  // click en el botón del ojo para mostrar contraseña
  await clickEl(ws, "button[aria-label='Mostrar contraseña']");
  await new Promise((r) => setTimeout(r, 300));
  await screenshot(ws, "00b-login-password-visible.png");
  console.log("  → captura login con contraseña visible (ojito)");

  // 3. Hacer login
  await clickEl(ws, "button[type='submit']");
  await new Promise((r) => setTimeout(r, 2000)); // esperar redirect

  // Si el login falló, ponemos la cookie directamente desde env
  const currentUrl = await cdp("Runtime.evaluate", {
    expression: "window.location.href",
    returnByValue: true,
  }, ws);

  if (currentUrl.result.value.includes("/login") && SESSION_TOKEN) {
    console.log("  → Login form no funcionó, usando cookie directa");
    await setCookie(ws, SESSION_TOKEN);
    await navigate(ws, `${BASE}/projects`);
  }

  // 4. Lista de proyectos
  await screenshot(ws, "00c-lista-proyectos.png");
  console.log("  → captura lista de proyectos");

  // 5. Navegar a Novaris Demo (el proyecto existente)
  await clickEl(ws, "a[href*='/projects/']");
  await new Promise((r) => setTimeout(r, 1000));
  await screenshot(ws, "00d-listado-bugs-proyecto.png");

  // 6. Abrir el primer bug para ver el detalle + historial
  const bugLinks = await cdp("Runtime.evaluate", {
    expression: `Array.from(document.querySelectorAll("a[href*='/bugs/']")).map(a => a.href)`,
    returnByValue: true,
  }, ws);

  if (bugLinks.result.value?.length) {
    await navigate(ws, bugLinks.result.value[0]);
    await new Promise((r) => setTimeout(r, 500));
    // Scroll al final para ver el historial
    await cdp("Runtime.evaluate", { expression: "window.scrollTo(0, document.body.scrollHeight)" }, ws);
    await new Promise((r) => setTimeout(r, 400));
    await screenshot(ws, "00e-detalle-bug-historial.png");
    console.log("  → captura detalle bug con historial");

    // 7. Abrir asistente IA
    await cdp("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" }, ws);
    await navigate(ws, bugLinks.result.value[0].replace(/\/[^/]+$/, "/new"));
    await new Promise((r) => setTimeout(r, 1000));
    await clickEl(ws, "button[aria-label*='IA'], summary, [data-testid='ai-assist'], .brg-card button");
    await new Promise((r) => setTimeout(r, 500));
    await screenshot(ws, "00f-asistente-ia-bugs.png");
    console.log("  → captura asistente IA");
  }

  ws.close();
  console.log("\n✅ Todas las capturas guardadas en:", OUT_DIR);
} finally {
  chrome.kill();
}

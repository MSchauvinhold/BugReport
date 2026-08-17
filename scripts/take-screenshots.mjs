/**
 * Capturas faltantes para el post de LinkedIn.
 * Uso: npx playwright@latest node scripts/take-screenshots.mjs
 *   o: node --experimental-vm-modules scripts/take-screenshots.mjs
 *
 * Requiere que el dev server esté corriendo en localhost:3000
 */
import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../../capturas-flujo-qa");
fs.mkdirSync(OUT, { recursive: true });

const BASE = "http://localhost:3000";
const CREDS = { username: "mateo", password: "QaTester2026" };

async function shot(page, filename) {
  const outPath = path.join(OUT, filename);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log("✓", filename);
  return outPath;
}

async function waitReady(page) {
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
  await page.waitForTimeout(500);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});

const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
  colorScheme: "dark",
});

// Forzar modo oscuro vía localStorage antes de cada navegación
await ctx.addInitScript(() => {
  localStorage.setItem("theme", "dark");
});

const page = await ctx.newPage();

// ── 1. Login (sin sesión) ────────────────────────────────────────────────────
await page.goto(`${BASE}/login`);
await waitReady(page);
await shot(page, "17-login.png");
console.log("  → login vacío");

// Eye icon abierto: tipear contraseña y hacer click en ojo
await page.fill("input[name='username']", CREDS.username);
await page.fill("input[name='password']", CREDS.password);
await page.click("button[aria-label='Mostrar contraseña']");
await page.waitForTimeout(300);
await shot(page, "17b-login-password-visible.png");
console.log("  → login con contraseña visible");

// ── 2. Login y lista de proyectos ────────────────────────────────────────────
await page.click("button[type='submit']");
await page.waitForURL("**/projects**", { timeout: 8_000 });
await waitReady(page);
await shot(page, "17c-lista-proyectos.png");
console.log("  → lista de proyectos");

// ── 3. Entrar al proyecto Novaris Demo ───────────────────────────────────────
// Click en la tarjeta del proyecto (main content, no el sidebar)
const projectCard = page.locator("main a[href*='/projects/'], .brg-card a[href*='/projects/']").first();
try {
  await projectCard.click({ timeout: 3_000 });
} catch {
  // Fallback: navegar directo a la URL del proyecto desde el sidebar
  const sidebarLink = await page.$$eval("nav a[href*='/projects/'], aside a[href*='/projects/']", ls => ls.map(l => l.href));
  if (sidebarLink[0]) await page.goto(sidebarLink[0]);
}
await waitReady(page);
console.log("  URL actual:", page.url());

// Obtener los links de bugs de la tabla/listado
const bugLinks = await page.$$eval("a[href*='/bugs/']", (links) =>
  links.map((l) => l.href).filter((h) => !h.includes("/new") && !h.includes("/edit") && !h.includes("/print"))
);
console.log("  Bug links encontrados:", bugLinks.length);

if (bugLinks.length === 0) {
  console.error("No se encontraron bugs. Verificá que el proyecto tiene bugs cargados.");
  await browser.close();
  process.exit(1);
}

// ── 4. Detalle del bug + historial ───────────────────────────────────────────
// Usar NOV-001 (el más viejo, más chance de tener historial)
await page.goto(bugLinks[bugLinks.length - 1]);
await waitReady(page);

// Captura del top del bug
await shot(page, "18b-detalle-bug-top.png");
console.log("  → detalle bug (top)");

// Scroll al encabezado "Historial" usando Playwright
try {
  await page.getByText("Historial", { exact: true }).scrollIntoViewIfNeeded({ timeout: 3000 });
} catch {
  // fallback: scroll en el contenedor correcto (el que tiene más scrollHeight)
  await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("*"));
    const scrollable = all
      .filter(el => {
        const s = window.getComputedStyle(el);
        return (s.overflow === "auto" || s.overflowY === "auto") && el.scrollHeight > el.clientHeight + 100;
      })
      .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
  });
}
await page.waitForTimeout(500);
await shot(page, "18-detalle-bug-historial.png");
console.log("  → detalle bug con historial");

// ── 5. Asistente IA para redactar bugs ───────────────────────────────────────
// Ir a "Nuevo bug" del proyecto
const projectId = bugLinks[0].match(/projects\/([^/]+)/)?.[1];
if (projectId) {
  await page.goto(`${BASE}/projects/${projectId}/bugs/new`);
  await waitReady(page);

  // Buscar y hacer click en "Redactar con IA" para abrirlo
  const aiBtn = page.locator("text=Redactar con IA, details summary, [data-ai], button").first();
  const summaryEl = page.locator("details summary, summary").first();

  // Intentar abrir el panel de IA
  try {
    await summaryEl.click({ timeout: 3_000 });
  } catch {
    try {
      await page.locator("text=Redactar con IA").click({ timeout: 3_000 });
    } catch {
      console.log("  ⚠ No se pudo abrir el asistente de IA automáticamente");
    }
  }
  await page.waitForTimeout(500);
  await shot(page, "19-asistente-ia-bugs.png");
  console.log("  → asistente IA para bugs");

  // Si hay un textarea del asistente, escribir algo para que se vea activo
  const aiTextarea = page.locator("textarea").first();
  try {
    await aiTextarea.fill("El usuario no puede iniciar sesión después de 5 intentos fallidos — la cuenta debería bloquearse pero no lo hace.", { timeout: 2_000 });
    await page.waitForTimeout(300);
    await shot(page, "19b-asistente-ia-con-texto.png");
    console.log("  → asistente IA con texto cargado");
  } catch {
    // no hay textarea visible, no pasa nada
  }
}

await browser.close();

console.log(`\n✅ Capturas guardadas en:\n   ${OUT}`);
console.log("\nArchivos generados:");
fs.readdirSync(OUT)
  .filter(f => f.startsWith("17") || f.startsWith("18") || f.startsWith("19"))
  .sort()
  .forEach(f => console.log("  •", f));

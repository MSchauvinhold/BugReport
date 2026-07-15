type Bug = {
  id: string;
  bugNumber: number;
  title: string;
  description?: string | null;
  severity: string;
  priority: string;
  steps: string[];
  expected: string;
  actual: string;
  notes?: string | null;
  environment?: string | null;
  module?: string | null;
  tags: string[];
  screenshots: string[];
  status: string;
  createdAt: Date;
  reportedBy?: string | null;
  project: { name: string; prefix: string };
};

function bugId(bug: Bug) {
  return `${bug.project.prefix}-${bug.bugNumber.toString().padStart(3, "0")}`;
}

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function toMarkdown(bug: Bug): string {
  const id = bugId(bug);
  const steps = bug.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const env = bug.environment?.trim() || "—";
  const mod = bug.module?.trim() || "—";
  const description = bug.description?.trim() || "—";
  const notes = bug.notes?.trim() || "—";
  const evidence = bug.screenshots.length
    ? bug.screenshots.map((url, i) => `![Evidencia ${i + 1}](${url})`).join("\n")
    : "—";

  const footer = [
    `- 👤 **Reportado por:** ${bug.reportedBy?.trim() || "—"}`,
    `- 🗓️ **Fecha:** ${fmtDate(bug.createdAt)}`,
  ];
  if (bug.tags.length) footer.push(`- 🏷️ **Tags:** ${bug.tags.map((t) => `\`${t}\``).join(", ")}`);

  return `# 🐞 BUG REPORT – ${bug.project.name}

**${id} · ${bug.title}**

## 🧩 Descripción

${description}

## 🔁 Pasos para reproducir

${steps}

## ✅ Resultado esperado

${bug.expected}

## ❌ Resultado actual

${bug.actual}

## 🌐 Entorno

- **URL / Módulo:** ${mod}
- **Detalles:** ${env}

## 🔥 Severidad

${bug.severity}

## 📌 Prioridad

${bug.priority}

## 🏷️ Estado

${bug.status}

## 📎 Evidencia

${evidence}

## 📝 Notas adicionales

${notes}

---

${footer.join("\n")}
`;
}

export function toJira(bug: Bug): string {
  const id = bugId(bug);
  const steps = bug.steps.map((s, i) => `# ${i + 1}. ${s}`).join("\n");
  const tags = bug.tags.length ? bug.tags.join(", ") : "—";
  const env = bug.environment?.trim() || "—";
  const mod = bug.module?.trim() || "—";
  const description = bug.description?.trim() || "—";
  const notes = bug.notes?.trim() || "—";
  const screenshots = bug.screenshots.length
    ? bug.screenshots.map((url) => `!${url}|thumbnail!`).join("\n")
    : "—";

  return `h2. [${id}] ${bug.title}

h3. Descripción

${description}

|| Campo || Valor ||
| *Severidad* | ${bug.severity} |
| *Prioridad* | ${bug.priority} |
| *Estado* | ${bug.status} |
| *Módulo* | ${mod} |
| *Entorno* | ${env} |
| *Tags* | ${tags} |
| *Reportado por* | ${bug.reportedBy?.trim() || "—"} |
| *Fecha* | ${fmtDate(bug.createdAt)} |

h3. Pasos para reproducir

${steps}

h3. Resultado esperado

${bug.expected}

h3. Resultado actual

${bug.actual}

h3. Evidencia

${screenshots}

h3. Notas adicionales

${notes}
`;
}

export function toPlainText(bug: Bug): string {
  const id = bugId(bug);
  const steps = bug.steps.map((s, i) => `  ${i + 1}. ${s}`).join("\n");
  const tags = bug.tags.length ? bug.tags.join(", ") : "—";
  const env = bug.environment?.trim() || "—";
  const mod = bug.module?.trim() || "—";
  const description = bug.description?.trim() || "—";
  const notes = bug.notes?.trim() || "—";
  const screenshots = bug.screenshots.length ? bug.screenshots.join("\n  ") : "—";

  return `=== BUG REPORT: ${id} ===
${bug.project.name}

Título:    ${bug.title}
Severidad: ${bug.severity}
Prioridad: ${bug.priority}
Estado:    ${bug.status}
Módulo:    ${mod}
Entorno:   ${env}
Tags:      ${tags}
Reportado: ${bug.reportedBy?.trim() || "—"} · ${fmtDate(bug.createdAt)}

DESCRIPCIÓN:
  ${description}

PASOS PARA REPRODUCIR:
${steps}

RESULTADO ESPERADO:
  ${bug.expected}

RESULTADO ACTUAL:
  ${bug.actual}

EVIDENCIA:
  ${screenshots}

NOTAS ADICIONALES:
  ${notes}
`;
}

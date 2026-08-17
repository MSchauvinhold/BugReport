import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// Modelo: Sonnet 4.6 — mejor balance de calidad y costo para generar bugs
// y, sobre todo, casos de prueba más completos.
const MODEL = "claude-sonnet-4-6";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no está configurada.");
  }
  return new Anthropic({ apiKey });
}

/** Extrae el primer bloque de texto (JSON garantizado por output_config.format). */
function firstJsonText(message: Anthropic.Message): string {
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("La IA no devolvió contenido.");
  }
  return block.text;
}

// ---------- 1. Generar bug desde texto libre ----------

export type AIBugDraft = {
  title: string;
  description: string;
  severity: string;
  priority: string;
  steps: string[];
  expected: string;
  actual: string;
  notes: string;
  environment: string;
  module: string;
  tags: string[];
};

const BUG_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "Título corto y claro del bug" },
    description: { type: "string", description: "Resumen breve del problema y su contexto (1-3 oraciones)" },
    severity: { type: "string", enum: ["Crítica", "Alta", "Media", "Baja"] },
    priority: { type: "string", enum: ["P1", "P2", "P3", "P4"] },
    steps: {
      type: "array",
      items: { type: "string" },
      description: "Pasos numerados para reproducir, uno por elemento",
    },
    expected: { type: "string", description: "Resultado esperado" },
    actual: { type: "string", description: "Resultado actual / lo que pasa" },
    notes: { type: "string", description: "Notas adicionales o causa raíz probable si se puede inferir; si no, cadena vacía" },
    environment: { type: "string", description: "Navegador/OS/ambiente si se menciona, si no, cadena vacía" },
    module: { type: "string", description: "Módulo o feature afectado si se infiere, si no, cadena vacía" },
    tags: { type: "array", items: { type: "string" }, description: "Etiquetas cortas relevantes" },
  },
  required: ["title", "description", "severity", "priority", "steps", "expected", "actual", "notes", "environment", "module", "tags"],
  additionalProperties: false,
} as const;

export async function generateBugDraft(
  description: string,
  modules: string[] = []
): Promise<AIBugDraft> {
  const client = getClient();

  const moduleHint =
    modules.length > 0
      ? `Si aplica, elegí el módulo de esta lista existente del proyecto: ${modules.join(", ")}. Si ninguno encaja, dejalo vacío.`
      : "";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      "Sos un QA analista funcional senior. A partir de una descripción informal de un bug, " +
      "generás un reporte de bug estándar, claro y profesional, en español rioplatense. " +
      "Inferí severidad y prioridad razonables. Escribí pasos para reproducir concretos y accionables. " +
      "En 'description' resumí el problema y su contexto en 1-3 oraciones. " +
      "En 'notes' agregá notas útiles o una hipótesis de causa raíz solo si se desprende de lo descripto. " +
      "No inventes datos que no estén implícitos; si un campo no se puede inferir, usá cadena vacía. " +
      moduleHint,
    messages: [{ role: "user", content: `Descripción del bug:\n\n${description}` }],
    output_config: { format: { type: "json_schema", schema: BUG_SCHEMA } },
  });

  if (message.stop_reason === "refusal") {
    throw new Error("La IA no pudo procesar esta descripción.");
  }

  return JSON.parse(firstJsonText(message)) as AIBugDraft;
}

// ---------- 2. Generar casos de prueba ----------

export type AITestCase = {
  title: string;
  preconditions: string;
  testData: string;
  steps: string[];
  expectedResult: string;
  priority: string;
  severity: string;
};

const TEST_CASES_SCHEMA = {
  type: "object",
  properties: {
    testCases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título del caso de prueba" },
          preconditions: { type: "string", description: "Precondiciones; cadena vacía si no hay" },
          testData: { type: "string", description: "Valores concretos de entrada a usar (ej: usuario/contraseña, montos); cadena vacía si el caso no necesita datos específicos" },
          steps: { type: "array", items: { type: "string" }, description: "Pasos del caso, uno por elemento" },
          expectedResult: { type: "string", description: "Resultado esperado del caso" },
          priority: { type: "string", enum: ["Alta", "Media", "Baja"], description: "Qué tan importante es ejecutar este caso" },
          severity: { type: "string", enum: ["Crítica", "Alta", "Media", "Baja"], description: "Impacto si la funcionalidad probada fallara" },
        },
        required: ["title", "preconditions", "testData", "steps", "expectedResult", "priority", "severity"],
        additionalProperties: false,
      },
    },
  },
  required: ["testCases"],
  additionalProperties: false,
} as const;

export async function generateTestCases(description: string, module?: string): Promise<AITestCase[]> {
  const client = getClient();

  const moduleHint = module
    ? `Los casos son para el módulo "${module}". Enfocate en esa funcionalidad puntual, no en el sistema completo.`
    : "";

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system:
      "Sos un QA analista funcional senior. A partir de la descripción de una funcionalidad o user story, " +
      "generás un conjunto de casos de prueba completos en español rioplatense: caminos felices, " +
      "casos límite, validaciones y casos negativos. Cada caso debe ser concreto y verificable, " +
      "con pasos accionables y un resultado esperado claro. Cubrí entre 4 y 8 casos según la complejidad. " +
      "Priorizá y clasificá la severidad con criterio real, no pongas todo en Alta. " +
      moduleHint,
    messages: [{ role: "user", content: `Funcionalidad / user story:\n\n${description}` }],
    output_config: { format: { type: "json_schema", schema: TEST_CASES_SCHEMA } },
  });

  if (message.stop_reason === "refusal") {
    throw new Error("La IA no pudo procesar esta descripción.");
  }

  const parsed = JSON.parse(firstJsonText(message)) as { testCases: AITestCase[] };
  return parsed.testCases;
}

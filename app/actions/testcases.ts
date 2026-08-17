"use server";

import { prisma } from "@/lib/prisma";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";

export type TestCaseInput = {
  title: string;
  preconditions: string;
  testData?: string;
  steps: string[];
  expectedResult: string;
  priority?: string;
  severity?: string;
};

const VALID_STATUSES = ["Pendiente", "Pasó", "Falló", "Bloqueado"];
const VALID_PRIORITIES = ["Alta", "Media", "Baja"];
const VALID_SEVERITIES = ["Crítica", "Alta", "Media", "Baja"];

/** Guarda un lote de casos de prueba en un proyecto propio, agrupados en un módulo opcional. */
export async function saveTestCases(
  projectId: string,
  cases: TestCaseInput[],
  module?: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) return { ok: false, error: "El proyecto no existe o no tenés permiso." };

  const mod = module?.trim() || null;

  const clean = cases
    .filter((c) => c.title?.trim())
    .map((c) => ({
      projectId,
      module: mod,
      title: c.title.trim(),
      preconditions: (c.preconditions ?? "").trim(),
      testData: (c.testData ?? "").trim(),
      steps: (c.steps ?? []).map((s) => s.trim()).filter(Boolean),
      expectedResult: (c.expectedResult ?? "").trim(),
      priority: VALID_PRIORITIES.includes(c.priority ?? "") ? c.priority : null,
      severity: VALID_SEVERITIES.includes(c.severity ?? "") ? c.severity : null,
    }));

  if (clean.length === 0) return { ok: false, error: "No hay casos válidos para guardar." };

  try {
    await prisma.testCase.createMany({ data: clean });
    refresh();
    return { ok: true, count: clean.length };
  } catch (err) {
    console.error("saveTestCases error:", err);
    return { ok: false, error: "No se pudieron guardar los casos. Intentá de nuevo." };
  }
}

/**
 * Cambia el estado de un caso y, opcionalmente, guarda el resultado real / ambiente de ejecución.
 * La fecha de ejecución se re-registra solo cuando el estado realmente cambia hacia uno ejecutado
 * (así editar notas después no pisa la fecha original).
 */
export async function updateTestCaseStatus(
  id: string,
  status: string,
  details?: { actualResult?: string; environment?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_STATUSES.includes(status)) return { ok: false, error: "Estado inválido." };
  const user = await requireUser();
  try {
    const existing = await prisma.testCase.findFirst({
      where: { id, project: { userId: user.id } },
      select: { status: true },
    });
    if (!existing) return { ok: false, error: "No se encontró el caso o no tenés permiso." };

    const statusChanged = existing.status !== status;
    const data: { status: string; executedAt?: Date; actualResult?: string; environment?: string | null } = { status };
    if (statusChanged && status !== "Pendiente") data.executedAt = new Date();
    if (details?.actualResult !== undefined) data.actualResult = details.actualResult.trim();
    if (details?.environment !== undefined) data.environment = details.environment.trim() || null;

    await prisma.testCase.update({ where: { id }, data });
    refresh();
    return { ok: true };
  } catch (err) {
    console.error("updateTestCaseStatus error:", err);
    return { ok: false, error: "No se pudo cambiar el estado. Intentá de nuevo." };
  }
}

export async function addTestCaseScreenshot(id: string, url: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  try {
    const tc = await prisma.testCase.findFirst({ where: { id, project: { userId: user.id } }, select: { screenshots: true } });
    if (!tc) return { ok: false, error: "No se encontró el caso o no tenés permiso." };
    await prisma.testCase.update({ where: { id }, data: { screenshots: [...tc.screenshots, url] } });
    refresh();
    return { ok: true };
  } catch (err) {
    console.error("addTestCaseScreenshot error:", err);
    return { ok: false, error: "No se pudo adjuntar la imagen. Intentá de nuevo." };
  }
}

export async function removeTestCaseScreenshot(id: string, url: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  try {
    const tc = await prisma.testCase.findFirst({ where: { id, project: { userId: user.id } }, select: { screenshots: true } });
    if (!tc) return { ok: false, error: "No se encontró el caso o no tenés permiso." };
    await prisma.testCase.update({ where: { id }, data: { screenshots: tc.screenshots.filter((s) => s !== url) } });
    refresh();
    return { ok: true };
  } catch (err) {
    console.error("removeTestCaseScreenshot error:", err);
    return { ok: false, error: "No se pudo quitar la imagen. Intentá de nuevo." };
  }
}

export async function deleteTestCase(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  try {
    const result = await prisma.testCase.deleteMany({
      where: { id, project: { userId: user.id } },
    });
    if (result.count === 0) return { ok: false, error: "No se encontró el caso o no tenés permiso." };
    refresh();
    return { ok: true };
  } catch (err) {
    console.error("deleteTestCase error:", err);
    return { ok: false, error: "No se pudo eliminar el caso. Intentá de nuevo." };
  }
}

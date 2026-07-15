"use server";

import { prisma } from "@/lib/prisma";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";

export type TestCaseInput = {
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
};

const VALID_STATUSES = ["Pendiente", "Pasó", "Falló", "Bloqueado"];

/** Guarda un lote de casos de prueba en un proyecto propio. */
export async function saveTestCases(
  projectId: string,
  cases: TestCaseInput[]
): Promise<{ ok: boolean; count?: number; error?: string }> {
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id: projectId, userId: user.id } });
  if (!project) return { ok: false, error: "El proyecto no existe o no tenés permiso." };

  const clean = cases
    .filter((c) => c.title?.trim())
    .map((c) => ({
      projectId,
      title: c.title.trim(),
      preconditions: (c.preconditions ?? "").trim(),
      steps: (c.steps ?? []).map((s) => s.trim()).filter(Boolean),
      expectedResult: (c.expectedResult ?? "").trim(),
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

export async function updateTestCaseStatus(
  id: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  if (!VALID_STATUSES.includes(status)) return { ok: false, error: "Estado inválido." };
  const user = await requireUser();
  try {
    const result = await prisma.testCase.updateMany({
      where: { id, project: { userId: user.id } },
      data: { status },
    });
    if (result.count === 0) return { ok: false, error: "No se encontró el caso o no tenés permiso." };
    refresh();
    return { ok: true };
  } catch (err) {
    console.error("updateTestCaseStatus error:", err);
    return { ok: false, error: "No se pudo cambiar el estado. Intentá de nuevo." };
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

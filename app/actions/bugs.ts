"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isBugStatus } from "@/lib/bugStatus";

export type CreateBugInput = {
  title: string;
  description?: string;
  severity: string;
  priority: string;
  steps: string[];
  expected: string;
  actual: string;
  notes?: string;
  environment?: string;
  module?: string;
  tags: string[];
  screenshots: string[];
};

export type CreateBugResult =
  | { ok: true; bugId: string }
  | { ok: false; error: string };

export async function createBug(
  projectId: string,
  data: CreateBugInput,
  opts?: { duplicatedFromNumber?: number }
): Promise<CreateBugResult> {
  // Validación server-side (defensa en profundidad, no confiamos sólo en el cliente)
  if (!data.title?.trim()) return { ok: false, error: "El título es obligatorio." };
  if (!data.severity) return { ok: false, error: "La severidad es obligatoria." };
  if (!data.priority) return { ok: false, error: "La prioridad es obligatoria." };
  const steps = data.steps.map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0) return { ok: false, error: "Agregá al menos un paso para reproducir." };
  if (!data.expected?.trim()) return { ok: false, error: "El resultado esperado es obligatorio." };
  if (!data.actual?.trim()) return { ok: false, error: "El resultado actual es obligatorio." };

  const user = await requireUser();
  // Sólo se puede cargar un bug en un proyecto propio
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: user.id },
  });
  if (!project) return { ok: false, error: "El proyecto no existe o no tenés permiso." };

  // Reintentamos ante una colisión de bugNumber (creación concurrente del mismo proyecto)
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await prisma.bug.findFirst({
      where: { projectId },
      orderBy: { bugNumber: "desc" },
      select: { bugNumber: true },
    });
    const bugNumber = (last?.bugNumber ?? 0) + 1;

    try {
      const dup = opts?.duplicatedFromNumber;
      const bug = await prisma.bug.create({
        data: {
          title: data.title.trim(),
          description: data.description?.trim() || "",
          severity: data.severity,
          priority: data.priority,
          steps,
          expected: data.expected.trim(),
          actual: data.actual.trim(),
          notes: data.notes?.trim() || "",
          environment: data.environment?.trim() || null,
          module: data.module?.trim() || null,
          tags: data.tags,
          screenshots: data.screenshots,
          bugNumber,
          projectId,
          events: {
            create: {
              type: dup ? "duplicated" : "created",
              detail: dup ? `Duplicado de ${project.prefix}-${String(dup).padStart(3, "0")}` : "",
              username: user.username,
            },
          },
        },
      });
      return { ok: true, bugId: bug.id };
    } catch (err) {
      // P2002 = violación de restricción única → otro bug tomó ese número, reintentamos
      if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
        continue;
      }
      console.error("createBug error:", err);
      return { ok: false, error: "No se pudo guardar el bug. Intentá de nuevo." };
    }
  }

  return { ok: false, error: "No se pudo asignar un número de bug. Reintentá en un momento." };
}

export async function updateBug(
  bugId: string,
  data: CreateBugInput
): Promise<CreateBugResult> {
  // Misma validación que en la creación
  if (!data.title?.trim()) return { ok: false, error: "El título es obligatorio." };
  if (!data.severity) return { ok: false, error: "La severidad es obligatoria." };
  if (!data.priority) return { ok: false, error: "La prioridad es obligatoria." };
  const steps = data.steps.map((s) => s.trim()).filter(Boolean);
  if (steps.length === 0) return { ok: false, error: "Agregá al menos un paso para reproducir." };
  if (!data.expected?.trim()) return { ok: false, error: "El resultado esperado es obligatorio." };
  if (!data.actual?.trim()) return { ok: false, error: "El resultado actual es obligatorio." };

  const user = await requireUser();
  try {
    // Verificamos propiedad antes de tocar nada
    const existing = await prisma.bug.findFirst({
      where: { id: bugId, project: { userId: user.id } },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "No se encontró el bug o no tenés permiso." };

    await prisma.bug.update({
      where: { id: existing.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || "",
        severity: data.severity,
        priority: data.priority,
        steps,
        expected: data.expected.trim(),
        actual: data.actual.trim(),
        notes: data.notes?.trim() || "",
        environment: data.environment?.trim() || null,
        module: data.module?.trim() || null,
        tags: data.tags,
        screenshots: data.screenshots,
        events: {
          create: {
            type: "edited",
            detail: "",
            username: user.username,
          },
        },
      },
    });
    return { ok: true, bugId: existing.id };
  } catch (err) {
    console.error("updateBug error:", err);
    return { ok: false, error: "No se pudo guardar los cambios. Intentá de nuevo." };
  }
}

export async function updateBugStatus(
  bugId: string,
  status: string
): Promise<{ ok: boolean; error?: string }> {
  if (!isBugStatus(status)) {
    return { ok: false, error: "Estado inválido." };
  }
  const user = await requireUser();
  try {
    // Traemos el estado actual (validando propiedad) para registrar el cambio
    const bug = await prisma.bug.findFirst({
      where: { id: bugId, project: { userId: user.id } },
      select: { id: true, status: true },
    });
    if (!bug) {
      return { ok: false, error: "No se encontró el bug o no tenés permiso." };
    }
    if (bug.status === status) {
      refresh();
      return { ok: true };
    }

    await prisma.bug.update({
      where: { id: bug.id },
      data: {
        status,
        events: {
          create: {
            type: "status",
            detail: `${bug.status} → ${status}`,
            username: user.username,
          },
        },
      },
    });
    refresh();
    return { ok: true };
  } catch (err) {
    console.error("updateBugStatus error:", err);
    return { ok: false, error: "No se pudo cambiar el estado. Intentá de nuevo." };
  }
}

export async function deleteBug(
  bugId: string,
  projectId: string
): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    const result = await prisma.bug.deleteMany({
      where: { id: bugId, project: { userId: user.id } },
    });
    if (result.count === 0) {
      return { error: "No se encontró el bug o no tenés permiso para eliminarlo." };
    }
  } catch (err) {
    console.error("deleteBug error:", err);
    return { error: "No se pudo eliminar el bug. Intentá de nuevo." };
  }
  redirect(`/projects/${projectId}`);
}

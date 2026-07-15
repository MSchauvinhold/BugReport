"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";

export type ProjectFormState = {
  error?: string;
  fieldErrors?: { name?: string; prefix?: string };
};

function validate(name: string, prefix: string): ProjectFormState["fieldErrors"] {
  const fieldErrors: { name?: string; prefix?: string } = {};
  if (!name.trim()) fieldErrors.name = "El nombre es obligatorio.";
  if (!prefix.trim()) {
    fieldErrors.prefix = "El prefijo es obligatorio.";
  } else if (!/^[A-Za-z0-9]{1,8}$/.test(prefix.trim())) {
    fieldErrors.prefix = "El prefijo debe ser de 1 a 8 letras o números, sin espacios.";
  }
  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}

export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const prefix = ((formData.get("prefix") as string) ?? "").toUpperCase().trim();

  const fieldErrors = validate(name, prefix);
  if (fieldErrors) return { fieldErrors };

  const user = await requireUser();

  let projectId: string;
  try {
    const project = await prisma.project.create({
      data: { name, prefix, userId: user.id },
    });
    projectId = project.id;
  } catch (err) {
    console.error("createProject error:", err);
    return { error: "No se pudo crear el proyecto. Verificá tu conexión e intentá de nuevo." };
  }

  redirect(`/projects/${projectId}`);
}

export async function updateProject(
  id: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const prefix = ((formData.get("prefix") as string) ?? "").toUpperCase().trim();

  const fieldErrors = validate(name, prefix);
  if (fieldErrors) return { fieldErrors };

  const user = await requireUser();

  try {
    // updateMany con userId garantiza que sólo se actualice si es del usuario
    const result = await prisma.project.updateMany({
      where: { id, userId: user.id },
      data: { name, prefix },
    });
    if (result.count === 0) {
      return { error: "No se encontró el proyecto o no tenés permiso para editarlo." };
    }
  } catch (err) {
    console.error("updateProject error:", err);
    return { error: "No se pudo guardar los cambios. Intentá de nuevo." };
  }

  refresh();
  redirect(`/projects/${id}`);
}

export async function deleteProject(id: string): Promise<{ error?: string }> {
  const user = await requireUser();
  try {
    const result = await prisma.project.deleteMany({ where: { id, userId: user.id } });
    if (result.count === 0) {
      return { error: "No se encontró el proyecto o no tenés permiso para eliminarlo." };
    }
  } catch (err) {
    console.error("deleteProject error:", err);
    return { error: "No se pudo eliminar el proyecto. Intentá de nuevo." };
  }
  redirect("/projects");
}

"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = ((formData.get("username") as string) ?? "").trim();
  const password = (formData.get("password") as string) ?? "";
  const remember = formData.get("remember") === "on";

  if (!username || !password) {
    return { error: "Completá usuario y contraseña." };
  }

  let ok = false;
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    // Verificamos siempre (aunque el usuario no exista) para no filtrar
    // qué usuarios están registrados por diferencia de tiempo de respuesta.
    const stored = user?.password ?? "salt:0000";
    const valid = await verifyPassword(password, stored);

    if (user && valid) {
      await createSession(user.id, remember);
      ok = true;
    }
  } catch (err) {
    console.error("login error:", err);
    return { error: "Ocurrió un error al iniciar sesión. Intentá de nuevo." };
  }

  if (!ok) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  redirect("/projects");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

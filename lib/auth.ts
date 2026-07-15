import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export { hashPassword, verifyPassword } from "@/lib/password";

const SESSION_COOKIE = "session";
const SESSION_DAYS_REMEMBER = 30;
const SESSION_DAYS_DEFAULT = 1;

// ---------- Gestión de sesiones ----------

/**
 * Crea una sesión en la DB y setea la cookie httpOnly. Usar en Server Actions.
 * Si `remember` es true, la sesión dura 30 días y la cookie persiste; si no,
 * dura 1 día y la cookie es de sesión (se borra al cerrar el navegador).
 */
export async function createSession(userId: string, remember = true): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const days = remember ? SESSION_DAYS_REMEMBER : SESSION_DAYS_DEFAULT;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.session.create({ data: { token, userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Sin `expires` → cookie de sesión (dura mientras el navegador esté abierto)
    ...(remember ? { expires: expiresAt } : {}),
  });
}

/** Cierra la sesión actual: borra el registro y limpia la cookie. Usar en Server Actions. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete(SESSION_COOKIE);
  }
}

// ---------- Data Access Layer ----------

/**
 * Devuelve el usuario autenticado o null. Memoizado por render con cache()
 * para no repetir la consulta en cada componente del árbol.
 */
export const getCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  return { id: session.user.id, username: session.user.username };
});

/** Igual que getCurrentUser pero redirige a /login si no hay sesión. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

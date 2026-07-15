/**
 * Crea un usuario en la base de datos.
 *
 * Uso:
 *   npm run create-user -- <usuario> <contraseña>
 *
 * Ejemplo:
 *   npm run create-user -- mateo "MiClaveSegura123"
 */
import { PrismaClient } from "../app/generated/prisma/client.ts";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import "dotenv/config";
import { hashPassword } from "../lib/password.ts";

neonConfig.webSocketConstructor = ws;

async function main() {
  const [, , username, password] = process.argv;

  if (!username || !password) {
    console.error("Uso: npm run create-user -- <usuario> <contraseña>");
    process.exit(1);
  }
  if (password.length < 6) {
    console.error("La contraseña debe tener al menos 6 caracteres.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
  });

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.error(`El usuario "${username}" ya existe.`);
    process.exit(1);
  }

  const user = await prisma.user.create({
    data: { username, password: await hashPassword(password) },
  });

  console.log(`✓ Usuario creado: ${user.username} (id: ${user.id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error creando el usuario:", err);
  process.exit(1);
});

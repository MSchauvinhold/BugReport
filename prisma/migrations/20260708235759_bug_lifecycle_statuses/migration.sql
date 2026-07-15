-- Migración de estados al ciclo de vida del defecto:
--   Abierto      -> Nuevo
--   En progreso  -> Asignado
--   Resuelto     -> Cerrado
UPDATE "Bug" SET "status" = 'Nuevo'    WHERE "status" = 'Abierto';
UPDATE "Bug" SET "status" = 'Asignado' WHERE "status" = 'En progreso';
UPDATE "Bug" SET "status" = 'Cerrado'  WHERE "status" = 'Resuelto';

-- AlterTable
ALTER TABLE "Bug" ALTER COLUMN "status" SET DEFAULT 'Nuevo';

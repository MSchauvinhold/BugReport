// Ciclo de vida de un defecto (bug lifecycle).
// Nuevo      → reportado por el tester/usuario, pendiente de validar.
// Asignado   → validado y asignado a un desarrollador para corregir.
// Corregido  → el dev aplicó la solución; pasa a verificación de QA.
// Cerrado    → QA verifica que la corrección funciona y lo cierra.
// Reabierto  → la corrección falló; vuelve al circuito para más análisis.
export const BUG_STATUSES = ["Nuevo", "Asignado", "Corregido", "Cerrado", "Reabierto"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export const DEFAULT_BUG_STATUS: BugStatus = "Nuevo";

export function isBugStatus(value: string): value is BugStatus {
  return (BUG_STATUSES as readonly string[]).includes(value);
}

// Estados que cuentan como "resuelto" para las métricas.
export const CLOSED_STATUSES: readonly BugStatus[] = ["Cerrado"];

// Tokens de color (CSS vars definidas en globals.css) por estado.
export const BUG_STATUS_TOKENS: Record<string, { bg: string; fg: string }> = {
  "Nuevo": { bg: "var(--st-new-bg)", fg: "var(--st-new-fg)" },
  "Asignado": { bg: "var(--st-asig-bg)", fg: "var(--st-asig-fg)" },
  "Corregido": { bg: "var(--st-fix-bg)", fg: "var(--st-fix-fg)" },
  "Cerrado": { bg: "var(--st-done-bg)", fg: "var(--st-done-fg)" },
  "Reabierto": { bg: "var(--st-reop-bg)", fg: "var(--st-reop-fg)" },
};

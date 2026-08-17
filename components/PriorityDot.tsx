const PRIORITY_COLOR: Record<string, string> = {
  Alta: "var(--sev-high-dot)",
  Media: "var(--sev-med-dot)",
  Baja: "var(--sev-low-dot)",
};

/** Indicador chico de prioridad de ejecución (no confundir con severidad del bug/caso). */
export function PriorityDot({ priority }: { priority?: string | null }) {
  if (!priority) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--text-3)" }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[priority] ?? "var(--text-3)" }} />
      {priority}
    </span>
  );
}

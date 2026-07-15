const SEVERITY_TOKENS: Record<string, { bg: string; fg: string; dot: string }> = {
  "Crítica": { bg: "var(--sev-crit-bg)", fg: "var(--sev-crit-fg)", dot: "var(--sev-crit-dot)" },
  "Alta":    { bg: "var(--sev-high-bg)", fg: "var(--sev-high-fg)", dot: "var(--sev-high-dot)" },
  "Media":   { bg: "var(--sev-med-bg)",  fg: "var(--sev-med-fg)",  dot: "var(--sev-med-dot)" },
  "Baja":    { bg: "var(--sev-low-bg)",  fg: "var(--sev-low-fg)",  dot: "var(--sev-low-dot)" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const t = SEVERITY_TOKENS[severity] ?? {
    bg: "var(--surface-2)",
    fg: "var(--text-2)",
    dot: "var(--text-3)",
  };
  return (
    <span className="brg-sev" style={{ background: t.bg, color: t.fg }}>
      <span className="brg-sev-dot" style={{ background: t.dot }} />
      {severity}
    </span>
  );
}

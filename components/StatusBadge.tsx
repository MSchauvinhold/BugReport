import { BUG_STATUS_TOKENS } from "@/lib/bugStatus";

export function StatusBadge({ status }: { status: string }) {
  const t = BUG_STATUS_TOKENS[status] ?? { bg: "var(--surface-2)", fg: "var(--text-2)" };
  return (
    <span className="brg-status" style={{ background: t.bg, color: t.fg }}>
      {status}
    </span>
  );
}

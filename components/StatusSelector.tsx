"use client";

import { useTransition } from "react";
import { updateBugStatus } from "@/app/actions/bugs";
import { useToastStore } from "@/lib/store/toastStore";
import { BUG_STATUSES, BUG_STATUS_TOKENS } from "@/lib/bugStatus";

export function StatusSelector({
  bugId,
  currentStatus,
}: {
  bugId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const toast = useToastStore();

  return (
    <select
      value={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value;
        startTransition(async () => {
          try {
            const result = await updateBugStatus(bugId, status);
            if (!result.ok) {
              toast.error(result.error ?? "No se pudo cambiar el estado.");
              return;
            }
            toast.success(`Estado actualizado a "${status}".`);
          } catch (err) {
            console.error("updateBugStatus client error:", err);
            toast.error("No se pudo cambiar el estado. Intentá de nuevo.");
          }
        });
      }}
      className="rounded-[7px] text-[12.5px] font-semibold cursor-pointer focus:outline-none disabled:opacity-50"
      style={{
        background: "var(--input)",
        border: "1px solid var(--border-2)",
        color: BUG_STATUS_TOKENS[currentStatus]?.fg ?? "var(--text)",
        padding: "6px 10px",
      }}
    >
      {BUG_STATUSES.map((s) => (
        <option key={s} value={s} style={{ color: "var(--text)" }}>{s}</option>
      ))}
    </select>
  );
}

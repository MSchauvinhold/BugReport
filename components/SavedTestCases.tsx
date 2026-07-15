"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/store/toastStore";
import { updateTestCaseStatus, deleteTestCase } from "@/app/actions/testcases";

type SavedCase = {
  id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expectedResult: string;
  status: string;
};

const STATUSES = ["Pendiente", "Pasó", "Falló", "Bloqueado"];

const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  Pendiente: { bg: "var(--surface-2)", fg: "var(--text-2)" },
  "Pasó": { bg: "var(--st-done-bg)", fg: "var(--st-done-fg)" },
  "Falló": { bg: "var(--danger-bg)", fg: "var(--danger)" },
  Bloqueado: { bg: "var(--sev-high-bg)", fg: "var(--sev-high-fg)" },
};

export function SavedTestCases({ projectId, cases }: { projectId: string; cases: SavedCase[] }) {
  const toast = useToastStore();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const res = await updateTestCaseStatus(id, status);
      if (!res.ok) toast.error(res.error ?? "No se pudo actualizar.");
      else router.refresh();
    });
  }

  function remove(id: string, title: string) {
    if (!confirm(`¿Eliminar el caso "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteTestCase(id);
      if (!res.ok) toast.error(res.error ?? "No se pudo eliminar.");
      else {
        toast.success("Caso eliminado.");
        router.refresh();
      }
    });
  }

  const passed = cases.filter((c) => c.status === "Pasó").length;
  const failed = cases.filter((c) => c.status === "Falló").length;

  if (cases.length === 0) {
    return (
      <div className="brg-card py-10 text-center" style={{ borderRadius: "11px" }}>
        <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
          Todavía no guardaste casos de prueba en este proyecto.
        </div>
      </div>
    );
  }

  return (
    <div className="brg-card overflow-hidden">
      <div
        className="flex items-center justify-between px-[18px] py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>
          Casos guardados <span style={{ color: "var(--text-3)" }}>({cases.length})</span>
        </div>
        <div className="flex items-center gap-3 text-[11.5px]" style={{ color: "var(--text-3)" }}>
          <span style={{ color: "var(--st-done-fg)" }}>{passed} pasaron</span>
          <span style={{ color: "var(--danger)" }}>{failed} fallaron</span>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {cases.map((c, i) => {
          const st = STATUS_STYLE[c.status] ?? STATUS_STYLE.Pendiente;
          return (
            <div key={c.id} className="p-[18px]" style={{ opacity: pending ? 0.7 : 1 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="font-mono text-[11px] shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }}>
                    TC-{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{c.title}</span>
                </div>
                <span
                  className="text-[11px] font-semibold rounded-md shrink-0"
                  style={{ background: st.bg, color: st.fg, padding: "3px 9px" }}
                >
                  {c.status}
                </span>
              </div>

              {c.preconditions && (
                <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: "var(--text-3)" }}>Precondiciones: </span>{c.preconditions}
                </div>
              )}
              <ol className="mt-2 flex flex-col gap-1">
                {c.steps.map((s, j) => (
                  <li key={j} className="flex gap-2 text-[12px]" style={{ color: "var(--text-2)" }}>
                    <span className="font-mono shrink-0" style={{ color: "var(--text-3)" }}>{j + 1}.</span>
                    {s}
                  </li>
                ))}
              </ol>
              <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                <span style={{ color: "var(--success)" }}>Esperado: </span>{c.expectedResult}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <select
                  value={c.status}
                  disabled={pending}
                  onChange={(e) => setStatus(c.id, e.target.value)}
                  className="rounded-[7px] text-[12px] font-semibold cursor-pointer focus:outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: st.fg, padding: "5px 9px" }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} style={{ color: "var(--text)" }}>{s}</option>
                  ))}
                </select>

                {c.status === "Falló" && (
                  <Link
                    href={`/projects/${projectId}/bugs/new?fromTest=${c.id}`}
                    className="brg-btn brg-btn-danger brg-btn-sm"
                  >
                    Crear bug del fallo
                  </Link>
                )}

                <div className="flex-1" />
                <button
                  onClick={() => remove(c.id, c.title)}
                  disabled={pending}
                  className="text-[12px]"
                  style={{ color: "var(--text-3)" }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

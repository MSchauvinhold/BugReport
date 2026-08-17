"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToastStore } from "@/lib/store/toastStore";
import {
  updateTestCaseStatus,
  deleteTestCase,
  addTestCaseScreenshot,
  removeTestCaseScreenshot,
} from "@/app/actions/testcases";
import { SeverityBadge } from "./SeverityBadge";
import { PriorityDot } from "./PriorityDot";

export type SavedCase = {
  id: string;
  title: string;
  preconditions: string;
  testData: string;
  steps: string[];
  expectedResult: string;
  actualResult: string;
  priority: string | null;
  severity: string | null;
  environment: string | null;
  screenshots: string[];
  status: string;
  executedAt: Date | string | null;
};

const STATUSES = ["Pendiente", "Pasó", "Falló", "Bloqueado"];
const EXECUTION_STATES = ["Falló", "Bloqueado"];
const MAX_SIZE = 10 * 1024 * 1024;

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
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ actualResult: string; environment: string }>({ actualResult: "", environment: "" });
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function openPanel(c: SavedCase) {
    setOpenId(c.id);
    setDraft({ actualResult: c.actualResult, environment: c.environment ?? "" });
  }

  function setStatus(c: SavedCase, status: string) {
    startTransition(async () => {
      const res = await updateTestCaseStatus(c.id, status);
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo actualizar.");
        return;
      }
      router.refresh();
    });
    if (EXECUTION_STATES.includes(status)) openPanel({ ...c, status });
  }

  function saveDetails(id: string) {
    startTransition(async () => {
      const c = cases.find((x) => x.id === id);
      const res = await updateTestCaseStatus(id, c?.status ?? "Pendiente", {
        actualResult: draft.actualResult,
        environment: draft.environment,
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo guardar.");
        return;
      }
      toast.success("Detalles de ejecución guardados.");
      setOpenId(null);
      router.refresh();
    });
  }

  async function uploadEvidence(id: string, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error(`"${file.name}" no es una imagen.`);
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error(`"${file.name}" supera los 10 MB.`);
      return;
    }
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      const result = await addTestCaseScreenshot(id, url);
      if (!result.ok) toast.error(result.error ?? "No se pudo adjuntar.");
      else router.refresh();
    } catch {
      toast.error("No se pudo subir la imagen. Intentá de nuevo.");
    } finally {
      setUploadingId(null);
    }
  }

  function removeEvidence(id: string, url: string) {
    startTransition(async () => {
      const res = await removeTestCaseScreenshot(id, url);
      if (!res.ok) toast.error(res.error ?? "No se pudo quitar.");
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
          Todavía no hay casos guardados acá. Describí la funcionalidad arriba y generá el primer lote.
        </div>
      </div>
    );
  }

  return (
    <div className="brg-card overflow-hidden">
      <div className="flex items-center justify-between px-[18px] py-3" style={{ borderBottom: "1px solid var(--border)" }}>
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
          const panelOpen = openId === c.id;
          return (
            <div key={c.id} className="p-[18px]" style={{ opacity: pending && !panelOpen ? 0.85 : 1 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="font-mono text-[11px] shrink-0 mt-0.5" style={{ color: "var(--accent-text)" }}>
                    TC-{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{c.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityDot priority={c.priority} />
                  {c.severity && <SeverityBadge severity={c.severity} />}
                  <span className="text-[11px] font-semibold rounded-md" style={{ background: st.bg, color: st.fg, padding: "3px 9px" }}>
                    {c.status}
                  </span>
                </div>
              </div>

              {c.preconditions && (
                <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: "var(--text-3)" }}>Precondiciones: </span>{c.preconditions}
                </div>
              )}
              {c.testData && (
                <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: "var(--text-3)" }}>Datos de entrada: </span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{c.testData}</span>
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
              {c.actualResult && !panelOpen && (
                <div className="text-[12px] mt-2" style={{ color: "var(--text-2)" }}>
                  <span style={{ color: "var(--danger)" }}>Resultado real: </span>{c.actualResult}
                </div>
              )}
              {(c.environment || c.executedAt) && !panelOpen && (
                <div className="text-[11px] mt-2" style={{ color: "var(--text-3)" }}>
                  {c.environment && <>Ejecutado en {c.environment}</>}
                  {c.environment && c.executedAt && " · "}
                  {c.executedAt && new Date(c.executedAt).toLocaleDateString("es-AR")}
                </div>
              )}
              {c.screenshots.length > 0 && !panelOpen && (
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {c.screenshots.map((url, k) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Evidencia ${k + 1}`} className="h-12 w-16 object-cover rounded-md" style={{ border: "1px solid var(--border-2)" }} />
                    </a>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <select
                  value={c.status}
                  disabled={pending}
                  onChange={(e) => setStatus(c, e.target.value)}
                  className="rounded-[7px] text-[12px] font-semibold cursor-pointer focus:outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border-2)", color: st.fg, padding: "5px 9px" }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} style={{ color: "var(--text)" }}>{s}</option>
                  ))}
                </select>

                {c.status === "Falló" && (
                  <Link href={`/projects/${projectId}/bugs/new?fromTest=${c.id}`} className="brg-btn brg-btn-danger brg-btn-sm">
                    Crear bug del fallo
                  </Link>
                )}

                <button
                  onClick={() => (panelOpen ? setOpenId(null) : openPanel(c))}
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--accent-text)" }}
                >
                  {panelOpen ? "Cerrar detalles" : "Detalles de ejecución"}
                </button>

                <div className="flex-1" />
                <button onClick={() => remove(c.id, c.title)} disabled={pending} className="text-[12px]" style={{ color: "var(--text-3)" }}>
                  Eliminar
                </button>
              </div>

              {panelOpen && (
                <div className="mt-3 rounded-[10px] p-3.5 flex flex-col gap-3" style={{ background: "var(--surface-2)" }}>
                  <div>
                    <label className="brg-label">Resultado real</label>
                    <textarea
                      value={draft.actualResult}
                      onChange={(e) => setDraft((d) => ({ ...d, actualResult: e.target.value }))}
                      rows={2}
                      placeholder="Qué pasó realmente al ejecutar el caso."
                      className="brg-input"
                      style={{ padding: "8px 10px" }}
                    />
                  </div>
                  <div>
                    <label className="brg-label">Ambiente</label>
                    <input
                      type="text"
                      value={draft.environment}
                      onChange={(e) => setDraft((d) => ({ ...d, environment: e.target.value }))}
                      placeholder="Ej: Chrome 126, Windows 11, staging"
                      className="brg-input"
                      style={{ padding: "8px 10px" }}
                    />
                  </div>
                  <div>
                    <label className="brg-label">Evidencia</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.screenshots.map((url) => (
                        <div key={url} className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Evidencia" className="h-14 w-[72px] object-cover rounded-lg" style={{ border: "1px solid var(--border-2)" }} />
                          <button
                            type="button"
                            onClick={() => removeEvidence(c.id, url)}
                            className="absolute top-[3px] right-[3px] rounded-full w-4 h-4 flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}
                            aria-label="Quitar imagen"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {uploadingId === c.id && (
                        <div className="h-14 w-[72px] rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--border-2)" }}>
                          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                      <label className="brg-btn brg-btn-secondary brg-btn-sm cursor-pointer">
                        + Adjuntar
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadEvidence(c.id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setOpenId(null)} className="brg-btn brg-btn-ghost brg-btn-sm">Cancelar</button>
                    <button onClick={() => saveDetails(c.id)} disabled={pending} className="brg-btn brg-btn-primary brg-btn-sm">
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

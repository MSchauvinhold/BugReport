"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBugFormStore, isBugFormDirty } from "@/lib/store/bugFormStore";
import { useToastStore } from "@/lib/store/toastStore";
import { ScreenshotDropzone } from "./ScreenshotDropzone";
import { AiBugAssist } from "./AiBugAssist";
import { createBug, updateBug } from "@/app/actions/bugs";

const SEVERITIES = ["Crítica", "Alta", "Media", "Baja"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];

type FieldErrors = {
  title?: string;
  severity?: string;
  priority?: string;
  steps?: string;
  expected?: string;
  actual?: string;
};

export type BugFormInit = {
  title?: string;
  description?: string;
  severity?: string;
  priority?: string;
  steps?: string[];
  expected?: string;
  actual?: string;
  notes?: string;
  environment?: string;
  module?: string;
  tags?: string[];
  screenshots?: string[];
};

type Props = {
  projectId: string;
  modules?: string[];
  initial?: BugFormInit;
  duplicatedFromNumber?: number;
  /** Si está presente, el formulario edita ese bug en lugar de crear uno nuevo. */
  editBugId?: string;
};

export function BugForm({ projectId, modules = [], initial, duplicatedFromNumber, editBugId }: Props) {
  const store = useBugFormStore();
  const uploading = useBugFormStore((s) => s.uploadingCount);
  const router = useRouter();
  const toast = useToastStore();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Precarga desde un bug duplicado (una sola vez, al montar)
  useEffect(() => {
    if (initial) {
      useBugFormStore.getState().reset();
      useBugFormStore.getState().applyDraft(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // En edición el form arranca precargado (siempre "sucio"), así que no avisamos.
    if (editBugId) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (!saved && isBugFormDirty(useBugFormStore.getState())) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saved, editBugId]);

  const clearError = useCallback((field: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const { title, description, severity, priority, steps, expected, actual, notes, environment, module, tags, screenshots } = store;

      const cleanSteps = steps.map((s) => s.trim()).filter(Boolean);
      const nextErrors: FieldErrors = {};
      if (!title.trim()) nextErrors.title = "El título es obligatorio.";
      if (!severity) nextErrors.severity = "Elegí una severidad.";
      if (!priority) nextErrors.priority = "Elegí una prioridad.";
      if (cleanSteps.length === 0) nextErrors.steps = "Agregá al menos un paso para reproducir.";
      if (!expected.trim()) nextErrors.expected = "Describí el resultado esperado.";
      if (!actual.trim()) nextErrors.actual = "Describí el resultado actual.";

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        toast.error("Faltan campos obligatorios. Revisá los marcados en rojo.");
        return;
      }
      if (store.uploadingCount > 0) {
        toast.info("Esperá a que terminen de subir las imágenes antes de guardar.");
        return;
      }
      setErrors({});

      const payload = {
        title,
        description: description || undefined,
        severity,
        priority,
        steps: cleanSteps,
        expected,
        actual,
        notes: notes || undefined,
        environment: environment || undefined,
        module: module || undefined,
        tags,
        screenshots,
      };

      startTransition(async () => {
        try {
          const result = editBugId
            ? await updateBug(editBugId, payload)
            : await createBug(projectId, payload, duplicatedFromNumber ? { duplicatedFromNumber } : undefined);

          if (!result.ok) {
            toast.error(result.error);
            return;
          }

          setSaved(true);
          store.reset();
          toast.success(editBugId ? "Cambios guardados." : "Bug guardado correctamente.");
          router.push(`/projects/${projectId}/bugs/${result.bugId}`);
        } catch (err) {
          console.error("saveBug client error:", err);
          toast.error("Ocurrió un error inesperado al guardar. Intentá de nuevo.");
        }
      });
    },
    [store, projectId, router, toast, duplicatedFromNumber, editBugId]
  );

  const req = <span style={{ color: "var(--danger)" }}>*</span>;

  return (
    <form id="bug-form" onSubmit={handleSubmit} className="flex flex-col gap-[17px]" noValidate>
      <AiBugAssist modules={modules} />

      {/* Título */}
      <div>
        <label className="brg-label">Título {req}</label>
        <input
          type="text"
          value={store.title}
          onChange={(e) => { store.setField("title", e.target.value); clearError("title"); }}
          aria-invalid={!!errors.title}
          placeholder="Ej: El botón de guardar no funciona en Firefox"
          className={`brg-input ${errors.title ? "brg-input-error" : ""}`}
          style={{ padding: "10px 12px" }}
        />
        {errors.title && <p className="brg-error-text">{errors.title}</p>}
      </div>

      {/* Descripción */}
      <div>
        <label className="brg-label">Descripción</label>
        <textarea
          value={store.description}
          onChange={(e) => store.setField("description", e.target.value)}
          rows={2}
          placeholder="Resumen breve del problema y su contexto."
          className="brg-input"
          style={{ padding: "10px 12px" }}
        />
      </div>

      {/* Severidad + Prioridad */}
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label className="brg-label">Severidad {req}</label>
          <select
            value={store.severity}
            onChange={(e) => { store.setField("severity", e.target.value); clearError("severity"); }}
            aria-invalid={!!errors.severity}
            className={`brg-input ${errors.severity ? "brg-input-error" : ""}`}
          >
            <option value="">Seleccionar…</option>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {errors.severity && <p className="brg-error-text">{errors.severity}</p>}
        </div>
        <div>
          <label className="brg-label">Prioridad {req}</label>
          <select
            value={store.priority}
            onChange={(e) => { store.setField("priority", e.target.value); clearError("priority"); }}
            aria-invalid={!!errors.priority}
            className={`brg-input ${errors.priority ? "brg-input-error" : ""}`}
          >
            <option value="">Seleccionar…</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.priority && <p className="brg-error-text">{errors.priority}</p>}
        </div>
      </div>

      {/* Pasos */}
      <div>
        <label className="brg-label">Pasos para reproducir {req}</label>
        <div className="flex flex-col gap-2">
          {store.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="font-mono text-xs w-3.5 shrink-0" style={{ color: "var(--text-3)" }}>{i + 1}.</span>
              <input
                type="text"
                value={step}
                onChange={(e) => { store.updateStep(i, e.target.value); clearError("steps"); }}
                placeholder={`Paso ${i + 1}`}
                className={`brg-input flex-1 ${errors.steps ? "brg-input-error" : ""}`}
              />
              <div className="flex flex-col gap-px shrink-0">
                <button type="button" onClick={() => store.moveStep(i, -1)} disabled={i === 0}
                  className="text-[9px] leading-none disabled:opacity-30" style={{ color: "var(--text-3)" }} aria-label="Subir paso">▲</button>
                <button type="button" onClick={() => store.moveStep(i, 1)} disabled={i === store.steps.length - 1}
                  className="text-[9px] leading-none disabled:opacity-30" style={{ color: "var(--text-3)" }} aria-label="Bajar paso">▼</button>
              </div>
              {store.steps.length > 1 && (
                <button type="button" onClick={() => store.removeStep(i)}
                  className="text-[15px] shrink-0" style={{ color: "var(--text-3)" }} aria-label="Eliminar paso">×</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={store.addStep}
          className="mt-2 text-[12.5px] font-semibold" style={{ color: "var(--accent-text)" }}>
          + Agregar paso
        </button>
        {errors.steps && <p className="brg-error-text">{errors.steps}</p>}
      </div>

      {/* Esperado / Actual */}
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label className="brg-label">Resultado esperado {req}</label>
          <textarea
            value={store.expected}
            onChange={(e) => { store.setField("expected", e.target.value); clearError("expected"); }}
            aria-invalid={!!errors.expected}
            rows={3}
            className={`brg-input ${errors.expected ? "brg-input-error" : ""}`}
            style={{ padding: "10px 12px" }}
          />
          {errors.expected && <p className="brg-error-text">{errors.expected}</p>}
        </div>
        <div>
          <label className="brg-label">Resultado actual {req}</label>
          <textarea
            value={store.actual}
            onChange={(e) => { store.setField("actual", e.target.value); clearError("actual"); }}
            aria-invalid={!!errors.actual}
            rows={3}
            className={`brg-input ${errors.actual ? "brg-input-error" : ""}`}
            style={{ padding: "10px 12px" }}
          />
          {errors.actual && <p className="brg-error-text">{errors.actual}</p>}
        </div>
      </div>

      {/* Entorno + Módulo */}
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <label className="brg-label">Entorno</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={store.environment}
              onChange={(e) => store.setField("environment", e.target.value)}
              placeholder="Ej: Chrome 124, Windows 11, staging"
              className="brg-input flex-1"
            />
            <button
              type="button"
              onClick={() => {
                const ua = navigator.userAgent;
                const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Unknown";
                const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "macOS" : ua.includes("Linux") ? "Linux" : "Unknown";
                store.setField("environment", `${browser}, ${os}`);
              }}
              className="brg-btn brg-btn-secondary"
              style={{ color: "var(--accent-text)", padding: "0 13px" }}
            >
              Detectar
            </button>
          </div>
        </div>
        <div>
          <label className="brg-label">Módulo/Feature</label>
          <input
            type="text"
            list="module-suggestions"
            value={store.module}
            onChange={(e) => store.setField("module", e.target.value)}
            placeholder="Ej: Login, Dashboard, Reportes"
            className="brg-input"
          />
          {modules.length > 0 && (
            <datalist id="module-suggestions">
              {modules.map((m) => <option key={m} value={m} />)}
            </datalist>
          )}
        </div>
      </div>

      {/* Notas adicionales */}
      <div>
        <label className="brg-label">Notas adicionales</label>
        <textarea
          value={store.notes}
          onChange={(e) => store.setField("notes", e.target.value)}
          rows={2}
          placeholder="Observaciones, logs relevantes o hipótesis de causa raíz."
          className="brg-input"
          style={{ padding: "10px 12px" }}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="brg-label">Tags</label>
        <div
          className="brg-input flex items-center gap-1.5 flex-wrap"
          style={{ padding: "7px 9px" }}
        >
          {store.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-[5px] font-semibold"
              style={{ background: "var(--accent-soft)", color: "var(--accent-text)", padding: "3px 8px", fontSize: "11.5px" }}
            >
              {tag}
              <button type="button" onClick={() => store.removeTag(tag)} style={{ opacity: 0.7 }}>×</button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
                e.preventDefault();
                store.addTag(tagInput.trim());
                setTagInput("");
              }
            }}
            placeholder="Escribí y Enter…"
            className="flex-1 bg-transparent border-none outline-none text-[12.5px] min-w-[120px]"
            style={{ color: "var(--text)" }}
          />
        </div>
      </div>

      {/* Evidencia */}
      <div>
        <label className="brg-label">Evidencia (imágenes)</label>
        <ScreenshotDropzone />
      </div>

      {(uploading > 0 || pending) && (
        <div className="text-xs text-right" style={{ color: "var(--text-3)" }}>
          {uploading > 0 ? "Esperá a que terminen de subir las imágenes…" : "Guardando…"}
        </div>
      )}
    </form>
  );
}

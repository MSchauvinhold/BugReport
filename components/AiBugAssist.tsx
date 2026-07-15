"use client";

import { useState } from "react";
import { useBugFormStore } from "@/lib/store/bugFormStore";
import { useToastStore } from "@/lib/store/toastStore";

export function AiBugAssist({ modules }: { modules: string[] }) {
  const applyDraft = useBugFormStore((s) => s.applyDraft);
  const toast = useToastStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (text.trim().length < 5) {
      toast.error("Escribí una descripción un poco más detallada.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text, modules }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo generar el bug.");
        return;
      }
      applyDraft(data.draft);
      toast.success("Reporte completado. Revisá los campos antes de guardar.");
      setOpen(false);
      setText("");
    } catch (err) {
      console.error("ai bug assist error:", err);
      toast.error("No se pudo generar el bug. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  const Sparkles = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 13l.8 2.2L22 16l-2.2.8L19 19l-.8-2.2L16 16l2.2-.8L19 13z" />
    </svg>
  );

  // Estado colapsado: un botón que abre el asistente.
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 rounded-[10px] p-3.5 mb-1 text-left transition-colors hover:brightness-[0.98]"
        style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}
      >
        {Sparkles}
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-semibold" style={{ color: "var(--accent-text)" }}>
            Redactar con IA
          </span>
          <span className="text-[11.5px]" style={{ color: "var(--accent-text)", opacity: 0.8 }}>
            Describí el problema y la IA arma el borrador del reporte.
          </span>
        </div>
        <span className="ml-auto text-[15px] shrink-0" style={{ color: "var(--accent-text)" }}>+</span>
      </button>
    );
  }

  return (
    <div
      className="rounded-[10px] p-3.5 mb-1"
      style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}
    >
      <div className="flex items-center gap-2">
        {Sparkles}
        <span className="text-[13px] font-semibold" style={{ color: "var(--accent-text)" }}>
          Redactar con IA
        </span>
      </div>

      <div className="mt-2.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="En Firefox, al editar una propiedad y tocar Guardar no pasa nada: ni error ni confirmación, y los cambios no se guardan."
            className="brg-input"
            style={{ padding: "9px 11px" }}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setText(""); }}
              className="brg-btn brg-btn-ghost brg-btn-sm"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={loading}
              className="brg-btn brg-btn-primary brg-btn-sm"
            >
              {loading ? "Generando…" : "Generar borrador"}
            </button>
          </div>
          <p className="text-[11px] mt-1.5" style={{ color: "var(--text-3)" }}>
            Describí lo que está fallando con el mayor detalle que puedas: qué hacías, qué esperabas que pasara y qué pasó en realidad.
          </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { type ProjectFormState } from "@/app/actions/projects";
import { useToastStore } from "@/lib/store/toastStore";

type Props = {
  action: (prevState: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  cancelHref: string;
  submitLabel: string;
  defaultName?: string;
  defaultPrefix?: string;
};

export function ProjectForm({
  action,
  cancelHref,
  submitLabel,
  defaultName = "",
  defaultPrefix = "",
}: Props) {
  const [state, formAction, pending] = useActionState<ProjectFormState, FormData>(
    action,
    {}
  );
  const toastError = useToastStore((s) => s.error);

  useEffect(() => {
    if (state.error) toastError(state.error);
  }, [state, toastError]);

  return (
    <form action={formAction} noValidate>
      <label className="brg-label">
        Nombre del proyecto <span style={{ color: "var(--danger)" }}>*</span>
      </label>
      <input
        type="text"
        name="name"
        defaultValue={defaultName}
        placeholder="Ej: Inmobiliaria SaaS, ERP de Gestión"
        aria-invalid={!!state.fieldErrors?.name}
        className={`brg-input ${state.fieldErrors?.name ? "brg-input-error" : ""}`}
        style={{ padding: "10px 12px" }}
      />
      {state.fieldErrors?.name && <p className="brg-error-text">{state.fieldErrors.name}</p>}

      <label className="brg-label" style={{ marginTop: "16px" }}>
        Prefijo <span style={{ color: "var(--danger)" }}>*</span>
      </label>
      <input
        type="text"
        name="prefix"
        maxLength={8}
        defaultValue={defaultPrefix}
        placeholder="Ej: INMO, NEXUS, ERP"
        aria-invalid={!!state.fieldErrors?.prefix}
        className={`brg-input uppercase ${state.fieldErrors?.prefix ? "brg-input-error" : ""}`}
        style={{ padding: "10px 12px", fontFamily: "var(--font-mono)" }}
      />
      {state.fieldErrors?.prefix ? (
        <p className="brg-error-text">{state.fieldErrors.prefix}</p>
      ) : (
        <p className="mt-1.5 text-[11.5px]" style={{ color: "var(--text-3)" }}>
          Se usa para el ID visible de los bugs:{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-text)" }}>INMO-001</span>
        </p>
      )}

      <div className="flex justify-end gap-2.5 mt-[18px]">
        <Link href={cancelHref} className="brg-btn brg-btn-secondary brg-btn-sm">
          Cancelar
        </Link>
        <button type="submit" disabled={pending} className="brg-btn brg-btn-primary brg-btn-sm">
          {pending ? "Guardando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

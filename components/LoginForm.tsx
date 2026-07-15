"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} noValidate>
      <label className="brg-label" style={{ marginTop: "22px" }}>Usuario</label>
      <input
        type="text"
        name="username"
        autoComplete="username"
        autoFocus
        className="brg-input"
        style={{ padding: "10px 12px" }}
      />

      <label className="brg-label" style={{ marginTop: "15px" }}>Contraseña</label>
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        className={`brg-input ${state.error ? "brg-input-error" : ""}`}
        style={{ padding: "10px 12px" }}
      />

      {state.error && (
        <div className="flex items-center gap-1.5 mt-1.5" style={{ fontSize: "11.5px", color: "var(--danger)" }}>
          <span className="font-bold">!</span>
          {state.error}
        </div>
      )}

      <label className="flex items-center gap-2 mt-[15px] cursor-pointer select-none">
        <input
          type="checkbox"
          name="remember"
          defaultChecked
          className="appearance-none w-4 h-4 rounded-[5px] shrink-0 cursor-pointer bg-no-repeat bg-center border bg-[var(--surface-2)] border-[var(--border-2)] checked:bg-[var(--accent)] checked:border-[var(--accent)] checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2014%2014%22%3E%3Cpolyline%20points%3D%223%2C7.5%206%2C10%2011%2C4%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')]"
        />
        <span className="text-[12.5px]" style={{ color: "var(--text-2)" }}>Mantener sesión iniciada</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="brg-btn brg-btn-primary w-full"
        style={{ marginTop: "20px", padding: "11px", borderRadius: "8px" }}
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

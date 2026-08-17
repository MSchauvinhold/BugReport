"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const inputCls =
  "w-full rounded-[9px] text-[13.5px] border outline-none transition-colors " +
  "bg-[#121316] border-[#2a2c31] text-[#e8e9eb] placeholder:text-[#565b64] " +
  "focus:border-[#6e63f6] focus:ring-2 focus:ring-[#6e63f6]/25";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} noValidate className="mt-7">
      <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "#c7cad0" }}>Usuario</label>
      <input
        type="text"
        name="username"
        autoComplete="username"
        autoFocus
        className={inputCls}
        style={{ padding: "11px 13px" }}
      />

      <label className="block text-[12px] font-semibold mb-1.5 mt-[15px]" style={{ color: "#c7cad0" }}>Contraseña</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="current-password"
          className={`${inputCls} ${state.error ? "!border-[#f0666b] focus:!ring-[#f0666b]/25" : ""}`}
          style={{ padding: "11px 40px 11px 13px" }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100"
          style={{ color: "#565b64", opacity: 0.7 }}
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          )}
        </button>
      </div>

      {state.error && (
        <div className="flex items-center gap-1.5 mt-2" style={{ fontSize: "11.5px", color: "#f0666b" }}>
          <span className="font-bold">!</span>
          {state.error}
        </div>
      )}

      <label className="flex items-center gap-2 mt-[17px] cursor-pointer select-none">
        <input
          type="checkbox"
          name="remember"
          defaultChecked
          className="appearance-none w-4 h-4 rounded-[5px] shrink-0 cursor-pointer bg-no-repeat bg-center border bg-[#1b1c20] border-[#34373d] checked:bg-[#6e63f6] checked:border-[#6e63f6] checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2210%22%20height%3D%2210%22%20viewBox%3D%220%200%2014%2014%22%3E%3Cpolyline%20points%3D%223%2C7.5%206%2C10%2011%2C4%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')]"
        />
        <span className="text-[12.5px]" style={{ color: "#9da1a9" }}>Mantener sesión iniciada</span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[9px] font-semibold text-[13.5px] text-white mt-5 transition-all hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          padding: "12px",
          background: "linear-gradient(180deg, #7168f8, #5c51e6)",
          boxShadow: "0 10px 26px -10px rgba(110,99,246,0.75)",
        }}
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}

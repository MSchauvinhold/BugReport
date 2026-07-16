"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const inputCls =
  "w-full rounded-[9px] text-[13.5px] border outline-none transition-colors " +
  "bg-[#121316] border-[#2a2c31] text-[#e8e9eb] placeholder:text-[#565b64] " +
  "focus:border-[#6e63f6] focus:ring-2 focus:ring-[#6e63f6]/25";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

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
      <input
        type="password"
        name="password"
        autoComplete="current-password"
        className={`${inputCls} ${state.error ? "!border-[#f0666b] focus:!ring-[#f0666b]/25" : ""}`}
        style={{ padding: "11px 13px" }}
      />

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

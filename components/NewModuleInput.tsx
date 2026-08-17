"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewModuleInput({ existing }: { existing: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go() {
    const name = value.trim();
    if (!name) return;
    router.push(`?module=${encodeURIComponent(name)}`);
  }

  return (
    <div className="brg-card p-[16px] flex items-center gap-2.5">
      <input
        type="text"
        list="existing-modules"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Nombre del módulo (ej: Login, POS, Reportes)…"
        className="brg-input flex-1"
        style={{ padding: "9px 12px" }}
      />
      {existing.length > 0 && (
        <datalist id="existing-modules">
          {existing.map((m) => <option key={m} value={m} />)}
        </datalist>
      )}
      <button onClick={go} disabled={!value.trim()} className="brg-btn brg-btn-primary brg-btn-sm shrink-0">
        + Agregar módulo
      </button>
    </div>
  );
}

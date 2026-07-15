"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { BUG_STATUSES } from "@/lib/bugStatus";

const SEVERITIES = ["Crítica", "Alta", "Media", "Baja"];
const PRIORITIES = ["P1", "P2", "P3", "P4"];
const STATUSES = [...BUG_STATUSES];

type Props = {
  modules: string[];
  count: number;
};

export function BugFilters({ modules, count }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const current = (key: string) => searchParams.get(key) ?? "";
  const anyActive = !!(current("severity") || current("priority") || current("status") || current("module"));

  return (
    <>
      <span className="text-xs mr-0.5" style={{ color: "var(--text-3)" }}>Filtrar</span>

      <FilterSelect label="Severidad" value={current("severity")} onChange={(v) => setFilter("severity", v)} options={SEVERITIES} />
      <FilterSelect label="Prioridad" value={current("priority")} onChange={(v) => setFilter("priority", v)} options={PRIORITIES} />
      <FilterSelect label="Estado" value={current("status")} onChange={(v) => setFilter("status", v)} options={STATUSES} />
      {modules.length > 0 && (
        <FilterSelect label="Módulo" value={current("module")} onChange={(v) => setFilter("module", v)} options={modules} />
      )}

      {anyActive && (
        <button
          onClick={() => router.push(pathname)}
          className="text-xs font-semibold"
          style={{ color: "var(--danger)" }}
        >
          Limpiar
        </button>
      )}

      <div className="flex-1" />
      <span className="text-xs" style={{ color: "var(--text-3)" }}>
        {count} {count === 1 ? "bug" : "bugs"}
      </span>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const active = !!value;
  return (
    <div
      className="relative inline-flex items-center rounded-[7px]"
      style={{
        background: active ? "var(--accent-soft)" : "var(--surface)",
        border: `1px solid ${active ? "var(--accent)" : "var(--border-2)"}`,
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent cursor-pointer pl-[11px] pr-7 py-1.5 text-xs font-medium focus:outline-none"
        style={{ color: active ? "var(--accent-text)" : "var(--text-2)" }}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>{label}: {o}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 text-[10px]" style={{ color: active ? "var(--accent-text)" : "var(--text-3)" }}>▾</span>
    </div>
  );
}

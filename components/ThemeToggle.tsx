"use client";

import { useCallback, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function getSnapshot(): Theme {
  return (document.documentElement.getAttribute("data-theme") as Theme) || "light";
}

export function ThemeToggle() {
  // En el server no hay tema definido por el usuario → "light" como en el HTML inicial
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as Theme);

  const apply = useCallback((next: Theme) => {
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }, []);

  const btn = (value: Theme, label: string) => {
    const on = theme === value;
    return (
      <button
        onClick={() => apply(value)}
        aria-pressed={on}
        className="cursor-pointer rounded-md px-3 py-[5px] text-xs font-semibold transition-colors"
        style={{
          background: on ? "var(--surface)" : "transparent",
          color: on ? "var(--text)" : "var(--text-3)",
          boxShadow: on ? "0 1px 2px rgba(0,0,0,.08)" : "none",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className="inline-flex p-[3px] rounded-[9px] gap-[2px] border"
      style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
    >
      {btn("light", "Claro")}
      {btn("dark", "Oscuro")}
    </div>
  );
}

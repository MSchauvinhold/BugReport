"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SeverityBadge } from "./SeverityBadge";

type SearchProject = { id: string; name: string; prefix: string };
type SearchBug = { id: string; projectId: string; title: string; severity: string; status: string; visibleId: string };
type Results = { projects: SearchProject[]; bugs: SearchBug[] };

const EMPTY: Results = { projects: [], bugs: [] };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lista plana para navegación con teclado
  const items: { href: string; key: string }[] = [
    ...results.projects.map((p) => ({ href: `/projects/${p.id}`, key: `p-${p.id}` })),
    ...results.bugs.map((b) => ({ href: `/projects/${b.projectId}/bugs/${b.id}`, key: `b-${b.id}` })),
  ];

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
    setActive(0);
  }, []);

  // Atajo ⌘K / Ctrl+K y evento del sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Búsqueda con debounce (los setState viven dentro del callback diferido)
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      if (q.length < 1) {
        setResults(EMPTY);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          setResults(await res.json());
          setActive(0);
        }
      } catch {
        /* abortado o error de red */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { close(); return; }
    if (items.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + items.length) % items.length); }
    else if (e.key === "Enter") { e.preventDefault(); const it = items[active]; if (it) go(it.href); }
  }

  if (!open) return null;

  let idx = -1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      style={{ background: "rgba(0,0,0,.4)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-[560px] brg-card overflow-hidden"
        style={{ borderRadius: "14px", boxShadow: "0 12px 40px rgba(0,0,0,.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 px-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color: "var(--text-3)" }}>
            <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.4" />
            <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Buscar bugs por título o ID, o un proyecto…"
            className="flex-1 bg-transparent border-none outline-none py-3.5 text-[14px]"
            style={{ color: "var(--text)" }}
          />
          <span className="text-[10px] font-mono px-[5px] py-px rounded" style={{ background: "var(--surface-3)", color: "var(--text-3)" }}>ESC</span>
        </div>

        <div className="max-h-[52vh] overflow-y-auto py-2">
          {query.trim().length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--text-3)" }}>
              Escribí para buscar entre tus proyectos y bugs.
            </div>
          ) : loading && items.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--text-3)" }}>Buscando…</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--text-3)" }}>Sin resultados para “{query}”.</div>
          ) : (
            <>
              {results.projects.length > 0 && (
                <div className="px-3 pt-1 pb-1.5 text-[10px] font-bold tracking-wider" style={{ color: "var(--text-3)" }}>PROYECTOS</div>
              )}
              {results.projects.map((p) => {
                idx++;
                const on = idx === active;
                return (
                  <button
                    key={p.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(`/projects/${p.id}`)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left"
                    style={{ background: on ? "var(--surface-2)" : "transparent" }}
                  >
                    <span className="brg-prefix shrink-0">{p.prefix}</span>
                    <span className="text-[13px]" style={{ color: "var(--text)" }}>{p.name}</span>
                  </button>
                );
              })}

              {results.bugs.length > 0 && (
                <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-wider" style={{ color: "var(--text-3)" }}>BUGS</div>
              )}
              {results.bugs.map((b) => {
                idx++;
                const on = idx === active;
                return (
                  <button
                    key={b.id}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => go(`/projects/${b.projectId}/bugs/${b.id}`)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-left"
                    style={{ background: on ? "var(--surface-2)" : "transparent" }}
                  >
                    <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--accent-text)" }}>{b.visibleId}</span>
                    <span className="text-[13px] truncate flex-1" style={{ color: "var(--text)" }}>{b.title}</span>
                    <SeverityBadge severity={b.severity} />
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

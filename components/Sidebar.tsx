"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BugLogo } from "@/components/BugLogo";

type SidebarProject = { id: string; name: string; prefix: string; bugCount: number };

export function Sidebar({
  username,
  projects,
}: {
  username: string;
  projects: SidebarProject[];
}) {
  const pathname = usePathname();
  const onProjectsHome = pathname === "/projects";
  const initial = username.charAt(0).toUpperCase();

  return (
    <aside
      className="flex flex-col h-full w-60 shrink-0 px-3 py-3.5"
      style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <Link href="/projects" className="flex items-center gap-2.5 px-1.5 pt-0.5">
        <div
          className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <BugLogo size={16} />
        </div>
        <div className="flex flex-col leading-[1.15] min-w-0">
          <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Bug Report</span>
          <span className="text-[9.5px] font-mono tracking-wide" style={{ color: "var(--text-3)" }}>QA TOOLING</span>
        </div>
      </Link>

      {/* Buscar — abre el command palette */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
        className="flex items-center gap-2 mt-3.5 px-2.5 py-[7px] rounded-lg w-full transition-colors hover:border-[var(--accent)]"
        style={{ border: "1px solid var(--border-2)", background: "var(--surface)", color: "var(--text-3)" }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4.2" stroke="currentColor" strokeWidth="1.4" />
          <line x1="10.4" y1="10.4" x2="14" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="text-[12.5px] flex-1 text-left">Buscar…</span>
        <span className="text-[10px] font-mono px-[5px] py-px rounded" style={{ background: "var(--surface-3)" }}>⌘K</span>
      </button>

      {/* Nav: Proyectos */}
      <Link
        href="/projects"
        className="flex items-center gap-2.5 mt-3.5 px-2.5 py-[7px] rounded-[7px] text-[13px] font-semibold transition-colors"
        style={{
          background: onProjectsHome ? "var(--accent-soft)" : "transparent",
          color: onProjectsHome ? "var(--accent-text)" : "var(--text-2)",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9" y="2" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <rect x="2" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <rect x="9" y="9" width="5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        Proyectos
      </Link>

      {/* Lista de proyectos */}
      {projects.length > 0 && (
        <>
          <div
            className="text-[10px] font-bold tracking-[0.08em] mt-4 mb-1.5 pl-2.5"
            style={{ color: "var(--text-3)" }}
          >
            PROYECTOS
          </div>
          <nav className="flex flex-col gap-0.5 overflow-y-auto">
            {projects.map((p) => {
              const active = pathname.startsWith(`/projects/${p.id}`);
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] transition-colors"
                  style={{ background: active ? "var(--surface-2)" : "transparent" }}
                >
                  <span
                    className="font-mono text-[9.5px] px-[5px] py-px rounded shrink-0"
                    style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
                  >
                    {p.prefix}
                  </span>
                  <span
                    className="text-[12.5px] flex-1 truncate"
                    style={{ color: active ? "var(--text)" : "var(--text-2)", fontWeight: active ? 600 : 400 }}
                  >
                    {p.name}
                  </span>
                  <span className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>
                    {p.bugCount}
                  </span>
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <div className="flex-1" />

      {/* Theme toggle */}
      <div className="px-1.5 pb-2">
        <ThemeToggle />
      </div>

      {/* Usuario + logout */}
      <div
        className="flex items-center gap-2.5 pt-2 px-1.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="w-[27px] h-[27px] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
          style={{ background: "var(--surface-3)", color: "var(--text-2)" }}
        >
          {initial}
        </div>
        <div className="flex flex-col leading-[1.25] min-w-0 flex-1">
          <span className="text-[12.5px] font-semibold truncate" style={{ color: "var(--text)" }}>{username}</span>
          <span className="text-[10.5px]" style={{ color: "var(--text-3)" }}>QA</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="cursor-pointer p-1.5 rounded-md transition-colors"
            style={{ color: "var(--text-3)" }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M6 14H3.5A1.5 1.5 0 012 12.5v-9A1.5 1.5 0 013.5 2H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M10.5 11L14 8l-3.5-3M14 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    </aside>
  );
}

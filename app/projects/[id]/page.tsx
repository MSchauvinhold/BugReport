import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { SeverityBadge } from "@/components/SeverityBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { BugFilters } from "@/components/BugFilters";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    severity?: string;
    priority?: string;
    status?: string;
    module?: string;
  }>;
};

export default async function ProjectPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const filters = await searchParams;

  const user = await requireUser();
  const projectData = await prisma.project.findFirst({
    where: { id, userId: user.id },
  });
  if (!projectData) notFound();
  const project = projectData!;

  const where = {
    projectId: id,
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.module ? { module: filters.module } : {}),
  };

  const bugs = await prisma.bug.findMany({
    where,
    orderBy: { bugNumber: "desc" },
  });

  const allModules = await prisma.bug.findMany({
    where: { projectId: id, module: { not: null } },
    select: { module: true },
    distinct: ["module"],
  });
  const modules = allModules.map((b) => b.module as string);

  function bugId(bugNumber: number) {
    return `${project.prefix}-${bugNumber.toString().padStart(3, "0")}`;
  }

  function shortDate(d: Date) {
    return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center justify-between px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/projects" className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>‹</Link>
          <span className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>{project.name}</span>
          <span className="brg-prefix shrink-0">{project.prefix}</span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href={`/projects/${id}/dashboard`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Panel
          </Link>
          <Link href={`/projects/${id}/test-cases`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Casos de prueba
          </Link>
          <Link href={`/projects/${id}/edit`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Editar proyecto
          </Link>
          <Link href={`/projects/${id}/bugs/new`} className="brg-btn brg-btn-primary brg-btn-sm">
            <span className="text-base leading-none">+</span> Nuevo bug
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-[22px] py-4 flex items-center gap-2 flex-wrap">
          <BugFilters modules={modules} count={bugs.length} />
        </div>

        {bugs.length === 0 ? (
          <div className="mx-[22px] brg-card py-16 text-center" style={{ borderRadius: "11px" }}>
            <div className="text-[13px]" style={{ color: "var(--text-3)" }}>
              {hasFilters
                ? "No hay bugs que coincidan con los filtros aplicados"
                : "Todavía no hay bugs en este proyecto"}
            </div>
          </div>
        ) : (
          <div className="mx-[22px] mb-[22px] brg-card overflow-x-auto" style={{ borderRadius: "11px" }}>
            <div style={{ minWidth: "720px" }}>
              {/* header */}
              <div
                className="grid items-center gap-3 px-4 py-[9px]"
                style={{
                  gridTemplateColumns: "88px 1fr 104px 48px 110px 150px 70px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--surface-2)",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  letterSpacing: ".04em",
                  color: "var(--text-3)",
                }}
              >
                <span>ID</span><span>TÍTULO</span><span>SEVERIDAD</span><span>PRIO</span><span>ESTADO</span><span>MÓDULO</span><span>FECHA</span>
              </div>
              {/* rows */}
              {bugs.map((bug, i) => {
                const resolved = bug.status === "Cerrado";
                return (
                  <Link
                    key={bug.id}
                    href={`/projects/${id}/bugs/${bug.id}`}
                    className="grid items-center gap-3 px-4 transition-colors hover:bg-[var(--surface-2)]"
                    style={{
                      gridTemplateColumns: "88px 1fr 104px 48px 110px 150px 70px",
                      padding: "var(--row-py, 9px) 16px",
                      borderBottom: i < bugs.length - 1 ? "1px solid var(--border)" : "none",
                      opacity: resolved ? 0.62 : 1,
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "var(--accent-text)" }}>
                      {bugId(bug.bugNumber)}
                    </span>
                    <span className="truncate" style={{ fontSize: "12.5px", color: "var(--text)" }}>{bug.title}</span>
                    <span><SeverityBadge severity={bug.severity} /></span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "var(--text-2)" }}>{bug.priority}</span>
                    <span><StatusBadge status={bug.status} /></span>
                    <span className="truncate" style={{ fontSize: "11.5px", color: "var(--text-2)" }}>{bug.module || "—"}</span>
                    <span style={{ fontSize: "11.5px", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{shortDate(bug.createdAt)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

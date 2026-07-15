import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export default async function ProjectsPage() {
  const user = await requireUser();
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bugs: true } } },
  });

  // Conteo de bugs críticos por proyecto para el indicador de la card
  const criticals = await prisma.bug.groupBy({
    by: ["projectId"],
    where: { severity: "Crítica", project: { userId: user.id } },
    _count: { _all: true },
  });
  const critByProject = new Map(criticals.map((c) => [c.projectId, c._count._all]));

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center justify-between px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Proyectos</div>
        <Link href="/projects/new" className="brg-btn brg-btn-primary brg-btn-sm">
          <span className="text-base leading-none">+</span> Nuevo proyecto
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {projects.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div
                className="w-[54px] h-[54px] rounded-[15px] mx-auto flex items-center justify-center text-[26px]"
                style={{ border: "1.5px dashed var(--border-2)", color: "var(--text-3)" }}
              >
                +
              </div>
              <div className="text-base font-semibold mt-4" style={{ color: "var(--text)" }}>
                Todavía no hay proyectos
              </div>
              <div className="text-[13px] mt-1.5 max-w-[280px]" style={{ color: "var(--text-3)" }}>
                Creá tu primer proyecto y empezá a cargar y exportar bugs en segundos.
              </div>
              <Link
                href="/projects/new"
                className="brg-btn brg-btn-primary mt-[18px]"
                style={{ padding: "10px 18px" }}
              >
                + Nuevo proyecto
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-[22px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 content-start">
            {projects.map((project) => {
              const crit = critByProject.get(project.id) ?? 0;
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="brg-card p-[17px] transition-all hover:border-[var(--accent)]"
                  style={{ borderRadius: "12px" }}
                >
                  <div className="flex justify-between items-start">
                    <span className="brg-prefix">{project.prefix}</span>
                    <span style={{ color: "var(--text-3)" }}>›</span>
                  </div>
                  <div className="text-[14.5px] font-semibold mt-3" style={{ color: "var(--text)" }}>
                    {project.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-[7px]">
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>
                      {project._count.bugs} {project._count.bugs === 1 ? "bug" : "bugs"}
                    </span>
                    {crit > 0 && (
                      <>
                        <span className="w-[3px] h-[3px] rounded-full" style={{ background: "var(--text-3)" }} />
                        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--sev-crit-fg)" }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sev-crit-dot)" }} />
                          {crit} {crit === 1 ? "crítica" : "críticas"}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}

            <Link
              href="/projects/new"
              className="flex flex-col items-center justify-center gap-1 min-h-[104px] rounded-[12px] transition-colors"
              style={{ border: "1.5px dashed var(--border-2)", color: "var(--text-3)" }}
            >
              <span className="text-[22px]">+</span>
              <span className="text-xs">Nuevo proyecto</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BugForm, type BugFormInit } from "@/components/BugForm";
import { GuardedBackLink } from "@/components/GuardedBackLink";

type PageProps = { params: Promise<{ id: string; bugId: string }> };

export default async function EditBugPage({ params }: PageProps) {
  const { id, bugId } = await params;
  const user = await requireUser();

  const bug = await prisma.bug.findFirst({
    where: { id: bugId, projectId: id, project: { userId: user.id } },
  });
  if (!bug) notFound();

  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const modulesRaw = await prisma.bug.findMany({
    where: { projectId: id, module: { not: null } },
    select: { module: true },
    distinct: ["module"],
  });
  const modules = modulesRaw.map((b) => b.module as string);

  const visibleId = `${project.prefix}-${bug.bugNumber.toString().padStart(3, "0")}`;

  const initial: BugFormInit = {
    title: bug.title,
    description: bug.description,
    severity: bug.severity,
    priority: bug.priority,
    steps: bug.steps.length ? bug.steps : [""],
    expected: bug.expected,
    actual: bug.actual,
    notes: bug.notes,
    environment: bug.environment ?? "",
    module: bug.module ?? "",
    tags: bug.tags,
    screenshots: bug.screenshots,
  };

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center justify-between px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GuardedBackLink href={`/projects/${id}/bugs/${bugId}`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>
            ‹
          </GuardedBackLink>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold truncate" style={{ color: "var(--text)" }}>Editar bug</div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
              {visibleId} · {project.name}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <GuardedBackLink href={`/projects/${id}/bugs/${bugId}`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Cancelar
          </GuardedBackLink>
          <button type="submit" form="bug-form" className="brg-btn brg-btn-primary brg-btn-sm">
            Guardar cambios
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[640px] mx-auto">
          <BugForm projectId={id} modules={modules} initial={initial} editBugId={bugId} />
        </div>
      </div>
    </>
  );
}

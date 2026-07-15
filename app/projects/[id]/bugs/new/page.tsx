import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { BugForm, type BugFormInit } from "@/components/BugForm";
import { GuardedBackLink } from "@/components/GuardedBackLink";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; fromTest?: string }>;
};

export default async function NewBugPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { from, fromTest } = await searchParams;
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const modulesRaw = await prisma.bug.findMany({
    where: { projectId: id, module: { not: null } },
    select: { module: true },
    distinct: ["module"],
  });
  const modules = modulesRaw.map((b) => b.module as string);

  // Duplicado: precargamos el formulario desde un bug existente del mismo proyecto
  let initial: BugFormInit | undefined;
  let duplicatedFromNumber: number | undefined;
  if (from) {
    const src = await prisma.bug.findFirst({
      where: { id: from, projectId: id, project: { userId: user.id } },
    });
    if (src) {
      initial = {
        title: `${src.title} (copia)`,
        description: src.description,
        severity: src.severity,
        priority: src.priority,
        steps: src.steps,
        expected: src.expected,
        actual: src.actual,
        notes: src.notes,
        environment: src.environment ?? "",
        module: src.module ?? "",
        tags: src.tags,
      };
      duplicatedFromNumber = src.bugNumber;
    }
  } else if (fromTest) {
    const tc = await prisma.testCase.findFirst({
      where: { id: fromTest, projectId: id, project: { userId: user.id } },
    });
    if (tc) {
      initial = {
        title: `Falla en: ${tc.title}`,
        steps: tc.steps,
        expected: tc.expectedResult,
        actual: "",
        module: "",
        tags: [],
      };
    }
  }

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center justify-between px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <GuardedBackLink href={`/projects/${id}`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>
            ‹
          </GuardedBackLink>
          <div className="min-w-0">
            <div className="text-[14.5px] font-semibold truncate" style={{ color: "var(--text)" }}>{from ? "Duplicar bug" : fromTest ? "Reportar bug desde caso" : "Nuevo bug"}</div>
            <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>
              {project.name} · {project.prefix}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <GuardedBackLink href={`/projects/${id}`} className="brg-btn brg-btn-secondary brg-btn-sm">
            Cancelar
          </GuardedBackLink>
          <button type="submit" form="bug-form" className="brg-btn brg-btn-primary brg-btn-sm">
            Guardar bug
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[640px] mx-auto">
          <BugForm projectId={id} modules={modules} initial={initial} duplicatedFromNumber={duplicatedFromNumber} />
        </div>
      </div>
    </>
  );
}

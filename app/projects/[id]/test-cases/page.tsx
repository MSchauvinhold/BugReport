import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { TestCaseGenerator } from "@/components/TestCaseGenerator";
import { SavedTestCases } from "@/components/SavedTestCases";

type PageProps = { params: Promise<{ id: string }> };

export default async function TestCasesPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const testCases = await prisma.testCase.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center gap-2.5 px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <Link href={`/projects/${id}`} className="text-lg shrink-0" style={{ color: "var(--text-3)" }}>‹</Link>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: "var(--text)" }}>Generador de casos de prueba</div>
          <div className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{project.name} · {project.prefix}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-[22px]">
        <div className="max-w-[820px] mx-auto flex flex-col gap-4">
          <TestCaseGenerator projectId={id} />
          <SavedTestCases
            projectId={id}
            cases={testCases.map((c) => ({
              id: c.id,
              title: c.title,
              preconditions: c.preconditions,
              steps: c.steps,
              expectedResult: c.expectedResult,
              status: c.status,
            }))}
          />
        </div>
      </div>
    </>
  );
}

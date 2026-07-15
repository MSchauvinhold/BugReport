import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProject, deleteProject } from "@/app/actions/projects";
import { requireUser } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";
import { ProjectForm } from "@/components/ProjectForm";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser();
  const project = await prisma.project.findFirst({ where: { id, userId: user.id } });
  if (!project) notFound();

  const updateWithId = updateProject.bind(null, id);
  const deleteWithId = deleteProject.bind(null, id);

  return (
    <>
      <div
        className="h-14 shrink-0 flex items-center gap-2.5 px-[22px]"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
      >
        <Link href={`/projects/${id}`} className="text-lg" style={{ color: "var(--text-3)" }}>‹</Link>
        <div className="text-[15px] font-semibold" style={{ color: "var(--text)" }}>Editar proyecto</div>
      </div>

      <div className="flex-1 overflow-y-auto p-[26px]">
        <div className="max-w-[540px] mx-auto">
          <div className="brg-card p-[22px]">
            <ProjectForm
              action={updateWithId}
              cancelHref={`/projects/${id}`}
              submitLabel="Guardar cambios"
              defaultName={project.name}
              defaultPrefix={project.prefix}
            />
          </div>

          <div
            className="rounded-[12px] p-5 mt-[18px]"
            style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}
          >
            <div className="text-[13px] font-bold" style={{ color: "var(--danger)" }}>Zona de peligro</div>
            <div className="text-[12.5px] mt-1.5" style={{ color: "var(--text-2)" }}>
              Eliminar el proyecto borrará también todos sus bugs. Esta acción no se puede deshacer.
            </div>
            <div className="mt-3">
              <DeleteButton
                action={deleteWithId}
                label="Eliminar proyecto"
                confirmMessage={`¿Eliminar el proyecto "${project.name}" y todos sus bugs? Esta acción no se puede deshacer.`}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

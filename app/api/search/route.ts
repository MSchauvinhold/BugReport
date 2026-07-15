import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 1) return NextResponse.json({ projects: [], bugs: [] });

  const digits = q.replace(/\D/g, "");

  const [projects, bugs] = await Promise.all([
    prisma.project.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { prefix: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, prefix: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.bug.findMany({
      where: {
        project: { userId: user.id },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          ...(digits ? [{ bugNumber: parseInt(digits, 10) }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        bugNumber: true,
        project: { select: { id: true, prefix: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    projects,
    bugs: bugs.map((b) => ({
      id: b.id,
      projectId: b.project.id,
      title: b.title,
      severity: b.severity,
      status: b.status,
      visibleId: `${b.project.prefix}-${String(b.bugNumber).padStart(3, "0")}`,
    })),
  });
}

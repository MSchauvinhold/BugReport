import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateBugDraft } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "La generación con IA no está configurada en el servidor." },
      { status: 503 }
    );
  }

  let description = "";
  let modules: string[] = [];
  try {
    const body = await req.json();
    description = (body.description ?? "").toString().trim();
    if (Array.isArray(body.modules)) modules = body.modules.filter((m: unknown) => typeof m === "string");
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (description.length < 5) {
    return NextResponse.json(
      { error: "Escribí una descripción un poco más detallada." },
      { status: 400 }
    );
  }

  try {
    const draft = await generateBugDraft(description, modules);
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("generateBugDraft error:", err);
    if (err instanceof Error && /credit balance|too low/i.test(err.message)) {
      return NextResponse.json(
        { error: "La cuenta de Anthropic no tiene créditos. Cargá saldo en console.anthropic.com." },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "No se pudo generar el bug con IA. Intentá de nuevo." },
      { status: 502 }
    );
  }
}

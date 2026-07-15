import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { generateTestCases } from "@/lib/ai";

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
  try {
    const body = await req.json();
    description = (body.description ?? "").toString().trim();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (description.length < 5) {
    return NextResponse.json(
      { error: "Describí la funcionalidad con un poco más de detalle." },
      { status: 400 }
    );
  }

  try {
    const testCases = await generateTestCases(description);
    return NextResponse.json({ testCases });
  } catch (err) {
    console.error("generateTestCases error:", err);
    if (err instanceof Error && /credit balance|too low/i.test(err.message)) {
      return NextResponse.json(
        { error: "La cuenta de Anthropic no tiene créditos. Cargá saldo en console.anthropic.com." },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "No se pudieron generar los casos de prueba. Intentá de nuevo." },
      { status: 502 }
    );
  }
}

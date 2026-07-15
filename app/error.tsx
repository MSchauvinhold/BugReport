"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--app)" }}>
      <div className="brg-card max-w-md w-full p-8 text-center">
        <div
          className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 text-xl font-bold"
          style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
        >
          !
        </div>
        <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>Algo salió mal</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-3)" }}>
          Ocurrió un error inesperado. Podés reintentar o volver al inicio.
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={reset} className="brg-btn brg-btn-primary">Reintentar</button>
          <Link href="/projects" className="brg-btn brg-btn-secondary">Ir a proyectos</Link>
        </div>
      </div>
    </div>
  );
}

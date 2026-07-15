"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="brg-btn brg-btn-primary brg-btn-sm no-print">
      Imprimir / Guardar PDF
    </button>
  );
}

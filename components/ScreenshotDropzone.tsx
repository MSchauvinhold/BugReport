"use client";

import { useCallback, useRef } from "react";
import { useBugFormStore } from "@/lib/store/bugFormStore";
import { useToastStore } from "@/lib/store/toastStore";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export function ScreenshotDropzone() {
  const screenshots = useBugFormStore((s) => s.screenshots);
  const uploading = useBugFormStore((s) => s.uploadingCount);
  const { addScreenshot, removeScreenshot, startUpload, finishUpload } = useBugFormStore();
  const toast = useToastStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" no es una imagen y fue ignorado.`);
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error(`"${file.name}" supera los 10 MB y no se pudo subir.`);
        return;
      }

      startUpload();
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Falló la subida");
        }
        const { url } = await res.json();
        addScreenshot(url);
      } catch (err) {
        console.error("upload error:", err);
        toast.error(`No se pudo subir "${file.name}". Reintentá.`);
      } finally {
        finishUpload();
      }
    },
    [addScreenshot, startUpload, finishUpload, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      Array.from(e.dataTransfer.files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      Array.from(e.clipboardData.files).forEach(uploadFile);
    },
    [uploadFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Array.from(e.target.files ?? []).forEach(uploadFile);
      e.target.value = "";
    },
    [uploadFile]
  );

  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={onPaste}
        onClick={() => inputRef.current?.click()}
        tabIndex={0}
        className="rounded-[10px] p-[18px] text-center cursor-pointer transition-colors focus:outline-none"
        style={{ border: "1.5px dashed var(--border-2)", background: "var(--surface-2)" }}
      >
        <div
          className="w-[34px] h-[34px] rounded-[9px] mx-auto flex items-center justify-center"
          style={{ background: "var(--surface-3)", color: "var(--text-3)" }}
        >
          <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="3.5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="6" cy="7.5" r="1.3" fill="currentColor" />
            <polyline points="3,13 7,9 10,11.5 13,8 16,11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-[12.5px] mt-2.5" style={{ color: "var(--text-2)" }}>
          Arrastrá imágenes, pegá con{" "}
          <span className="font-mono text-[11px] px-[5px] py-px rounded" style={{ background: "var(--surface-3)" }}>Ctrl+V</span>{" "}
          o hacé click
        </div>
        <div className="text-[11px] mt-1 font-mono" style={{ color: "var(--text-3)" }}>PNG · JPG · GIF — hasta 10 MB</div>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFileChange} />
      </div>

      {(screenshots.length > 0 || uploading > 0) && (
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {screenshots.map((url, i) => (
            <div key={url} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Evidencia ${i + 1}`}
                className="h-[62px] w-[78px] object-cover rounded-lg"
                style={{ border: "1px solid var(--border-2)" }}
              />
              <button
                type="button"
                onClick={() => removeScreenshot(url)}
                className="absolute top-[3px] right-[3px] rounded-full w-4 h-4 flex items-center justify-center text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}
                aria-label="Quitar imagen"
              >
                ×
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div
              key={`uploading-${i}`}
              className="h-[62px] w-[78px] rounded-lg flex items-center justify-center"
              style={{ border: "1px solid var(--border-2)", background: "var(--surface-2)" }}
            >
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

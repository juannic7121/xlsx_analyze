"use client";

import { useCallback, useId, useRef, useState } from "react";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type DatasetSource = "none" | "file" | "paste";

interface DatasetInputProps {
  title: string;
  description: string;
  text: string;
  fileName: string | null;
  source: DatasetSource;
  recordCount: number | null;
  onChange: (payload: {
    text: string;
    source: DatasetSource;
    fileName: string | null;
  }) => void;
  onClear: () => void;
}

export function DatasetInput({
  title,
  description,
  text,
  fileName,
  source,
  recordCount,
  onChange,
  onClear,
}: DatasetInputProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback(
    async (file: File) => {
      setFileError(null);

      const isTxt =
        file.name.toLowerCase().endsWith(".txt") ||
        file.type === "text/plain" ||
        file.type === "";

      if (!isTxt) {
        setFileError("Solo se permiten archivos .txt.");
        return;
      }

      if (file.size > MAX_FILE_BYTES) {
        setFileError("El archivo supera el tamaño máximo de 5 MB.");
        return;
      }

      try {
        const content = await file.text();
        if (!content.trim()) {
          setFileError("El archivo seleccionado no contiene datos válidos.");
          return;
        }
        onChange({ text: content, source: "file", fileName: file.name });
      } catch {
        setFileError("No se pudo leer el archivo.");
      }
    },
    [onChange],
  );

  const sourceLabel =
    source === "file" && fileName
      ? `Fuente activa: archivo «${fileName}»`
      : source === "paste"
        ? "Fuente activa: texto pegado"
        : "Sin datos";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {recordCount !== null && (
          <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800">
            <span className="font-medium">Total de registros:</span>{" "}
            <span className="tabular-nums">{recordCount}</span>
          </div>
        )}
      </div>

      <div
        className={`mb-4 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-teal-500 bg-teal-50"
            : "border-slate-300 bg-slate-50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) await readFile(file);
        }}
      >
        <p className="mb-3 text-sm text-slate-600">
          Arrastre un archivo .txt aquí o selecciónelo
        </p>
        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) await readFile(file);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          onClick={() => fileRef.current?.click()}
        >
          Cargar archivo TXT
        </button>
        {fileName && source === "file" && (
          <p className="mt-2 text-xs text-slate-500">Archivo: {fileName}</p>
        )}
      </div>

      <label className="mb-1 block text-sm font-medium text-slate-700">
        Pegar datos
      </label>
      <textarea
        value={text}
        onChange={(e) => {
          setFileError(null);
          onChange({
            text: e.target.value,
            source: e.target.value.trim() ? "paste" : "none",
            fileName: null,
          });
        }}
        placeholder="Pegue aquí un código de 4 dígitos por línea…"
        className="h-48 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-900 outline-none ring-teal-500 focus:ring-2"
        spellCheck={false}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{sourceLabel}</p>
        <button
          type="button"
          onClick={() => {
            setFileError(null);
            onClear();
          }}
          className="text-sm text-slate-600 underline-offset-2 hover:underline"
        >
          Limpiar sección
        </button>
      </div>

      {fileError && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {fileError}
        </p>
      )}
    </section>
  );
}

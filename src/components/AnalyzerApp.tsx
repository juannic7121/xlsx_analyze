"use client";

import { useMemo, useState, useTransition } from "react";
import { DatasetInput, type DatasetSource } from "@/components/DatasetInput";
import { ResultsPanel } from "@/components/ResultsPanel";
import { analyzeDatasets } from "@/lib/statistics";
import { parseDataset } from "@/lib/parser";
import type { AnalysisResult } from "@/types/analysis";

interface DatasetState {
  text: string;
  fileName: string | null;
  source: DatasetSource;
}

const emptyDataset = (): DatasetState => ({
  text: "",
  fileName: null,
  source: "none",
});

export function AnalyzerApp() {
  const [ger, setGer] = useState<DatasetState>(emptyDataset);
  const [comparison, setComparison] = useState<DatasetState>(emptyDataset);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const gerCount = useMemo(() => {
    if (!ger.text.trim()) return null;
    return parseDataset(ger.text).records.length;
  }, [ger.text]);

  const comparisonCount = useMemo(() => {
    if (!comparison.text.trim()) return null;
    return parseDataset(comparison.text).records.length;
  }, [comparison.text]);

  const handleAnalyze = () => {
    setError(null);
    setWarning(null);

    startTransition(() => {
      const output = analyzeDatasets({
        gerText: ger.text,
        comparisonText: comparison.text,
      });

      if (!output.ok) {
        setResult(null);
        setError(output.error);
        return;
      }

      setResult(output.result);

      if (
        output.ger.records.length !== output.ger.unique.length ||
        output.comparison.records.length !== output.comparison.unique.length
      ) {
        setWarning(
          `Se detectaron duplicados. El análisis usa permutaciones únicas (Ger: ${output.ger.unique.length}, comparación: ${output.comparison.unique.length}).`,
        );
      }
    });
  };

  const handleClearAll = () => {
    setGer(emptyDataset());
    setComparison(emptyDataset());
    setResult(null);
    setError(null);
    setWarning(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          Análisis Código B
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Comparación Ger vs dataset
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Cargue o pegue el listado base Ger y el listado a comparar. La
          aplicación calcula firmas, coincidencias, coberturas, Jaccard y
          exclusivas de forma automática y determinista.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={isPending}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Analizando..." : "Analizar"}
        </button>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={isPending}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Limpiar
        </button>
      </div>

      {isPending && (
        <div className="mb-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Analizando... Esto puede tardar unos segundos con listas grandes.
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {warning && !error && !isPending && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {warning}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DatasetInput
          title="Archivo Ger"
          description="Dataset base / de referencia. Un código de 4 dígitos por línea."
          text={ger.text}
          fileName={ger.fileName}
          source={ger.source}
          recordCount={gerCount}
          onChange={(payload) => {
            setGer(payload);
            setResult(null);
            setError(null);
            setWarning(null);
          }}
          onClear={() => {
            setGer(emptyDataset());
            setResult(null);
            setError(null);
            setWarning(null);
          }}
        />
        <DatasetInput
          title="Archivo a comparar"
          description="Segundo dataset. Se compara contra Ger en esta sesión."
          text={comparison.text}
          fileName={comparison.fileName}
          source={comparison.source}
          recordCount={comparisonCount}
          onChange={(payload) => {
            setComparison(payload);
            setResult(null);
            setError(null);
            setWarning(null);
          }}
          onClear={() => {
            setComparison(emptyDataset());
            setResult(null);
            setError(null);
            setWarning(null);
          }}
        />
      </div>

      {result && !isPending && (
        <div className="mt-10">
          <ResultsPanel result={result} comparisonLabel="Comparación" />
        </div>
      )}
    </div>
  );
}

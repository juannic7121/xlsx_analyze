"use client";

import { useEffect, useState } from "react";
import type { AnalysisResult } from "@/types/analysis";
import { formatSharedPermutations } from "@/lib/comparison";

type ResultTab =
  | "resumen"
  | "firmas"
  | "ranking"
  | "exclusivasGer"
  | "exclusivasComparacion";

interface ResultsPanelProps {
  result: AnalysisResult;
  comparisonLabel?: string;
}

const TABS: Array<{ id: ResultTab; label: string }> = [
  { id: "resumen", label: "Resumen" },
  { id: "firmas", label: "Firmas Compartidas" },
  { id: "ranking", label: "Ranking" },
  { id: "exclusivasGer", label: "Exclusivas Ger" },
  { id: "exclusivasComparacion", label: "Exclusivas Comparación" },
];

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value.toLocaleString("es-ES")}
      </p>
    </div>
  );
}

function Pct({ value }: { value: number }) {
  return (
    <span className="tabular-nums">
      {Number.isInteger(value) ? value : value.toFixed(2)}%
    </span>
  );
}

function DataTable({
  children,
  rowCount,
}: {
  children: React.ReactNode;
  rowCount: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
        {rowCount.toLocaleString("es-ES")} filas
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function thClass() {
  return "sticky top-0 bg-slate-50 px-4 py-3 font-medium text-slate-600";
}

export function ResultsPanel({
  result,
  comparisonLabel = "Comparación",
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("resumen");
  const { summary } = result;

  useEffect(() => {
    setActiveTab("resumen");
  }, [result]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Resultados</h2>
        <p className="mt-1 text-sm text-slate-600">
          Cinco secciones equivalentes a las hojas del libro Excel de
          referencia. Cambie de pestaña sin volver a analizar.
        </p>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <nav
          className="flex min-w-max gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1"
          aria-label="Secciones de resultados"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                  selected
                    ? "bg-white text-teal-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                aria-pressed={selected}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "resumen" && (
        <section aria-label="Resumen">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Permutaciones únicas Ger"
              value={summary.uniquePermutationsGer}
            />
            <MetricCard
              label={`Permutaciones únicas ${comparisonLabel}`}
              value={summary.uniquePermutationsComparison}
            />
            <MetricCard label="Firmas Ger" value={summary.firmasGer} />
            <MetricCard
              label={`Firmas ${comparisonLabel}`}
              value={summary.firmasComparison}
            />
            <MetricCard
              label="Firmas compartidas"
              value={summary.sharedFirmas}
            />
            <MetricCard
              label="Firmas exclusivas Ger"
              value={summary.exclusiveFirmasGer}
            />
            <MetricCard
              label={`Firmas exclusivas ${comparisonLabel}`}
              value={summary.exclusiveFirmasComparison}
            />
            <MetricCard
              label="Permutaciones exactas compartidas"
              value={summary.exactSharedPermutations}
            />
          </div>
        </section>
      )}

      {activeTab === "firmas" && (
        <section aria-label="Firmas Compartidas">
          <DataTable rowCount={result.sharedFirmas.length}>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className={thClass()}>Firma</th>
                  <th className={thClass()}>Perm. Ger</th>
                  <th className={thClass()}>Perm. {comparisonLabel}</th>
                  <th className={thClass()}>Intersección</th>
                  <th className={thClass()}>Cobertura Ger %</th>
                  <th className={thClass()}>
                    Cobertura {comparisonLabel} %
                  </th>
                  <th className={thClass()}>Jaccard %</th>
                  <th className={thClass()}>Permutaciones compartidas</th>
                </tr>
              </thead>
              <tbody>
                {result.sharedFirmas.map((row) => (
                  <tr
                    key={row.firma}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-4 py-2 font-mono font-medium text-slate-900">
                      {row.firma}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{row.permGer}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.permComparison}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.intersection}
                    </td>
                    <td className="px-4 py-2">
                      <Pct value={row.coverageGerPct} />
                    </td>
                    <td className="px-4 py-2">
                      <Pct value={row.coverageComparisonPct} />
                    </td>
                    <td className="px-4 py-2">
                      <Pct value={row.jaccardPct} />
                    </td>
                    <td className="max-w-xl px-4 py-2 font-mono text-xs text-slate-600">
                      {formatSharedPermutations(row.sharedPermutations) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </section>
      )}

      {activeTab === "ranking" && (
        <section aria-label="Ranking">
          <DataTable rowCount={result.ranking.length}>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className={thClass()}>Pos</th>
                  <th className={thClass()}>Firma</th>
                  <th className={thClass()}>Coincidencias</th>
                  <th className={thClass()}>Jaccard %</th>
                  <th className={thClass()}>Perm. Ger</th>
                  <th className={thClass()}>Perm. {comparisonLabel}</th>
                </tr>
              </thead>
              <tbody>
                {result.ranking.map((row) => (
                  <tr key={row.firma} className="border-t border-slate-100">
                    <td className="px-4 py-2 tabular-nums text-slate-700">
                      {row.position}
                    </td>
                    <td className="px-4 py-2 font-mono font-medium text-slate-900">
                      {row.firma}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.coincidences}
                    </td>
                    <td className="px-4 py-2">
                      <Pct value={row.jaccardPct} />
                    </td>
                    <td className="px-4 py-2 tabular-nums">{row.permGer}</td>
                    <td className="px-4 py-2 tabular-nums">
                      {row.permComparison}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </section>
      )}

      {activeTab === "exclusivasGer" && (
        <section aria-label="Exclusivas Ger">
          <DataTable rowCount={result.exclusiveGer.length}>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className={thClass()}>Firma</th>
                  <th className={thClass()}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {result.exclusiveGer.map((row) => (
                  <tr key={row.firma} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-slate-900">
                      {row.firma}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </section>
      )}

      {activeTab === "exclusivasComparacion" && (
        <section aria-label="Exclusivas Comparación">
          <DataTable rowCount={result.exclusiveComparison.length}>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr>
                  <th className={thClass()}>Firma</th>
                  <th className={thClass()}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {result.exclusiveComparison.map((row) => (
                  <tr key={row.firma} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-mono text-slate-900">
                      {row.firma}
                    </td>
                    <td className="px-4 py-2 tabular-nums">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataTable>
        </section>
      )}
    </div>
  );
}

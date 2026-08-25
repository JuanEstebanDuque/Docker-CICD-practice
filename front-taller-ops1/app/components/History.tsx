"use client";

import { useEffect, useState } from "react";
import { fetchHistory, OPERATION_LABEL, type HistoryEntry } from "@/app/lib/api";

interface HistoryProps {
  refreshKey: number;
}

export function History({ refreshKey }: HistoryProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchHistory(5);
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error desconocido.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Últimas operaciones
      </h2>

      {loading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Cargando historial...
        </p>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          No se pudo cargar el historial: {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aún no hay operaciones registradas.
        </p>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                <th className="py-2 pr-4 font-medium">Operación</th>
                <th className="py-2 pr-4 font-medium">A</th>
                <th className="py-2 pr-4 font-medium">B</th>
                <th className="py-2 pr-4 font-medium">Resultado</th>
                <th className="py-2 font-medium">Hora</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr
                  key={`${entry.timestamp}-${idx}`}
                  className="border-b border-zinc-100 text-zinc-700 last:border-0 dark:border-zinc-800 dark:text-zinc-300"
                >
                  <td className="py-2 pr-4">{OPERATION_LABEL[entry.operation]}</td>
                  <td className="py-2 pr-4">{entry.a}</td>
                  <td className="py-2 pr-4">{entry.b}</td>
                  <td className="py-2 pr-4 font-semibold">{entry.result}</td>
                  <td className="py-2 text-zinc-500 dark:text-zinc-400">
                    {formatTime(entry.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

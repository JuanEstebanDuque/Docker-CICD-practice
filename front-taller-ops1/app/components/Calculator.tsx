"use client";

import { useState } from "react";
import {
  calculate,
  OPERATION_LABEL,
  type Operation,
} from "@/app/lib/api";

const OPERATIONS = Object.keys(OPERATION_LABEL) as Operation[];

interface CalculatorProps {
  onSuccess?: () => void;
}

export function Calculator({ onSuccess }: CalculatorProps) {
  const [operation, setOperation] = useState<Operation>("sum");
  const [a, setA] = useState<number>(0);
  const [b, setB] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { result } = await calculate(operation, a, b);
      setResult(result);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Calculadora
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="operation"
            className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
          >
            Operación
          </label>
          <select
            id="operation"
            value={operation}
            onChange={(e) => setOperation(e.target.value as Operation)}
            className="w-full rounded-lg border-2 border-zinc-200 bg-white px-3 py-2 text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          >
            {OPERATIONS.map((op) => (
              <option key={op} value={op}>
                {OPERATION_LABEL[op]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label
              htmlFor="operand-a"
              className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Número A
            </label>
            <input
              id="operand-a"
              type="number"
              value={a}
              onChange={(e) => setA(Number(e.target.value))}
              className="w-full rounded-lg border-2 border-zinc-200 bg-white px-3 py-2 text-zinc-900 appearance-none focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="operand-b"
              className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400"
            >
              Número B
            </label>
            <input
              id="operand-b"
              type="number"
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
              className="w-full rounded-lg border-2 border-zinc-200 bg-white px-3 py-2 text-zinc-900 appearance-none focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <span className="mr-1" aria-hidden="true">
            ⚠
          </span>
          No se pudo completar el cálculo: {error}
        </div>
      )}

      {result !== null && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
          Resultado: <span className="font-semibold">{result}</span>
        </div>
      )}
    </section>
  );
}

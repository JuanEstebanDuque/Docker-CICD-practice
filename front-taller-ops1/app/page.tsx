"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await fetch("http://localhost:5000/sum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ a: Number(a), b: Number(b) }),
      });
      if (!res.ok) throw new Error("Error en la petición");
      const json = await res.json();
      setResult(json.result ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Error desconocido");
      setResult(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-16 px-6 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-semibold mb-4">Servicio de Suma (Fase 1)</h1>
        <form onSubmit={handleSubmit} className="flex gap-2 items-center mb-4">
          <input
            type="number"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
            className="border-2 rounded-lg px-2 py-1 appearance-none"
            aria-label="Número A"
          />
          <span className="mx-1">+</span>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="border-2 rounded-lg px-2 py-1 appearance-none"
            aria-label="Número B"
          />
          <button className="ml-2 rounded bg-white text-black hover:text-gray-500 px-3 py-1">Sumar</button>
        </form>

        {err && <div className="text-red-600">{err}</div>}
        {result !== null && <div className="text-lg">Resultado: {result}</div>}
      </main>
    </div>
  );
}

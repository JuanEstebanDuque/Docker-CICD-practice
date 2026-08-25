"use client";

import { useState } from "react";
import { Calculator } from "@/app/components/Calculator";
import { History } from "@/app/components/History";
import { HealthBadge } from "@/app/components/HealthBadge";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-16">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Calculadora Distribuida
          </h1>
          <HealthBadge />
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Calculator onSuccess={() => setRefreshKey((k) => k + 1)} />
          <History refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}

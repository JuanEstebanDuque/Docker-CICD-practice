"use client";

import { useEffect, useState } from "react";

interface StatusResponse {
  status: "ok" | "degraded";
  frontend: { uptime: number };
  backend: { uptime?: number; reachable?: boolean };
}

function formatUptime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function HealthBadge() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((res) => res.json() as Promise<StatusResponse>)
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isOk = status?.status === "ok";
  const dotColor = failed || (status && !isOk)
    ? "bg-red-500"
    : status
      ? "bg-green-500"
      : "bg-zinc-400";

  const label = failed || (status && !isOk)
    ? "Backend no disponible"
    : status
      ? "Backend operativo"
      : "Verificando...";

  return (
    <div
      className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
      title={
        status?.backend.uptime !== undefined
          ? `Activo hace ${formatUptime(status.backend.uptime)}`
          : undefined
      }
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} aria-hidden="true" />
      <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
  );
}

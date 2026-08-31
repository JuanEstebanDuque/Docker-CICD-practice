export type Operation = "sum" | "subtract" | "multiply" | "divide";

export const OPERATION_LABEL: Record<Operation, string> = {
  sum: "Suma (+)",
  subtract: "Resta (−)",
  multiply: "Multiplicación (×)",
  divide: "División (÷)",
};

const OPERATION_ENDPOINT: Record<Operation, string> = {
  sum: "sum",
  subtract: "subtract",
  multiply: "multiply",
  divide: "divide",
};

export interface CalculateResult {
  result: number;
}

interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
}

export async function calculate(
  operation: Operation,
  a: number,
  b: number,
): Promise<CalculateResult> {
  const res = await fetch(`/api/calc/${OPERATION_ENDPOINT[operation]}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ a, b }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(body?.message ?? "Error en la petición al backend.");
  }

  return res.json() as Promise<CalculateResult>;
}

export interface HistoryEntry {
  operation: Operation;
  a: number;
  b: number;
  result: number;
  timestamp: string;
}

export async function fetchHistory(limit = 5): Promise<HistoryEntry[]> {
  const res = await fetch(`/api/history?limit=${limit}`);
  if (!res.ok) throw new Error("No se pudo cargar el historial.");
  const json = (await res.json()) as { data: HistoryEntry[] };
  return json.data;
}

export interface BackendHealth {
  status: string;
  uptime: number;
  timestamp: string;
  storage: { writable: boolean };
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const res = await fetch(`/api/health`);
  if (!res.ok) throw new Error("Backend no disponible.");
  return res.json() as Promise<BackendHealth>;
}

import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/lib/api";

export async function GET() {
  let backend: unknown = { reachable: false };
  let backendReachable = false;

  try {
    const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" });
    if (res.ok) {
      backend = await res.json();
      backendReachable = true;
    }
  } catch {
    backendReachable = false;
  }

  return NextResponse.json({
    status: backendReachable ? "ok" : "degraded",
    frontend: { uptime: process.uptime() },
    backend,
  });
}

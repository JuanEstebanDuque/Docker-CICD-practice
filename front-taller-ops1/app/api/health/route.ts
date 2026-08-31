import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/lib/backend";

export async function GET() {
  const backendRes = await fetch(`${BACKEND_URL}/health`, {
    cache: "no-store",
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}

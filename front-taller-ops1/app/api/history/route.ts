import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/lib/backend";

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit") ?? "5";

  const backendRes = await fetch(`${BACKEND_URL}/history?limit=${limit}`, {
    cache: "no-store",
  });

  const data = await backendRes.json();
  return NextResponse.json(data, { status: backendRes.status });
}

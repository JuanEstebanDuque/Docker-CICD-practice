import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/app/lib/backend";

const VALID_OPERATIONS = ["sum", "subtract", "multiply", "divide"];

// Next 15+ (App Router): los params de un segmento dinámico llegan como
// Promise, hay que hacer "await" antes de leerlos.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ operation: string }> },
) {
  const { operation } = await params;

  if (!VALID_OPERATIONS.includes(operation)) {
    return NextResponse.json(
      {
        statusCode: 404,
        error: "Not Found",
        message: `Operación desconocida: ${operation}`,
      },
      { status: 404 },
    );
  }

  const body = await request.json();

  const backendRes = await fetch(`${BACKEND_URL}/${operation}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await backendRes.json();
  // Reenviamos el mismo status code que dio Nest (200 ok, 400 división por
  // cero, etc.) para que api.ts, que ya revisa res.ok, siga funcionando igual.
  return NextResponse.json(data, { status: backendRes.status });
}

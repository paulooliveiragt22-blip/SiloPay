import { NextResponse } from "next/server";
import { adapterFor } from "@/data/payments/gateway";

const PROVIDER = /^[a-z][a-z0-9_]{0,31}$/;

export async function POST(_request: Request, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!PROVIDER.test(provider) || !adapterFor(provider)) {
    return NextResponse.json({ error: "adaptador_ausente" }, { status: 404 });
  }
  return NextResponse.json({ error: "adaptador_ausente" }, { status: 404 });
}

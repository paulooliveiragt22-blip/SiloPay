"use server";

import { lookupPostalCode } from "@/data/cep";
import { forbidden } from "next/navigation";
import { failAction, messageFor } from "../messages";
import { verifySession } from "../session";

export type CepResult =
  | { ok: true; street: string; district: string; city: string; state: string }
  | { ok: false; message: string };

export async function buscarCepAction(cep: unknown): Promise<CepResult> {
  try {
    const session = await verifySession();
    if (session.membership?.role !== "admin") forbidden();
    const result = await lookupPostalCode(cep);
    if (!result.ok) return { ok: false, message: messageFor(result.error) };
    return { ok: true, ...result.value };
  } catch (error: unknown) {
    return failAction(error);
  }
}

import "server-only";
import type { Cents } from "@/domain/money";
import { parseAdiantamentoTeste, parseCriarEmpresa } from "@/domain/rpc";
import { reviewReceipt } from "@/domain/review-receipt";
import { submitReceipt } from "@/domain/submit-receipt";
import { adiantamentoTesteRpc, criarEmpresaRpc, reviewReceiptRpc, submitReceiptRpc } from "./supabase/mutations";

const reviewPort = { reviewReceipt: reviewReceiptRpc };
const submitPort = { submitReceipt: submitReceiptRpc };

export function executeReviewReceipt(input: {
  receiptId: string;
  claimed: Cents;
  approved: unknown;
}) {
  return reviewReceipt(reviewPort, input);
}

export function executeSubmitReceipt(input: {
  amountCents: unknown;
  category: unknown;
  storagePath: unknown;
  placeNote: unknown;
  companyId: string;
  employeeId: string;
}) {
  return submitReceipt(submitPort, input);
}

export async function executeCriarEmpresa(input: { name: string; cnpj: string }) {
  const raw = await criarEmpresaRpc(input);
  return parseCriarEmpresa(raw);
}

export async function executeAdiantamentoTeste(input: {
  employeeId: string;
  amountCents: number;
  idempotencyKey: string;
}) {
  const raw = await adiantamentoTesteRpc(input);
  return parseAdiantamentoTeste(raw);
}

import "server-only";
import type { ReceiptCategory } from "@/domain/receipt";
import { createClient } from "./server";

export async function reviewReceiptRpc(input: {
  receiptId: string;
  approvedCents: number;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_receipt", {
    p_receipt_id: input.receiptId,
    p_approved_cents: input.approvedCents,
  });
  if (error) throw error;
  return data;
}

export async function criarEmpresaRpc(input: { name: string; cnpj: string }): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("criar_empresa", {
    p_name: input.name,
    p_cnpj: input.cnpj,
  });
  if (error) throw error;
  return data;
}

export async function submitReceiptRpc(input: {
  amountCents: number;
  category: ReceiptCategory;
  storagePath: string;
  placeNote: string | null;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_receipt", {
    p_amount_cents: input.amountCents,
    p_category: input.category,
    p_storage_path: input.storagePath,
    p_place_note: input.placeNote ?? undefined,
  });
  if (error) throw error;
  return data;
}

export async function adiantamentoTesteRpc(input: {
  employeeId: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_adiantamento_teste", {
    p_employee_id: input.employeeId,
    p_amount_cents: input.amountCents,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data;
}

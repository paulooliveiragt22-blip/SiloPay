import "server-only";
import type { ExtratoLinha, MinhaSubconta, SubcontaFuncionario, FilaComprovante } from "./contract";
import { createClient } from "./server";

export type Membership = {
  companyId: string;
  role: "admin" | "funcionario";
  employeeId: string | null;
};

export type SaldoView = {
  employeeId: string;
  employeeName: string | null;
  status: string | null;
  transferidoCents: number;
  emAnaliseCents: number;
  baixadoCents: number;
  saldoCents: number;
};

export type FilaItem = {
  receiptId: string;
  employeeName: string;
  amountClaimedCents: number;
  category: string;
  placeNote: string | null;
  submittedAt: string;
  storagePath: string;
};

export type ExtratoItem = {
  id: string;
  occurredAt: string;
  kind: string;
  amountCents: number;
  efeito: string;
  receiptStatus: string | null;
};

export async function readMembership(): Promise<Membership | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("gestor_current_membership");
  if (error) throw error;
  const row = data?.[0];
  if (!row || (row.role !== "admin" && row.role !== "funcionario")) return null;
  return {
    companyId: row.company_id,
    role: row.role,
    employeeId: row.employee_id,
  };
}

export async function readMinhaSubconta(): Promise<SaldoView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_minha_subconta").select("*").maybeSingle();
  if (error) throw error;
  return data ? toSaldo(data, null, null) : null;
}

export async function readSubcontas(): Promise<SaldoView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_subconta_funcionario")
    .select("*")
    .order("employee_name");
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const saldo = toSaldo(row, row.employee_name, row.status);
    return saldo ? [saldo] : [];
  });
}

export async function readExtrato(): Promise<ExtratoItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_meu_extrato").select("*").order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const item = toExtrato(row);
    return item ? [item] : [];
  });
}

export async function readFila(): Promise<FilaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_fila_comprovantes")
    .select("*")
    .order("submitted_at");
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const item = toFila(row);
    return item ? [item] : [];
  });
}

function toSaldo(
  row: MinhaSubconta | SubcontaFuncionario,
  employeeName: string | null,
  status: string | null,
): SaldoView | null {
  if (
    !row.employee_id ||
    row.transferido_cents === null ||
    row.em_analise_cents === null ||
    row.baixado_cents === null ||
    row.saldo_cents === null
  ) {
    return null;
  }
  return {
    employeeId: row.employee_id,
    employeeName,
    status,
    transferidoCents: row.transferido_cents,
    emAnaliseCents: row.em_analise_cents,
    baixadoCents: row.baixado_cents,
    saldoCents: row.saldo_cents,
  };
}

function toExtrato(row: ExtratoLinha): ExtratoItem | null {
  const id = row.ledger_id ?? row.receipt_id;
  if (!id || row.amount_cents === null || !row.kind || !row.occurred_at || !row.efeito) return null;
  return {
    id,
    occurredAt: row.occurred_at,
    kind: row.kind,
    amountCents: row.amount_cents,
    efeito: row.efeito,
    receiptStatus: row.receipt_status,
  };
}

function toFila(row: FilaComprovante): FilaItem | null {
  if (
    !row.receipt_id ||
    !row.employee_name ||
    row.amount_claimed_cents === null ||
    !row.category ||
    !row.submitted_at ||
    !row.storage_path
  ) {
    return null;
  }
  return {
    receiptId: row.receipt_id,
    employeeName: row.employee_name,
    amountClaimedCents: row.amount_claimed_cents,
    category: row.category,
    placeNote: row.place_note,
    submittedAt: row.submitted_at,
    storagePath: row.storage_path,
  };
}

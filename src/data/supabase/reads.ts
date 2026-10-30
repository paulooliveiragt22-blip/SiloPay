import "server-only";
import type { ExtratoLinha, MinhaEmpresa, MinhaSubconta, SubcontaFuncionario, FilaComprovante, ComprovanteLinha, ContaPagamento, SaldoEmpresaLinha, ExtratoEmpresaLinha, MeuAcesso, EventoEmpresa } from "./contract";
import { createClient } from "./server";
import { signReceiptPhoto } from "./storage";

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
  linked: boolean;
  provisional: boolean;
  cadastro: CadastroColaborador | null;
};

export type CadastroColaborador = {
  name: string | null;
  cpf: string | null;
  email: string | null;
  pixKeyType: string | null;
  pixKey: string | null;
  jobTitle: string | null;
  phone: string | null;
  postalCode: string | null;
  street: string | null;
  streetNumber: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  hiredOn: string | null;
};

export type FilaItem = {
  receiptId: string;
  employeeName: string;
  amountClaimedCents: number;
  category: string;
  placeNote: string | null;
  submittedAt: string;
  storagePath: string;
  photoUrl: string | null;
};

export type ResumoEmpresa = {
  saldoCents: number;
  emAnaliseCents: number;
  baixadoCents: number;
};

export type ExtratoItem = {
  id: string;
  occurredAt: string;
  kind: string;
  amountCents: number;
  efeito: string;
  receiptStatus: string | null;
  category: string | null;
  approvedCents: number | null;
  photoUrl: string | null;
  placeNote: string | null;
};

export type ComprovanteItem = {
  receiptId: string;
  employeeName: string;
  amountClaimedCents: number;
  amountApprovedCents: number | null;
  status: string;
  category: string;
  placeNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  photoUrl: string | null;
};

export type ContaPagamentoView = {
  provider: string;
  environment: "sandbox" | "producao";
  status: string;
  externalAccountId: string | null;
};

export type SaldoEmpresa = {
  entradasCents: number;
  enviadosCents: number;
  devolucoesCents: number;
  saldoCents: number;
};

export type MovimentoEmpresa = {
  id: string;
  kind: "entrada" | "envio" | "devolucao";
  sendKind: "adiantamento" | "reembolso" | null;
  amountCents: number;
  occurredAt: string;
  employeeName: string | null;
};

export async function readSaldoEmpresa(): Promise<SaldoEmpresa> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_saldo_empresa").select("*").maybeSingle();
  if (error) throw error;
  return toSaldoEmpresa(data);
}

export async function readExtratoEmpresa(): Promise<MovimentoEmpresa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_extrato_empresa").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const item = toMovimentoEmpresa(row);
    return item ? [item] : [];
  });
}

export async function readContaPagamento(): Promise<ContaPagamentoView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_conta_pagamento").select("*").maybeSingle();
  if (error) throw error;
  return toConta(data);
}

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

export async function readMinhaEmpresa(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_minha_empresa").select("company_name").maybeSingle();
  if (error) throw error;
  return companyName(data);
}

export async function readResumoEmpresa(): Promise<ResumoEmpresa> {
  const rows = await readSubcontas();
  return {
    saldoCents: rows.reduce((sum, row) => sum + row.saldoCents, 0),
    emAnaliseCents: rows.reduce((sum, row) => sum + row.emAnaliseCents, 0),
    baixadoCents: rows.reduce((sum, row) => sum + row.baixadoCents, 0),
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
  return readExtratoFrom("v_meu_extrato", null);
}

export async function readExtratoFuncionario(employeeId: string): Promise<ExtratoItem[]> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) return [];
  return readExtratoFrom("v_extrato_funcionario", employeeId);
}

export async function readFila(): Promise<FilaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_fila_comprovantes")
    .select("*")
    .order("submitted_at");
  if (error) throw error;
  const rows = (data ?? []).flatMap((row) => {
    const item = toFila(row);
    return item ? [item] : [];
  });
  return Promise.all(
    rows.map(async (item) => ({
      ...item,
      photoUrl: await signReceiptPhoto(item.storagePath),
    })),
  );
}

export async function readComprovantes(): Promise<ComprovanteItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_comprovantes")
    .select("*")
    .neq("status", "em_analise")
    .order("reviewed_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []).flatMap((row) => {
    const item = toComprovante(row);
    return item ? [item] : [];
  });
  return Promise.all(
    rows.map(async ({ storagePath, ...item }) => ({
      ...item,
      photoUrl: storagePath ? await signReceiptPhoto(storagePath) : null,
    })),
  );
}

function toComprovante(row: ComprovanteLinha): (Omit<ComprovanteItem, "photoUrl"> & { storagePath: string | null }) | null {
  if (
    !row.receipt_id ||
    !row.employee_name ||
    row.amount_claimed_cents === null ||
    !row.status ||
    !row.category ||
    !row.submitted_at
  ) {
    return null;
  }
  return {
    receiptId: row.receipt_id,
    employeeName: row.employee_name,
    amountClaimedCents: row.amount_claimed_cents,
    amountApprovedCents: row.amount_approved_cents,
    status: row.status,
    category: row.category,
    placeNote: row.place_note,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    storagePath: row.storage_path,
  };
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
    linked: "vinculado" in row && row.vinculado === true,
    provisional: "senha_temporaria" in row && row.senha_temporaria === true,
    cadastro: "job_title" in row ? toCadastro(row) : null,
  };
}

function toCadastro(row: SubcontaFuncionario): CadastroColaborador {
  return {
    name: row.employee_name,
    cpf: row.cpf,
    email: row.email,
    pixKeyType: row.pix_key_type,
    pixKey: row.pix_key,
    jobTitle: row.job_title,
    phone: row.phone,
    postalCode: row.postal_code,
    street: row.street,
    streetNumber: row.street_number,
    complement: row.address_complement,
    district: row.district,
    city: row.city,
    state: row.state,
    hiredOn: row.hired_on,
  };
}

function toExtrato(row: ExtratoLinha): (ExtratoItem & { storagePath: string | null }) | null {
  const id = row.ledger_id ?? row.receipt_id;
  if (!id || row.amount_cents === null || !row.kind || !row.occurred_at || !row.efeito) return null;
  return {
    id,
    occurredAt: row.occurred_at,
    kind: row.kind,
    amountCents: row.amount_cents,
    efeito: row.efeito,
    receiptStatus: row.receipt_status,
    category: row.category,
    approvedCents: row.amount_approved_cents,
    photoUrl: null,
    storagePath: row.storage_path,
    placeNote: row.place_note,
  };
}

async function readExtratoFrom(
  view: "v_meu_extrato" | "v_extrato_funcionario",
  employeeId: string | null,
): Promise<ExtratoItem[]> {
  const supabase = await createClient();
  const query = supabase.from(view).select("*").order("occurred_at", { ascending: false });
  const filtered = employeeId ? query.eq("employee_id", employeeId) : query;
  const { data, error } = await filtered;
  if (error) throw error;
  const rows = (data ?? []).flatMap((row) => {
    const item = toExtrato(row);
    return item ? [item] : [];
  });
  return Promise.all(
    rows.map(async ({ storagePath, ...item }) => ({
      ...item,
      photoUrl: storagePath ? await signReceiptPhoto(storagePath) : null,
    })),
  );
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
    photoUrl: null,
  };
}

function companyName(row: Pick<MinhaEmpresa, "company_name"> | null): string | null {
  const name = row?.company_name?.trim();
  return name ? name : null;
}

function toSaldoEmpresa(row: SaldoEmpresaLinha | null): SaldoEmpresa {
  if (!row || row.entradas_cents === null || row.enviados_cents === null || row.saldo_cents === null) {
    return { entradasCents: 0, enviadosCents: 0, devolucoesCents: 0, saldoCents: 0 };
  }
  return {
    entradasCents: row.entradas_cents,
    enviadosCents: row.enviados_cents,
    devolucoesCents: row.devolucoes_cents ?? 0,
    saldoCents: row.saldo_cents,
  };
}

function toMovimentoEmpresa(row: ExtratoEmpresaLinha): MovimentoEmpresa | null {
  if (!row.id || (row.kind !== "entrada" && row.kind !== "envio" && row.kind !== "devolucao") || row.amount_cents === null || !row.created_at) {
    return null;
  }
  return {
    id: row.id,
    kind: row.kind,
    sendKind: row.envio_kind === "adiantamento" || row.envio_kind === "reembolso" ? row.envio_kind : null,
    amountCents: row.amount_cents,
    occurredAt: row.created_at,
    employeeName: row.employee_name,
  };
}

function toConta(row: ContaPagamento | null): ContaPagamentoView | null {
  if (!row?.provider || (row.environment !== "sandbox" && row.environment !== "producao") || !row.status) return null;
  return {
    provider: row.provider,
    environment: row.environment,
    status: row.status,
    externalAccountId: row.external_account_id,
  };
}

export type AcessoView = {
  mustChangePassword: boolean;
  expiresAt: string;
};

export async function readMeuAcesso(): Promise<AcessoView | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_meu_acesso").select("*").maybeSingle();
  if (error) throw error;
  return toAcesso(data);
}

export type EventoEmpresaView = {
  id: string;
  occurredAt: string;
  kind: "colaborador_criado" | "senha_gerada" | "senha_trocada" | "senha_renovada" | "saldo_adicionado";
  employeeId: string | null;
  employeeName: string | null;
  actorName: string;
};

const eventKinds: EventoEmpresaView["kind"][] = [
  "colaborador_criado",
  "senha_gerada",
  "senha_trocada",
  "senha_renovada",
  "saldo_adicionado",
];

export async function readEventos(): Promise<EventoEmpresaView[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_eventos_empresa")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    const item = toEvento(row);
    return item ? [item] : [];
  });
}

function toEvento(row: EventoEmpresa): EventoEmpresaView | null {
  if (!row.id || !row.occurred_at || !row.kind || !row.actor_name) return null;
  if (!eventKinds.some((kind) => kind === row.kind)) return null;
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    kind: row.kind as EventoEmpresaView["kind"],
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    actorName: row.actor_name,
  };
}

function toAcesso(row: MeuAcesso | null): AcessoView | null {
  if (!row?.must_change_password || !row.temp_password_expires_at) return null;
  return { mustChangePassword: true, expiresAt: row.temp_password_expires_at };
}

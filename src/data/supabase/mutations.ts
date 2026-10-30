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

export async function corrigirComprovanteRpc(input: {
  receiptId: string;
  amountCents: number;
  category: ReceiptCategory;
  placeNote: string | null;
  storagePath: string | null;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("corrigir_comprovante", {
    p_receipt_id: input.receiptId,
    p_amount_cents: input.amountCents,
    p_category: input.category,
    p_place_note: input.placeNote,
    p_storage_path: input.storagePath,
  });
  if (error) throw error;
  return data;
}

export async function excluirComprovanteRpc(receiptId: string): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("excluir_comprovante", {
    p_receipt_id: receiptId,
  });
  if (error) throw error;
  return data;
}

export async function cadastrarFuncionarioRpc(input: {
  name: string;
  cpf: string;
  pixKeyType: string;
  pixKey: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cadastrar_funcionario", {
    p_name: input.name,
    p_cpf: input.cpf,
    p_pix_key_type: input.pixKeyType,
    p_pix_key: input.pixKey,
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

export async function conectarContaRpc(input: {
  provider: string;
  externalAccountId: string;
  environment: "sandbox" | "producao";
  apiKeyCiphertext: string;
  webhookSecretCiphertext: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("conectar_conta_pagamento", {
    p_provider: input.provider,
    p_external_account_id: input.externalAccountId,
    p_environment: input.environment,
    p_api_key_ciphertext: input.apiKeyCiphertext,
    p_webhook_secret_ciphertext: input.webhookSecretCiphertext,
  });
  if (error) throw error;
  return data;
}

export async function abrirOrdemPixRpc(input: {
  employeeId: string;
  kind: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("abrir_ordem_pix", {
    p_employee_id: input.employeeId,
    p_kind: input.kind,
    p_amount_cents: input.amountCents,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data;
}

export async function falharOrdemPixRpc(orderId: string): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("falhar_ordem_pix", { p_order_id: orderId });
  if (error) throw error;
  return data;
}

export async function adicionarSaldoEmpresaRpc(input: { amountCents: number; idempotencyKey: string }): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("adicionar_saldo_empresa", {
    p_amount_cents: input.amountCents,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data;
}

export async function devolverSobraRpc(input: {
  employeeId: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("devolver_sobra", {
    p_employee_id: input.employeeId,
    p_amount_cents: input.amountCents,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data;
}

export async function enviarSaldoColaboradorRpc(input: {
  employeeId: string;
  kind: string;
  amountCents: number;
  idempotencyKey: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("enviar_saldo_colaborador", {
    p_employee_id: input.employeeId,
    p_kind: input.kind,
    p_amount_cents: input.amountCents,
    p_idempotency_key: input.idempotencyKey,
  });
  if (error) throw error;
  return data;
}

export async function registrarEnvioPixRpc(input: { orderId: string; providerTransferId: string }): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registrar_envio_pix", {
    p_order_id: input.orderId,
    p_provider_transfer_id: input.providerTransferId,
  });
  if (error) throw error;
  return data;
}

export async function cadastrarFuncionarioComAcessoRpc(input: {
  name: string;
  cpf: string;
  pixKeyType: string;
  pixKey: string;
  userId: string;
  expiresAt: string;
  jobTitle: string;
  phone: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  hiredOn: string | null;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cadastrar_funcionario_com_acesso", {
    p_name: input.name,
    p_cpf: input.cpf,
    p_pix_key_type: input.pixKeyType,
    p_pix_key: input.pixKey,
    p_user_id: input.userId,
    p_temp_expires_at: input.expiresAt,
    p_job_title: input.jobTitle,
    p_phone: input.phone,
    p_postal_code: input.postalCode,
    p_street: input.street,
    p_street_number: input.streetNumber,
    p_address_complement: input.complement,
    p_district: input.district,
    p_city: input.city,
    p_state: input.state,
    p_hired_on: input.hiredOn,
  });
  if (error) throw error;
  return data;
}

export async function abrirAcessoColaboradorRpc(input: {
  employeeId: string;
  userId: string;
  expiresAt: string;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("abrir_acesso_colaborador", {
    p_employee_id: input.employeeId,
    p_user_id: input.userId,
    p_temp_expires_at: input.expiresAt,
  });
  if (error) throw error;
  return data;
}

export async function renovarSenhaColaboradorRpc(input: { employeeId: string; expiresAt: string }): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("renovar_senha_colaborador", {
    p_employee_id: input.employeeId,
    p_temp_expires_at: input.expiresAt,
  });
  if (error) throw error;
  return data;
}

export async function confirmarSenhaInicialRpc(): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirmar_senha_inicial");
  if (error) throw error;
  return data;
}

export async function atualizarCadastroColaboradorRpc(input: {
  employeeId: string;
  jobTitle: string;
  phone: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  hiredOn: string | null;
}): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("atualizar_cadastro_colaborador", {
    p_employee_id: input.employeeId,
    p_job_title: input.jobTitle,
    p_phone: input.phone,
    p_postal_code: input.postalCode,
    p_street: input.street,
    p_street_number: input.streetNumber,
    p_address_complement: input.complement,
    p_district: input.district,
    p_city: input.city,
    p_state: input.state,
    p_hired_on: input.hiredOn,
  });
  if (error) throw error;
  return data;
}

export async function encerrarAcessoVencidoRpc(): Promise<unknown> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("encerrar_acesso_vencido");
  if (error) throw error;
  return data;
}

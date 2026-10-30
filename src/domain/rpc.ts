import { err, ok, type Result } from "./result";
import type { ReviewStatus } from "./money";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CriarEmpresaResult = { companyId: string };
export type CadastrarFuncionarioResult = { employeeId: string };
export type VincularFuncionarioResult = { employeeId: string; userId: string };
export type SubmitReceiptResult = { receiptId: string; status: "em_analise" };
export type ReviewReceiptResult = {
  receiptId: string;
  status: ReviewStatus;
  amountApprovedCents: number;
};
export type AdiantamentoTesteResult = { paymentOrderId: string; idempotent: boolean };
export type PaymentOrderStatus = "pendente" | "confirmada" | "falhou" | "cancelada";
export type AbrirOrdemResult = {
  paymentOrderId: string;
  status: PaymentOrderStatus;
  idempotent: boolean;
};
export type ContaPagamentoResult = {
  companyId: string;
  provider: string;
  environment: "sandbox" | "producao";
  status: string;
};

export function parseUuid(value: unknown): Result<string> {
  if (typeof value !== "string" || !UUID.test(value)) return err("recibo_invalido");
  return ok(value);
}

export function parseCriarEmpresa(value: unknown): Result<CriarEmpresaResult> {
  const row = record(value);
  const companyId = row ? uuid(row.company_id) : null;
  if (!companyId) return err("retorno_rpc_invalido");
  return ok({ companyId });
}

export function parseCadastrarFuncionario(value: unknown): Result<CadastrarFuncionarioResult> {
  const row = record(value);
  const employeeId = row ? uuid(row.employee_id) : null;
  if (!employeeId) return err("retorno_rpc_invalido");
  return ok({ employeeId });
}

export function parseVincularFuncionario(value: unknown): Result<VincularFuncionarioResult> {
  const row = record(value);
  const employeeId = row ? uuid(row.employee_id) : null;
  const userId = row ? uuid(row.user_id) : null;
  if (!employeeId || !userId) return err("retorno_rpc_invalido");
  return ok({ employeeId, userId });
}

export function parseSubmitReceipt(value: unknown): Result<SubmitReceiptResult> {
  const row = record(value);
  const receiptId = row ? uuid(row.receipt_id) : null;
  if (!receiptId || row?.status !== "em_analise") return err("retorno_rpc_invalido");
  return ok({ receiptId, status: "em_analise" });
}

export function parseReviewReceipt(value: unknown): Result<ReviewReceiptResult> {
  const row = record(value);
  const receiptId = row ? uuid(row.receipt_id) : null;
  const status = row ? reviewStatus(row.status) : null;
  const amount = row ? nonNegativeInteger(row.amount_approved_cents) : null;
  if (!receiptId || !status || amount === null) return err("retorno_rpc_invalido");
  if (status === "recusado" && amount !== 0) return err("retorno_rpc_invalido");
  if (status !== "recusado" && amount === 0) return err("retorno_rpc_invalido");
  return ok({ receiptId, status, amountApprovedCents: amount });
}

export function parseAdiantamentoTeste(value: unknown): Result<AdiantamentoTesteResult> {
  const row = record(value);
  const paymentOrderId = row ? uuid(row.payment_order_id) : null;
  if (!paymentOrderId || typeof row?.idempotent !== "boolean") return err("retorno_rpc_invalido");
  return ok({ paymentOrderId, idempotent: row.idempotent });
}

export function parseAbrirOrdem(value: unknown): Result<AbrirOrdemResult> {
  const row = record(value);
  const paymentOrderId = row ? uuid(row.payment_order_id) : null;
  const status = row ? paymentStatus(row.status) : null;
  if (!paymentOrderId || !status || typeof row?.idempotent !== "boolean") return err("retorno_rpc_invalido");
  return ok({ paymentOrderId, status, idempotent: row.idempotent });
}

export type AdicionarSaldoResult = { idempotent: boolean };
export type EnviarSaldoResult = { paymentOrderId: string; idempotent: boolean };

export function parseAdicionarSaldo(value: unknown): Result<AdicionarSaldoResult> {
  const row = record(value);
  const companyId = row ? uuid(row.company_id) : null;
  if (!companyId || typeof row?.idempotent !== "boolean") return err("retorno_rpc_invalido");
  return ok({ idempotent: row.idempotent });
}

export function parseDevolverSobra(value: unknown): Result<{ returnChargeId: string; idempotent: boolean }> {
  const row = record(value);
  const returnChargeId = row ? uuid(row.return_charge_id) : null;
  if (!returnChargeId || typeof row?.idempotent !== "boolean") return err("retorno_rpc_invalido");
  return ok({ returnChargeId, idempotent: row.idempotent });
}

export function parseEnviarSaldo(value: unknown): Result<EnviarSaldoResult> {
  const row = record(value);
  const paymentOrderId = row ? uuid(row.payment_order_id) : null;
  if (!paymentOrderId || row?.status !== "confirmada" || typeof row?.idempotent !== "boolean") {
    return err("retorno_rpc_invalido");
  }
  return ok({ paymentOrderId, idempotent: row.idempotent });
}

export function parseContaPagamento(value: unknown): Result<ContaPagamentoResult> {
  const row = record(value);
  const companyId = row ? uuid(row.company_id) : null;
  const provider = typeof row?.provider === "string" ? row.provider : null;
  const environment = row?.environment === "sandbox" || row?.environment === "producao" ? row.environment : null;
  if (!companyId || !provider || !environment || row?.status !== "conectada") return err("retorno_rpc_invalido");
  return ok({ companyId, provider, environment, status: "conectada" });
}

function record(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function uuid(value: unknown): string | null {
  return typeof value === "string" && UUID.test(value) ? value : null;
}

function reviewStatus(value: unknown): ReviewStatus | null {
  if (value === "aprovado" || value === "parcial" || value === "recusado") return value;
  return null;
}

function paymentStatus(value: unknown): PaymentOrderStatus | null {
  if (value === "pendente" || value === "confirmada" || value === "falhou" || value === "cancelada") return value;
  return null;
}

function nonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) return null;
  return value;
}

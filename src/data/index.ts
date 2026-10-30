import "server-only";
import type { Cents } from "@/domain/money";
import { parsePaymentKind } from "@/domain/payment";
import { parseAdiantamentoTeste, parseAdicionarSaldo, parseContaPagamento, parseCriarEmpresa, parseDevolverSobra, parseEnviarSaldo, parseUuid } from "@/domain/rpc";
import { requestTransfer } from "@/domain/request-transfer";
import { reviewReceipt } from "@/domain/review-receipt";
import { cadastrarFuncionario } from "@/domain/cadastrar-funcionario";
import { submitReceipt } from "@/domain/submit-receipt";
import { corrigirComprovante, excluirComprovante } from "@/domain/corrigir-comprovante";
import { ciphertextHex, sealGatewaySecret } from "./payments/secrets";
import {
  abrirOrdemPixRpc,
  adicionarSaldoEmpresaRpc,
  adiantamentoTesteRpc,
  cadastrarFuncionarioRpc,
  corrigirComprovanteRpc,
  devolverSobraRpc,
  enviarSaldoColaboradorRpc,
  excluirComprovanteRpc,
  conectarContaRpc,
  criarEmpresaRpc,
  falharOrdemPixRpc,
  registrarEnvioPixRpc,
  reviewReceiptRpc,
  submitReceiptRpc,
} from "./supabase/mutations";

const reviewPort = { reviewReceipt: reviewReceiptRpc };
const submitPort = { submitReceipt: submitReceiptRpc };
const corrigirPort = { corrigirComprovante: corrigirComprovanteRpc };
const excluirPort = { excluirComprovante: excluirComprovanteRpc };
const cadastrarPort = { cadastrarFuncionario: cadastrarFuncionarioRpc };

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

export function executeCorrigirComprovante(input: {
  receiptId: unknown;
  amountCents: unknown;
  category: unknown;
  storagePath: unknown;
  placeNote: unknown;
  companyId: string;
  employeeId: string;
}) {
  return corrigirComprovante(corrigirPort, input);
}

export function executeExcluirComprovante(receiptId: unknown) {
  return excluirComprovante(excluirPort, receiptId);
}

export function executeCadastrarFuncionario(input: {
  name: unknown;
  cpf: unknown;
  pixKeyType: unknown;
  pixKey: unknown;
}) {
  return cadastrarFuncionario(cadastrarPort, input);
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

export async function executeConectarConta(input: {
  provider: string;
  externalAccountId: string;
  environment: "sandbox" | "producao";
  apiKey: string;
  webhookSecret: string;
}) {
  const raw = await conectarContaRpc({
    provider: input.provider,
    externalAccountId: input.externalAccountId,
    environment: input.environment,
    apiKeyCiphertext: ciphertextHex(sealGatewaySecret(input.apiKey)),
    webhookSecretCiphertext: ciphertextHex(sealGatewaySecret(input.webhookSecret)),
  });
  return parseContaPagamento(raw);
}

export async function executeAdicionarSaldo(input: { amountCents: number; idempotencyKey: string }) {
  const raw = await adicionarSaldoEmpresaRpc(input);
  return parseAdicionarSaldo(raw);
}

export async function executeDevolverSobra(input: {
  employeeId: unknown;
  amountCents: Cents;
  idempotencyKey: unknown;
}) {
  const employeeId = parseUuid(input.employeeId);
  if (!employeeId.ok) return employeeId;
  const idempotencyKey = parseUuid(input.idempotencyKey);
  if (!idempotencyKey.ok) return idempotencyKey;
  const raw = await devolverSobraRpc({
    employeeId: employeeId.value,
    amountCents: input.amountCents,
    idempotencyKey: idempotencyKey.value,
  });
  return parseDevolverSobra(raw);
}

export async function executeEnviarSaldo(input: {
  employeeId: unknown;
  kind: unknown;
  amountCents: Cents;
  idempotencyKey: unknown;
}) {
  const employeeId = parseUuid(input.employeeId);
  if (!employeeId.ok) return employeeId;
  const kind = parsePaymentKind(input.kind);
  if (!kind.ok) return kind;
  const idempotencyKey = parseUuid(input.idempotencyKey);
  if (!idempotencyKey.ok) return idempotencyKey;
  const raw = await enviarSaldoColaboradorRpc({
    employeeId: employeeId.value,
    kind: kind.value,
    amountCents: input.amountCents,
    idempotencyKey: idempotencyKey.value,
  });
  return parseEnviarSaldo(raw);
}

export function executeRequestTransfer(input: {
  employeeId: string;
  kind: unknown;
  amountCents: Cents;
  idempotencyKey: string;
}) {
  return requestTransfer(
    {
      openOrder: (value) => abrirOrdemPixRpc(value),
      async dispatch() {
        return { sent: false };
      },
      failOrder: (orderId) => falharOrdemPixRpc(orderId),
      markSent: (value) => registrarEnvioPixRpc(value),
    },
    input,
  );
}

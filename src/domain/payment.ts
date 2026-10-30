import { err, ok, type Result } from "./result";

const PROVIDER = /^[a-z][a-z0-9_]{0,31}$/;

export const PAYMENT_KINDS = ["adiantamento", "reembolso"] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_ENVIRONMENTS = ["sandbox", "producao"] as const;
export type PaymentEnvironment = (typeof PAYMENT_ENVIRONMENTS)[number];

export type PaymentAccountInput = {
  provider: string;
  externalAccountId: string;
  environment: PaymentEnvironment;
  apiKey: string;
  webhookSecret: string;
};

export function parseProviderCode(value: unknown): Result<string> {
  if (typeof value !== "string" || !PROVIDER.test(value.trim())) return err("provedor_invalido");
  return ok(value.trim());
}

export function parsePaymentEnvironment(value: unknown): Result<PaymentEnvironment> {
  if (value === "sandbox" || value === "producao") return ok(value);
  return err("ambiente_invalido");
}

export function parsePaymentKind(value: unknown): Result<PaymentKind> {
  if (value === "adiantamento" || value === "reembolso") return ok(value);
  return err("tipo_pix_invalido");
}

export function parseExternalAccountId(value: unknown): Result<string> {
  if (typeof value !== "string") return err("conta_externa_invalida");
  const id = value.trim();
  if (id.length === 0 || id.length > 200) return err("conta_externa_invalida");
  return ok(id);
}

export function parseGatewaySecret(value: unknown): Result<string> {
  if (typeof value !== "string") return err("segredo_invalido");
  const secret = value.trim();
  if (secret.length === 0 || secret.length > 4096) return err("segredo_invalido");
  return ok(secret);
}

export function parsePaymentAccount(input: {
  provider: unknown;
  externalAccountId: unknown;
  environment: unknown;
  apiKey: unknown;
  webhookSecret: unknown;
}): Result<PaymentAccountInput> {
  const provider = parseProviderCode(input.provider);
  if (!provider.ok) return provider;
  const externalAccountId = parseExternalAccountId(input.externalAccountId);
  if (!externalAccountId.ok) return externalAccountId;
  const environment = parsePaymentEnvironment(input.environment);
  if (!environment.ok) return environment;
  const apiKey = parseGatewaySecret(input.apiKey);
  if (!apiKey.ok) return apiKey;
  const webhookSecret = parseGatewaySecret(input.webhookSecret);
  if (!webhookSecret.ok) return webhookSecret;
  return ok({
    provider: provider.value,
    externalAccountId: externalAccountId.value,
    environment: environment.value,
    apiKey: apiKey.value,
    webhookSecret: webhookSecret.value,
  });
}

import { err, ok, type Result } from "./result";

declare const centsBrand: unique symbol;

/** Inteiro em centavos. O saldo da subconta não é calculado aqui. */
export type Cents = number & { readonly [centsBrand]: true };

export function parseReaisToCents(raw: unknown): Result<Cents> {
  const cents = reaisToInteger(raw);
  if (cents === null) return err("centavos_invalidos");
  return parsePositiveCents(cents);
}

/** Valor aceito na baixa. Zero recusa o comprovante e não lança saldo. */
export function parseApprovedReais(raw: unknown): Result<Cents> {
  const cents = reaisToInteger(raw);
  if (cents === null) return err("centavos_invalidos");
  if (cents === 0) return ok(0 as Cents);
  return parsePositiveCents(cents);
}

export function parsePositiveCents(value: unknown): Result<Cents> {
  if (!isIntegerCents(value)) return err("centavos_invalidos");
  if (value <= 0) return err("valor_nao_positivo");
  return ok(value as Cents);
}

export type ReviewStatus = "aprovado" | "parcial" | "recusado";

export type ReviewDecision = {
  status: ReviewStatus;
  approved: Cents;
  postsLedger: boolean;
};

/** Valor aceito entre zero e o informado, inclusive. */
export function decideReview(claimed: Cents, approved: unknown): Result<ReviewDecision> {
  if (!isIntegerCents(approved)) return err("centavos_invalidos");
  if (approved < 0 || approved > claimed) return err("valor_aceito_invalido");

  const accepted = approved as Cents;
  if (accepted === claimed) {
    return ok({ status: "aprovado", approved: accepted, postsLedger: true });
  }
  if (accepted === 0) {
    return ok({ status: "recusado", approved: accepted, postsLedger: false });
  }
  return ok({ status: "parcial", approved: accepted, postsLedger: true });
}

function reaisToInteger(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/\s/g, "").replace(/^R\$/, "");
  if (!/^(\d{1,3}(\.\d{3})*|\d+)(,\d{1,2})?$/.test(text)) return null;
  const [whole, frac = ""] = text.split(",");
  const digits = whole.replaceAll(".", "");
  const cents = Number(digits) * 100 + Number(frac.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

function isIntegerCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

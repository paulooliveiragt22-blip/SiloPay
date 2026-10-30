import { err, ok, type Result } from "./result";

declare const centsBrand: unique symbol;

/** Inteiro em centavos. O saldo da subconta não é calculado aqui. */
export type Cents = number & { readonly [centsBrand]: true };

export function parseReaisToCents(raw: unknown): Result<Cents> {
  if (typeof raw !== "string") return err("centavos_invalidos");
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return err("centavos_invalidos");
  const [whole, frac = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
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

function isIntegerCents(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

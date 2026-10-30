import { err, ok, type Result } from "./result";

export const BRAZIL_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;

export type BrazilState = (typeof BRAZIL_STATES)[number];

export type PostalAddress = {
  street: string;
  district: string;
  city: string;
  state: BrazilState;
};

export type EmployeeProfile = {
  jobTitle: string;
  phone: string;
  postalCode: string;
  street: string;
  streetNumber: string;
  complement: string | null;
  district: string;
  city: string;
  state: BrazilState;
  hiredOn: string | null;
};

export function parseCepDigits(value: unknown): Result<string> {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  if (!/^[0-9]{8}$/.test(digits)) return err("cep_invalido");
  return ok(digits);
}

export function parsePostalLookup(input: unknown): Result<PostalAddress> {
  if (!input || typeof input !== "object") return err("cep_nao_encontrado");
  const row = input as Record<string, unknown>;
  if (row.erro === true) return err("cep_nao_encontrado");
  const city = clip(row.localidade, 80);
  const state = typeof row.uf === "string" ? row.uf.trim().toUpperCase() : "";
  if (!city || !isState(state)) return err("cep_nao_encontrado");
  return ok({
    street: clip(row.logradouro, 120) ?? "",
    district: clip(row.bairro, 80) ?? "",
    city,
    state,
  });
}

export function parseEmployeeProfile(input: {
  jobTitle: unknown;
  phone: unknown;
  postalCode: unknown;
  street: unknown;
  streetNumber: unknown;
  complement: unknown;
  district: unknown;
  city: unknown;
  state: unknown;
  hiredOn: unknown;
}): Result<EmployeeProfile> {
  const jobTitle = clip(input.jobTitle, 80);
  if (!jobTitle) return err("cargo_invalido");
  const phone = parsePhone(input.phone);
  if (!phone) return err("telefone_invalido");
  const postalCode = parseCepDigits(input.postalCode);
  if (!postalCode.ok) return postalCode;
  const street = clip(input.street, 120);
  const streetNumber = clip(input.streetNumber, 20);
  const district = clip(input.district, 80);
  const city = clip(input.city, 80);
  const state = typeof input.state === "string" ? input.state.trim().toUpperCase() : "";
  const complement = optional(input.complement, 80);
  if (
    !street ||
    !streetNumber ||
    !district ||
    !city ||
    !isState(state) ||
    complement === "long"
  ) {
    return err("endereco_invalido");
  }
  const hiredOn = parseHiredOn(input.hiredOn);
  if (!hiredOn.ok) return hiredOn;
  return ok({
    jobTitle,
    phone,
    postalCode: postalCode.value,
    street,
    streetNumber,
    complement,
    district,
    city,
    state,
    hiredOn: hiredOn.value,
  });
}

function parsePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let digits = value.replace(/\D/g, "");
  if (/^55[0-9]{10,11}$/.test(digits)) digits = digits.slice(2);
  if (!/^[0-9]{10,11}$/.test(digits)) return null;
  return digits;
}

function parseHiredOn(value: unknown): Result<string | null> {
  if (value === null || value === undefined) return ok(null);
  if (typeof value !== "string") return err("admissao_invalida");
  const text = value.trim();
  if (text.length === 0) return ok(null);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return err("admissao_invalida");
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return err("admissao_invalida");
  }
  return ok(text);
}

function optional(value: unknown, max: number): string | null | "long" {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (text.length === 0) return null;
  if (text.length > max) return "long";
  return text;
}

function clip(value: unknown, max: number): string | null {
  const text = optional(value, max);
  if (text === "long" || text === null) return null;
  return text;
}

function isState(value: string): value is BrazilState {
  return BRAZIL_STATES.some((state) => state === value);
}

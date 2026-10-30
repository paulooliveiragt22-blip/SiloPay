import type { CadastroColaborador } from "@/data/supabase/reads";

export function formatPhone(digits: string): string {
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return digits;
}

export function formatCep(digits: string): string {
  if (digits.length !== 8) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatHiredOn(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatCadastroAddress(cadastro: CadastroColaborador): string | null {
  if (!cadastro.street || !cadastro.streetNumber || !cadastro.city || !cadastro.state) return null;
  const line = [cadastro.street, cadastro.streetNumber, cadastro.complement].filter(Boolean).join(", ");
  const place = [cadastro.district, `${cadastro.city}/${cadastro.state}`].filter(Boolean).join(", ");
  const cep = cadastro.postalCode ? `CEP ${formatCep(cadastro.postalCode)}` : null;
  return [line, place, cep].filter(Boolean).join(" — ");
}

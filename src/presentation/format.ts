export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function maskBrlInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 13).replace(/^0+/, "");
  if (digits.length === 0) return "";
  const padded = digits.padStart(3, "0");
  const fraction = padded.slice(-2);
  const whole = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${whole},${fraction}`;
}

export function centsToReaisInput(cents: number): string {
  const abs = Math.abs(Math.trunc(cents));
  if (abs === 0) return "0,00";
  return maskBrlInput(String(abs));
}

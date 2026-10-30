import { RECEIPT_CATEGORIES, type ReceiptCategory } from "@/domain/receipt";

const labels: Record<ReceiptCategory, string> = {
  combustivel: "Combustível",
  alimentacao: "Alimentação",
  pedagio: "Pedágio",
  hospedagem: "Hospedagem",
  manutencao: "Manutenção",
  insumos: "Insumos",
  frete: "Frete",
  outros: "Outros",
};

export const categoryOptions = RECEIPT_CATEGORIES.map((value) => ({
  value,
  label: labels[value],
}));

export function categoryLabel(value: string): string {
  if (isCategory(value)) return labels[value];
  return value;
}

function isCategory(value: string): value is ReceiptCategory {
  return RECEIPT_CATEGORIES.some((category) => category === value);
}

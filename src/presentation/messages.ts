import type { DomainError } from "@/domain/result";

const messages: Record<DomainError, string> = {
  centavos_invalidos: "Informe um valor em reais, com no máximo duas casas.",
  valor_nao_positivo: "O valor precisa ser maior que zero.",
  valor_aceito_invalido: "O valor aceito fica entre zero e o informado.",
  categoria_invalida: "Categoria fora da lista.",
  recibo_invalido: "Identificador inválido.",
  foto_invalida: "A foto precisa ser JPG, PNG ou WebP na pasta do funcionário.",
  observacao_invalida: "A observação passa de 200 caracteres.",
  retorno_rpc_invalido: "O banco devolveu um retorno inesperado.",
};

export function messageFor(error: DomainError): string {
  return messages[error];
}

export function messageFromUnknown(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "Não foi possível concluir.";
}

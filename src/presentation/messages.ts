import { unstable_rethrow } from "next/navigation";
import type { DomainError } from "@/domain/result";

const messages: Record<DomainError, string> = {
  centavos_invalidos: "Informe um valor em reais, com no máximo duas casas.",
  valor_nao_positivo: "O valor precisa ser maior que zero.",
  valor_aceito_invalido: "O valor aceito fica entre zero e o informado.",
  categoria_invalida: "Categoria fora da lista.",
  recibo_invalido: "Identificador inválido.",
  foto_invalida: "A foto precisa ser JPG, PNG ou WebP na pasta do funcionário.",
  observacao_invalida: "A observação passa de 200 caracteres.",
  nome_invalido: "Informe o nome do colaborador.",
  cpf_invalido: "O CPF precisa ter 11 dígitos.",
  chave_pix_invalida: "Informe o tipo e a chave Pix.",
  provedor_invalido: "O código do adaptador usa letras minúsculas, números e _.",
  ambiente_invalido: "O ambiente é sandbox ou produção.",
  segredo_invalido: "Informe a chave de API e o segredo do webhook.",
  conta_externa_invalida: "Informe o id da conta no gateway.",
  tipo_pix_invalido: "O envio é adiantamento ou reembolso.",
  email_invalido: "Informe o e-mail da conta.",
  email_em_uso: "Este e-mail já tem conta.",
  senha_invalida: "A senha nova precisa de 10 a 72 caracteres, com letra e número, diferente do e-mail e da senha temporária.",
  senha_nao_confere: "A confirmação não é igual à senha nova.",
  cargo_invalido: "Informe o cargo, com até 80 caracteres.",
  telefone_invalido: "O telefone precisa ter DDD e 10 ou 11 dígitos.",
  cep_invalido: "O CEP precisa ter 8 dígitos.",
  cep_nao_encontrado: "CEP não encontrado.",
  cep_indisponivel: "Não foi possível consultar o CEP. Tente de novo.",
  endereco_invalido: "Informe rua, número, bairro, cidade e UF.",
  admissao_invalida: "A data de admissão não é válida.",
  retorno_rpc_invalido: "O banco devolveu um retorno inesperado.",
};

export function messageFor(error: DomainError): string {
  return messages[error];
}

export function messageFromUnknown(error: unknown): string {
  const text = describeError(error);
  if (/fetch failed|timeout|timed out|econnreset|socket|other side closed/i.test(text)) {
    return "Não foi possível falar com o banco. Tente de novo.";
  }
  if (/saldo da empresa não cobre/i.test(text)) {
    return "O saldo da empresa não cobre este valor.";
  }
  if (/sobra do colaborador não cobre/i.test(text)) {
    return "A sobra do colaborador não cobre este valor.";
  }
  if (/não há sobra nesta subconta/i.test(text)) {
    return "Não há sobra nesta subconta.";
  }
  if (/ainda não tem conta/i.test(text)) {
    return "Este colaborador ainda não tem conta.";
  }
  if (/já tem conta vinculada/i.test(text)) {
    return "Este colaborador já tem conta vinculada.";
  }
  if (/já pertence a uma empresa/i.test(text)) {
    return "Este e-mail já pertence a uma empresa.";
  }
  if (/já tem conta|already been registered|already registered|email_exists/i.test(text)) {
    return "Este e-mail já tem conta.";
  }
  if (/senha temporária venceu/i.test(text)) {
    return "A senha temporária venceu. Peça outra à empresa.";
  }
  if (/troque a senha temporária/i.test(text)) {
    return "Troque a senha temporária antes de continuar.";
  }
  if (/esta conta é de colaborador/i.test(text)) {
    return "Esta conta é de colaborador.";
  }
  if (/já foi analisado/i.test(text)) {
    return "Este comprovante já foi analisado.";
  }
  if (/não está na sua subconta/i.test(text)) {
    return "Este comprovante não está na sua subconta.";
  }
  if (/senha temporária não confere|invalid login credentials/i.test(text)) {
    return "A senha temporária não confere.";
  }
  const line = text
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.length > 0 && !part.startsWith("{") && part.length < 240);
  if (line) return line;
  return "Não foi possível concluir.";
}

export function failAction(error: unknown): { ok: false; message: string } {
  unstable_rethrow(error);
  return { ok: false, message: messageFromUnknown(error) };
}

function describeError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    const details = "details" in error ? String((error as { details?: unknown }).details ?? "") : "";
    const cause = error.cause instanceof Error ? error.cause.message : "";
    return `${error.message}\n${details}\n${cause}`;
  }
  if (error && typeof error === "object" && "message" in error) {
    const record = error as { message?: unknown; details?: unknown };
    return `${String(record.message ?? "")}\n${String(record.details ?? "")}`;
  }
  return "";
}

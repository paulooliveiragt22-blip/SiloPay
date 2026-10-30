export type DomainError =
  | "centavos_invalidos"
  | "valor_nao_positivo"
  | "valor_aceito_invalido"
  | "categoria_invalida"
  | "recibo_invalido"
  | "foto_invalida"
  | "observacao_invalida"
  | "nome_invalido"
  | "cpf_invalido"
  | "chave_pix_invalida"
  | "provedor_invalido"
  | "ambiente_invalido"
  | "segredo_invalido"
  | "conta_externa_invalida"
  | "tipo_pix_invalido"
  | "email_invalido"
  | "email_em_uso"
  | "senha_invalida"
  | "senha_nao_confere"
  | "cargo_invalido"
  | "telefone_invalido"
  | "cep_invalido"
  | "cep_nao_encontrado"
  | "cep_indisponivel"
  | "endereco_invalido"
  | "admissao_invalida"
  | "retorno_rpc_invalido";

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: DomainError };
export type Result<T> = Ok<T> | Err;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err(error: DomainError): Err {
  return { ok: false, error };
}

export type DomainError =
  | "centavos_invalidos"
  | "valor_nao_positivo"
  | "valor_aceito_invalido"
  | "categoria_invalida"
  | "recibo_invalido"
  | "foto_invalida"
  | "observacao_invalida"
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

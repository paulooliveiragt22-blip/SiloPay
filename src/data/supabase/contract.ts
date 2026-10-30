import type { Database, Tables } from "./database.types";
import type { ReceiptCategory } from "../../domain/receipt";

export type MinhaEmpresa = Tables<"v_minha_empresa">;
export type MinhaSubconta = Tables<"v_minha_subconta">;
export type SubcontaFuncionario = Tables<"v_subconta_funcionario">;
export type FilaComprovante = Tables<"v_fila_comprovantes">;
export type ComprovanteLinha = Tables<"v_comprovantes">;
export type ExtratoLinha = Tables<"v_meu_extrato"> | Tables<"v_extrato_funcionario">;
export type ContaPagamento = Tables<"v_conta_pagamento">;
export type SaldoEmpresaLinha = Tables<"v_saldo_empresa">;
export type ExtratoEmpresaLinha = Tables<"v_extrato_empresa">;
export type MeuAcesso = Tables<"v_meu_acesso">;

type EnumCategory = Database["public"]["Enums"]["gestor_receipt_category"];

export const categoryMatchesEnum: [ReceiptCategory, EnumCategory] extends [EnumCategory, ReceiptCategory]
  ? true
  : never = true;

import type { Database, Tables } from "./database.types";
import type { ReceiptCategory } from "../../domain/receipt";

export type MinhaSubconta = Tables<"v_minha_subconta">;
export type SubcontaFuncionario = Tables<"v_subconta_funcionario">;
export type FilaComprovante = Tables<"v_fila_comprovantes">;
export type ExtratoLinha = Tables<"v_meu_extrato">;

type EnumCategory = Database["public"]["Enums"]["gestor_receipt_category"];

export const categoryMatchesEnum: [ReceiptCategory, EnumCategory] extends [EnumCategory, ReceiptCategory]
  ? true
  : never = true;

import "server-only";
import { parseLoginEmail } from "@/domain/link-account";
import { generateProvisionalPassword, parseEmployeeWithAccess, parseNewPassword, provisionalExpiresAt } from "@/domain/provisional-password";
import { err, ok, type Result } from "@/domain/result";
import { parseCadastrarFuncionario, parseUuid, parseVincularFuncionario } from "@/domain/rpc";
import {
  abrirAcessoColaboradorRpc,
  cadastrarFuncionarioComAcessoRpc,
  confirmarSenhaInicialRpc,
  encerrarAcessoVencidoRpc,
  renovarSenhaColaboradorRpc,
} from "../supabase/mutations";
import { createClient } from "../supabase/server";
import { readSession } from "../supabase/session";
import { createCollaboratorUser, deleteCollaboratorUser, replaceCollaboratorPassword } from "./admin-users";

export type ProvisionalAccess = { employeeId: string; provisionalPassword: string };

function expiresAt(): string {
  return provisionalExpiresAt(new Date()).toISOString();
}

function emailInUse(error: unknown): boolean {
  const text = error instanceof Error ? error.message : "";
  return /already been registered|already registered|email_exists/i.test(text);
}

export async function executeCadastrarComAcesso(input: {
  name: unknown;
  cpf: unknown;
  pixKeyType: unknown;
  pixKey: unknown;
  email: unknown;
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
}): Promise<Result<ProvisionalAccess>> {
  const parsed = parseEmployeeWithAccess(input);
  if (!parsed.ok) return parsed;
  const password = generateProvisionalPassword();
  let userId: string;
  try {
    userId = await createCollaboratorUser(parsed.value.email, password);
  } catch (error: unknown) {
    if (emailInUse(error)) return err("email_em_uso");
    throw error;
  }
  try {
    const raw = await cadastrarFuncionarioComAcessoRpc({
      name: parsed.value.name,
      cpf: parsed.value.cpf,
      pixKeyType: parsed.value.pixKeyType,
      pixKey: parsed.value.pixKey,
      userId,
      expiresAt: expiresAt(),
      jobTitle: parsed.value.jobTitle,
      phone: parsed.value.phone,
      postalCode: parsed.value.postalCode,
      street: parsed.value.street,
      streetNumber: parsed.value.streetNumber,
      complement: parsed.value.complement,
      district: parsed.value.district,
      city: parsed.value.city,
      state: parsed.value.state,
      hiredOn: parsed.value.hiredOn,
    });
    const created = parseCadastrarFuncionario(raw);
    if (!created.ok) {
      await deleteCollaboratorUser(userId);
      return created;
    }
    return { ok: true, value: { employeeId: created.value.employeeId, provisionalPassword: password } };
  } catch (error: unknown) {
    await deleteCollaboratorUser(userId);
    throw error;
  }
}

export async function executeAbrirAcesso(input: { employeeId: unknown; email: unknown }): Promise<Result<ProvisionalAccess>> {
  const employeeId = parseUuid(input.employeeId);
  if (!employeeId.ok) return employeeId;
  const email = parseLoginEmail(input.email);
  if (!email.ok) return email;
  const password = generateProvisionalPassword();
  let userId: string;
  try {
    userId = await createCollaboratorUser(email.value, password);
  } catch (error: unknown) {
    if (emailInUse(error)) return err("email_em_uso");
    throw error;
  }
  try {
    const raw = await abrirAcessoColaboradorRpc({
      employeeId: employeeId.value,
      userId,
      expiresAt: expiresAt(),
    });
    const linked = parseVincularFuncionario(raw);
    if (!linked.ok) {
      await deleteCollaboratorUser(userId);
      return linked;
    }
    return { ok: true, value: { employeeId: linked.value.employeeId, provisionalPassword: password } };
  } catch (error: unknown) {
    await deleteCollaboratorUser(userId);
    throw error;
  }
}

export async function executeRenovarSenha(employeeId: unknown): Promise<Result<{ provisionalPassword: string }>> {
  const id = parseUuid(employeeId);
  if (!id.ok) return id;
  const password = generateProvisionalPassword();
  const raw = await renovarSenhaColaboradorRpc({ employeeId: id.value, expiresAt: expiresAt() });
  const row = raw && typeof raw === "object" ? (raw as { user_id?: unknown }).user_id : null;
  const userId = parseUuid(row);
  if (!userId.ok) return err("retorno_rpc_invalido");
  await replaceCollaboratorPassword(userId.value, password);
  return { ok: true, value: { provisionalPassword: password } };
}

export async function executeTrocarSenhaInicial(input: {
  next: unknown;
  confirm: unknown;
  current: unknown;
}): Promise<Result<true>> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";
  const parsed = parseNewPassword({ ...input, email });
  if (!parsed.ok) return parsed;
  const { error } = await supabase.auth.updateUser({
    password: parsed.value,
    current_password: String(input.current),
  });
  if (error) throw error;
  const raw = await confirmarSenhaInicialRpc();
  if (!raw || typeof raw !== "object" || (raw as { ok?: unknown }).ok !== true) return err("retorno_rpc_invalido");
  return ok(true);
}

export async function expireProvisionalAccess(): Promise<boolean> {
  const session = await readSession();
  if (!session) return false;
  await encerrarAcessoVencidoRpc();
  await replaceCollaboratorPassword(session.userId, generateProvisionalPassword());
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  return true;
}

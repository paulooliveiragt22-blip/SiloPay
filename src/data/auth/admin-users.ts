import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "../supabase/env";

function secretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Falta SUPABASE_SECRET_KEY no servidor.");
  return key;
}

function adminAuth() {
  const { url } = publicEnv();
  return createClient(url, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createCollaboratorUser(email: string, password: string): Promise<string> {
  const { data, error } = await adminAuth().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { silopay_conta: "funcionario" },
  });
  if (error) throw error;
  if (!data.user?.id) throw new Error("O login do colaborador não foi criado.");
  return data.user.id;
}

export async function deleteCollaboratorUser(userId: string): Promise<void> {
  const { error } = await adminAuth().auth.admin.deleteUser(userId);
  if (error) throw error;
}

export async function replaceCollaboratorPassword(userId: string, password: string): Promise<void> {
  const { error } = await adminAuth().auth.admin.updateUserById(userId, { password });
  if (error) throw error;
}

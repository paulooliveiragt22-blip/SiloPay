import "server-only";
import { redirect } from "next/navigation";
import { readSession, type Session } from "@/data/supabase/session";

export async function verifySession(): Promise<Session> {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

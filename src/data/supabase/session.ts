import "server-only";
import { cache } from "react";
import { readMembership, type Membership } from "./reads";
import { createClient } from "./server";

export type Session = {
  userId: string;
  membership: Membership | null;
};

export const readSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string" || userId.length === 0) return null;
  const membership = await readMembership();
  return { userId, membership };
});

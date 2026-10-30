import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { publicEnv } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = publicEnv();

  return createServerClient<Database>(url, publishableKey, {
    global: { fetch: fetchWithRetry },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Em Server Component o cookie não grava. A renovação fica no proxy.
        }
      },
    },
  });
}

async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error: unknown) {
    if (init?.signal?.aborted || !isTransientFetchError(error)) throw error;
    return await fetch(input, init);
  }
}

function isTransientFetchError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  return /fetch failed|timeout|econnreset|socket|other side closed/i.test(`${message} ${cause}`);
}

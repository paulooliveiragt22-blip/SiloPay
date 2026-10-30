import "server-only";
import { RECEIPT_BUCKET } from "./receipt-bucket";
import { createClient } from "./server";

const SIGNED_URL_SECONDS = 600;

export async function signReceiptPhoto(path: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

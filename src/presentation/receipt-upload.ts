import { RECEIPT_PHOTO_MAX_BYTES, parseReceiptPhotoPath } from "@/domain/receipt";
import { RECEIPT_BUCKET } from "@/data/supabase/receipt-bucket";
import { createBrowserSupabase } from "@/data/supabase/browser";

export async function uploadReceiptPhoto(
  file: File,
  owner: { companyId: string; employeeId: string },
): Promise<{ ok: true; path: string } | { ok: false; message: string }> {
  const extension = extensionOf(file);
  if (file.size === 0 || !extension) return { ok: false, message: "Escolha uma foto JPG, PNG ou WebP." };
  if (file.size > RECEIPT_PHOTO_MAX_BYTES) return { ok: false, message: "A foto passa de 5 MB." };

  const path = parseReceiptPhotoPath(`${owner.companyId}/${owner.employeeId}/${crypto.randomUUID()}.${extension}`, owner);
  if (!path.ok) return { ok: false, message: "Não foi possível montar o caminho da foto." };

  const supabase = createBrowserSupabase();
  const uploaded = await supabase.storage.from(RECEIPT_BUCKET).upload(path.value, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploaded.error) return { ok: false, message: "Não foi possível enviar a foto." };
  return { ok: true, path: path.value };
}

function extensionOf(file: File): "jpg" | "png" | "webp" | null {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return null;
}

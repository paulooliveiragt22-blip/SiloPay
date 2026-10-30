import { RECEIPT_PHOTO_MAX_BYTES, parseReceiptPhotoPath } from "@/domain/receipt";
import { RECEIPT_BUCKET } from "@/data/supabase/receipt-bucket";
import { createBrowserSupabase } from "@/data/supabase/browser";

export function planReceiptPhoto(
  file: File,
  owner: { companyId: string; employeeId: string },
): { ok: true; path: string } | { ok: false; message: string } {
  const extension = extensionOf(file);
  if (file.size === 0 || !extension) return { ok: false, message: "Escolha uma foto JPG, PNG ou WebP." };
  if (file.size > RECEIPT_PHOTO_MAX_BYTES) return { ok: false, message: "A foto passa de 5 MB." };
  const path = parseReceiptPhotoPath(`${owner.companyId}/${owner.employeeId}/${crypto.randomUUID()}.${extension}`, owner);
  if (!path.ok) return { ok: false, message: "Não foi possível montar o caminho da foto." };
  return { ok: true, path: path.value };
}

export async function uploadReceiptPhoto(
  file: File,
  owner: { companyId: string; employeeId: string },
  storagePath?: string,
): Promise<{ ok: true; path: string } | { ok: false; message: string; offline: boolean }> {
  if (file.size === 0 || file.size > RECEIPT_PHOTO_MAX_BYTES) {
    return {
      ok: false,
      message: file.size > RECEIPT_PHOTO_MAX_BYTES ? "A foto passa de 5 MB." : "Escolha uma foto JPG, PNG ou WebP.",
      offline: false,
    };
  }

  const extension = extensionOf(file);
  if (!storagePath && !extension) return { ok: false, message: "Escolha uma foto JPG, PNG ou WebP.", offline: false };
  const raw = storagePath ?? `${owner.companyId}/${owner.employeeId}/${crypto.randomUUID()}.${extension}`;
  const path = parseReceiptPhotoPath(raw, owner);
  if (!path.ok) return { ok: false, message: "Não foi possível montar o caminho da foto.", offline: false };

  const supabase = createBrowserSupabase();
  const uploaded = await supabase.storage.from(RECEIPT_BUCKET).upload(path.value, file, {
    contentType: file.type || contentTypeFromPath(path.value),
    upsert: false,
  });
  if (uploaded.error) {
    const text = uploaded.error.message;
    if (/already exists|duplicate|resource already exists/i.test(text)) return { ok: true, path: path.value };
    const offline = !navigator.onLine || /fetch|network|failed to fetch|load failed/i.test(text);
    return { ok: false, message: offline ? "Sem rede." : "Não foi possível enviar a foto.", offline };
  }
  return { ok: true, path: path.value };
}

function contentTypeFromPath(value: string) {
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function extensionOf(file: File): "jpg" | "png" | "webp" | null {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return null;
}

import "server-only";
import { cipherKeyFromBase64, sealSecret } from "./cipher";

export function sealGatewaySecret(plain: string): Buffer {
  const raw = process.env.PAYMENT_KEYS_ENCRYPTION_KEY;
  if (!raw) throw new Error("cifra ausente");
  return sealSecret(plain, cipherKeyFromBase64(raw));
}

export function ciphertextHex(payload: Buffer): string {
  return `\\x${payload.toString("hex")}`;
}

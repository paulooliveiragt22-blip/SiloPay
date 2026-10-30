import "server-only";
import { parseCepDigits, parsePostalLookup, type PostalAddress } from "@/domain/address";
import { err, type Result } from "@/domain/result";

export async function lookupPostalCode(cep: unknown): Promise<Result<PostalAddress>> {
  const digits = parseCepDigits(cep);
  if (!digits.ok) return digits;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits.value}/json/`, {
      signal: AbortSignal.timeout(5_000),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return err("cep_indisponivel");
    return parsePostalLookup(await response.json());
  } catch {
    return err("cep_indisponivel");
  }
}

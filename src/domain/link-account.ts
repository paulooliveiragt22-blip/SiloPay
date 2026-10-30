import { err, ok, type Result } from "./result";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseLoginEmail(value: unknown): Result<string> {
  if (typeof value !== "string") return err("email_invalido");
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || !EMAIL.test(email)) return err("email_invalido");
  return ok(email);
}

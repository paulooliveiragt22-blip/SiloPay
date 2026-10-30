import { parseEmployeeProfile, type EmployeeProfile } from "./address";
import { parseLoginEmail } from "./link-account";
import { parseEmployeeRegistration, type EmployeeRegistration } from "./employee";
import { err, ok, type Result } from "./result";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export const PROVISIONAL_PASSWORD_TTL_MS = 24 * 60 * 60 * 1000;

export type EmployeeWithAccess = EmployeeRegistration & { email: string } & EmployeeProfile;

export function parseEmployeeWithAccess(input: {
  name: unknown;
  cpf: unknown;
  pixKeyType: unknown;
  pixKey: unknown;
  email: unknown;
  jobTitle: unknown;
  phone: unknown;
  postalCode: unknown;
  street: unknown;
  streetNumber: unknown;
  complement: unknown;
  district: unknown;
  city: unknown;
  state: unknown;
  hiredOn: unknown;
}): Result<EmployeeWithAccess> {
  const registration = parseEmployeeRegistration(input);
  if (!registration.ok) return registration;
  const email = parseLoginEmail(input.email);
  if (!email.ok) return email;
  const profile = parseEmployeeProfile(input);
  if (!profile.ok) return profile;
  return ok({ ...registration.value, email: email.value, ...profile.value });
}

export function generateProvisionalPassword(): string {
  const values = new Uint32Array(16);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

export function provisionalExpiresAt(now: Date): Date {
  return new Date(now.getTime() + PROVISIONAL_PASSWORD_TTL_MS);
}

export function parseNewPassword(input: {
  next: unknown;
  confirm: unknown;
  current: unknown;
  email: string;
}): Result<string> {
  if (typeof input.next !== "string" || typeof input.confirm !== "string" || typeof input.current !== "string") {
    return err("senha_invalida");
  }
  if (input.current.length === 0) return err("senha_invalida");
  if (input.next !== input.confirm) return err("senha_nao_confere");
  if (input.next.length < 10 || input.next.length > 72) return err("senha_invalida");
  if (!/[A-Za-z]/.test(input.next) || !/[0-9]/.test(input.next)) return err("senha_invalida");
  if (input.next.toLowerCase() === input.email.toLowerCase()) return err("senha_invalida");
  if (input.next === input.current) return err("senha_invalida");
  return ok(input.next);
}

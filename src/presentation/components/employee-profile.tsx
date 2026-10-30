import type { CadastroColaborador } from "@/data/supabase/reads";
import { formatCadastroAddress, formatHiredOn, formatPhone } from "@/presentation/address-format";
import { pixKeyLabel } from "@/presentation/pix-keys";

export function EmployeeProfile({ cadastro }: { cadastro: CadastroColaborador | null }) {
  if (!cadastro) return null;
  const address = formatCadastroAddress(cadastro);
  const pix = pixLine(cadastro.pixKeyType, cadastro.pixKey);
  const rows = [
    cadastro.name ? { term: "Nome", value: cadastro.name, wide: true } : null,
    cadastro.cpf ? { term: "CPF", value: formatCpf(cadastro.cpf) } : null,
    cadastro.email ? { term: "E-mail", value: cadastro.email, wide: true } : null,
    pix ? { term: "Chave Pix", value: pix, wide: true } : null,
    cadastro.jobTitle ? { term: "Cargo", value: cadastro.jobTitle } : null,
    cadastro.phone ? { term: "Telefone", value: formatPhone(cadastro.phone) } : null,
    address ? { term: "Endereço", value: address, wide: true } : null,
    cadastro.hiredOn ? { term: "Admissão", value: formatHiredOn(cadastro.hiredOn) } : null,
  ].filter((row) => row !== null);

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {rows.map((row) => (
        <Detail key={row.term} term={row.term} value={row.value} wide={row.wide} />
      ))}
    </dl>
  );
}

function Detail({ term, value, wide = false }: { term: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="break-words text-foreground">{value}</dd>
    </div>
  );
}

function formatCpf(digits: string): string {
  const value = digits.replace(/\D/g, "");
  if (value.length !== 11) return digits;
  return `${value.slice(0, 3)}.${value.slice(3, 6)}.${value.slice(6, 9)}-${value.slice(9)}`;
}

function pixLine(type: string | null, key: string | null): string | null {
  const value = key?.trim();
  if (!value) return null;
  if (!type) return value;
  return `${pixKeyLabel(type)} · ${type === "cpf" ? formatCpf(value) : value}`;
}

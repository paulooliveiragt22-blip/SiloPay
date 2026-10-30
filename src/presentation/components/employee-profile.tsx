import type { CadastroColaborador } from "@/data/supabase/reads";
import { formatCadastroAddress, formatHiredOn, formatPhone } from "@/presentation/address-format";

export function EmployeeProfile({ cadastro }: { cadastro: CadastroColaborador | null }) {
  if (!cadastro) return null;
  const address = formatCadastroAddress(cadastro);
  if (!cadastro.jobTitle && !cadastro.phone && !address && !cadastro.hiredOn) return null;

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      {cadastro.jobTitle ? <Detail term="Cargo" value={cadastro.jobTitle} /> : null}
      {cadastro.phone ? <Detail term="Telefone" value={formatPhone(cadastro.phone)} /> : null}
      {address ? <Detail term="Endereço" value={address} wide /> : null}
      {cadastro.hiredOn ? <Detail term="Admissão" value={formatHiredOn(cadastro.hiredOn)} /> : null}
    </dl>
  );
}

function Detail({ term, value, wide = false }: { term: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

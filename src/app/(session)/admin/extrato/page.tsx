import { readExtratoEmpresa } from "@/data/supabase/reads";
import { CompanyCashList } from "@/presentation/components/company-cash-list";
import { PageStack } from "@/presentation/components/saldo";

export const dynamic = "force-dynamic";

export default async function ExtratoContaPage() {
  const items = await readExtratoEmpresa();

  return (
    <PageStack title="Extrato da empresa">
      <CompanyCashList items={items} />
    </PageStack>
  );
}

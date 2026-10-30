import { redirect } from "next/navigation";

export default async function FuncionarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/colaboradores?id=${encodeURIComponent(id)}`);
}

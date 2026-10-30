import { redirect } from "next/navigation";

export default function NovoFuncionarioPage() {
  redirect("/admin/colaboradores?cadastro=novo");
}

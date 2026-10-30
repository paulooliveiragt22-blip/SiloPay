import { redirect } from "next/navigation";

export default function NovoComprovantePage() {
  redirect("/campo?enviar=1");
}

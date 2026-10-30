import { redirect } from "next/navigation";
import { verifySession } from "@/presentation/session";
import { redirectIfProvisionalPassword } from "@/presentation/access-gate";

export default async function HomePage() {
  const session = await verifySession();
  await redirectIfProvisionalPassword();
  if (!session.membership) redirect("/comecar");
  redirect(session.membership.role === "admin" ? "/admin" : "/campo");
}

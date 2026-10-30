import { redirect } from "next/navigation";
import { verifySession } from "@/presentation/session";

export default async function HomePage() {
  const session = await verifySession();
  if (!session.membership) redirect("/comecar");
  redirect(session.membership.role === "admin" ? "/admin" : "/campo");
}

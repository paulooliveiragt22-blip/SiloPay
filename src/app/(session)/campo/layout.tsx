import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { redirectIfProvisionalPassword } from "@/presentation/access-gate";
import { verifySession } from "@/presentation/session";

export default async function CampoLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  await redirectIfProvisionalPassword();
  if (!session.membership) redirect("/comecar");
  if (session.membership.role !== "funcionario") redirect("/admin");
  return children;
}

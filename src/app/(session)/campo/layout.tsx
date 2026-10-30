import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { verifySession } from "@/presentation/session";

export default async function CampoLayout({ children }: { children: ReactNode }) {
  const session = await verifySession();
  if (!session.membership) redirect("/comecar");
  if (session.membership.role !== "funcionario") redirect("/admin");
  return children;
}

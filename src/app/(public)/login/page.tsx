import { LoginForm } from "@/presentation/components/login-form";
import { ThemeToggle } from "@/presentation/components/theme-toggle";
import { Wordmark } from "@/presentation/components/wordmark";
import { Card, CardContent, CardDescription, CardHeader } from "@/presentation/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string | string[] }>;
}) {
  const query = await searchParams;
  const expired = query.motivo === "senha-vencida";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl">
              <Wordmark />
            </h1>
            <ThemeToggle />
          </div>
          <CardDescription>Entre com o e-mail da empresa ou do colaborador. O acesso segue o vínculo da conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {expired ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              A senha temporária venceu. Peça outra à empresa.
            </p>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}

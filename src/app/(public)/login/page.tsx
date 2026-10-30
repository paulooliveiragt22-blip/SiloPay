import { LoginForm } from "@/presentation/components/login-form";
import { Wordmark } from "@/presentation/components/wordmark";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl">
          <Wordmark />
        </h1>
        <p className="text-sm text-muted-foreground">Entre com o e-mail da empresa ou do funcionário.</p>
      </div>
      <LoginForm />
    </main>
  );
}

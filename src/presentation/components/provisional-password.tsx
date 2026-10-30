"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ProvisionalPassword({ password }: { password: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground">
        Entregue esta senha em mãos. Ela vale 24 horas, aparece só agora e o colaborador troca no primeiro acesso.
      </p>
      <Label htmlFor="provisional-password">Senha temporária</Label>
      <Input id="provisional-password" readOnly value={password} autoComplete="off" />
      <Button type="button" variant="outline" onClick={() => void copy()}>
        {copied ? "Copiada" : "Copiar"}
      </Button>
    </div>
  );
}

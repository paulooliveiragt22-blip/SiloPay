"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CadastroColaborador } from "@/data/supabase/reads";
import { buscarCepAction } from "@/presentation/actions/buscar-cep";
import { atualizarCadastroAction } from "@/presentation/actions/atualizar-cadastro";
import type { ActionResult } from "@/presentation/actions/review-receipt";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

function maskCep(digits: string) {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function hiredValue(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function EmployeeProfileForm({
  employeeId,
  cadastro,
  onSaved,
}: {
  employeeId: string;
  cadastro: CadastroColaborador | null;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(atualizarCadastroAction, null as ActionResult | null);
  const [jobTitle, setJobTitle] = useState(cadastro?.jobTitle ?? "");
  const [phone, setPhone] = useState(cadastro?.phone ?? "");
  const [hiredOn, setHiredOn] = useState(hiredValue(cadastro?.hiredOn ?? null));
  const [cep, setCep] = useState(cadastro?.postalCode ?? "");
  const [street, setStreet] = useState(cadastro?.street ?? "");
  const [streetNumber, setStreetNumber] = useState(cadastro?.streetNumber ?? "");
  const [complement, setComplement] = useState(cadastro?.complement ?? "");
  const [district, setDistrict] = useState(cadastro?.district ?? "");
  const [city, setCity] = useState(cadastro?.city ?? "");
  const [uf, setUf] = useState(cadastro?.state ?? "");
  const [looking, setLooking] = useState(false);
  const [cepStatus, setCepStatus] = useState<string | null>(null);
  const initialCep = useRef(cadastro?.postalCode ?? "");

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onSaved();
  }, [onSaved, router, state]);

  useEffect(() => {
    if (cep.length !== 8 || cep === initialCep.current) return;
    let cancelled = false;
    setLooking(true);
    setCepStatus(null);
    buscarCepAction(cep).then((result) => {
      if (cancelled) return;
      setLooking(false);
      if (!result.ok) {
        setCepStatus(result.message);
        return;
      }
      setStreet(result.street);
      setDistrict(result.district);
      setCity(result.city);
      setUf(result.state);
      initialCep.current = cep;
      setCepStatus(result.street ? "Endereço preenchido pelo CEP. Informe o número." : "CEP encontrado. Informe a rua e o número.");
    });
    return () => {
      cancelled = true;
    };
  }, [cep]);

  return (
    <form action={action}>
      <input type="hidden" name="employeeId" value={employeeId} />
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field>
          <Label htmlFor="edit-job">Cargo</Label>
          <Input id="edit-job" name="jobTitle" required maxLength={80} autoComplete="organization-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="edit-phone">Telefone</Label>
          <Input id="edit-phone" name="phone" required inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="edit-hired">Data de admissão (opcional)</Label>
          <Input id="edit-hired" name="hiredOn" type="date" value={hiredOn} onChange={(event) => setHiredOn(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="edit-cep">CEP</Label>
          <Input
            id="edit-cep"
            name="postalCode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            value={maskCep(cep)}
            onChange={(event) => setCep(event.target.value.replace(/\D/g, "").slice(0, 8))}
          />
        </Field>
        <Field>
          <Label htmlFor="edit-number">Número</Label>
          <Input id="edit-number" name="streetNumber" required maxLength={20} value={streetNumber} onChange={(event) => setStreetNumber(event.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="edit-street">Rua</Label>
          <Input id="edit-street" name="street" required maxLength={120} autoComplete="street-address" value={street} onChange={(event) => setStreet(event.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="edit-complement">Complemento (opcional)</Label>
          <Input id="edit-complement" name="complement" maxLength={80} value={complement} onChange={(event) => setComplement(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="edit-district">Bairro</Label>
          <Input id="edit-district" name="district" required maxLength={80} value={district} onChange={(event) => setDistrict(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="edit-city">Cidade</Label>
          <Input id="edit-city" name="city" required maxLength={80} autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="edit-state">UF</Label>
          <Input id="edit-state" name="state" required maxLength={2} autoComplete="address-level1" value={uf} onChange={(event) => setUf(event.target.value.toUpperCase())} />
        </Field>
        <p className="text-sm text-muted-foreground sm:col-span-2" role="status">
          {looking ? "Buscando CEP…" : cepStatus ?? "CPF, e-mail e Pix permanecem."}
        </p>
        <Button type="submit" className="sm:col-span-2" disabled={pending || looking}>
          {pending ? "Salvando…" : "Salvar cadastro"}
        </Button>
        {state && !state.ok ? (
          <p className="text-sm text-destructive sm:col-span-2" role="alert">
            {state.message}
          </p>
        ) : null}
      </FieldGroup>
    </form>
  );
}

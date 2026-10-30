"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarCepAction } from "@/presentation/actions/buscar-cep";
import { cadastrarFuncionarioAction, type CadastroResult } from "@/presentation/actions/cadastrar-funcionario";
import { pixKeyOptions } from "@/presentation/pix-keys";
import { ProvisionalPassword } from "./provisional-password";
import { Button } from "./ui/button";
import { Field, FieldGroup } from "./ui/field";
import { Input, NativeSelect } from "./ui/input";
import { Label } from "./ui/label";

function maskCep(digits: string) {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function EmployeeForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(cadastrarFuncionarioAction, null as CadastroResult | null);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [hiredOn, setHiredOn] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [pixKey, setPixKey] = useState("");
  const [looking, setLooking] = useState(false);
  const [cepStatus, setCepStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [router, state]);

  useEffect(() => {
    if (cep.length !== 8) return;
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
      setCepStatus(
        result.street
          ? "Endereço preenchido pelo CEP. Informe o número."
          : "CEP encontrado. Informe a rua e o número.",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [cep]);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <ProvisionalPassword password={state.provisionalPassword} />
        <Button type="button" onClick={() => router.replace(`/admin/colaboradores?id=${state.employeeId}`)}>
          Ver cadastro
        </Button>
      </div>
    );
  }

  return (
    <form action={action}>
      <FieldGroup className="grid gap-4 sm:grid-cols-2">
        <Field className="sm:col-span-2">
          <Label htmlFor="employee-name">Nome</Label>
          <Input id="employee-name" name="name" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-cpf">CPF</Label>
          <Input id="employee-cpf" name="cpf" required inputMode="numeric" autoComplete="off" value={cpf} onChange={(event) => setCpf(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-job">Cargo</Label>
          <Input id="employee-job" name="jobTitle" required maxLength={80} autoComplete="organization-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-phone">Telefone</Label>
          <Input id="employee-phone" name="phone" required inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-hired">Data de admissão (opcional)</Label>
          <Input id="employee-hired" name="hiredOn" type="date" value={hiredOn} onChange={(event) => setHiredOn(event.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="employee-email">E-mail do colaborador</Label>
          <Input id="employee-email" name="email" type="email" required autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-cep">CEP</Label>
          <Input
            id="employee-cep"
            name="postalCode"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            value={maskCep(cep)}
            onChange={(event) => setCep(event.target.value.replace(/\D/g, "").slice(0, 8))}
          />
        </Field>
        <Field>
          <Label htmlFor="employee-number">Número</Label>
          <Input id="employee-number" name="streetNumber" required maxLength={20} autoComplete="off" value={streetNumber} onChange={(event) => setStreetNumber(event.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="employee-street">Rua</Label>
          <Input id="employee-street" name="street" required maxLength={120} autoComplete="street-address" value={street} onChange={(event) => setStreet(event.target.value)} />
        </Field>
        <Field className="sm:col-span-2">
          <Label htmlFor="employee-complement">Complemento (opcional)</Label>
          <Input id="employee-complement" name="complement" maxLength={80} autoComplete="off" value={complement} onChange={(event) => setComplement(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-district">Bairro</Label>
          <Input id="employee-district" name="district" required maxLength={80} value={district} onChange={(event) => setDistrict(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-city">Cidade</Label>
          <Input id="employee-city" name="city" required maxLength={80} autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} />
        </Field>
        <Field>
          <Label htmlFor="employee-state">UF</Label>
          <Input
            id="employee-state"
            name="state"
            required
            maxLength={2}
            autoComplete="address-level1"
            value={uf}
            onChange={(event) => setUf(event.target.value.toUpperCase())}
          />
        </Field>
        <p className="text-sm text-muted-foreground sm:col-span-2" role="status">
          {looking ? "Buscando CEP…" : cepStatus ?? "Ao completar o CEP, rua, bairro, cidade e UF são preenchidos."}
        </p>
        <Field>
          <Label htmlFor="employee-pix-type">Tipo da chave Pix</Label>
          <NativeSelect id="employee-pix-type" name="pixKeyType" required value={pixKeyType} onChange={(event) => setPixKeyType(event.target.value)}>
            {pixKeyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <Label htmlFor="employee-pix-key">Chave Pix</Label>
          <Input id="employee-pix-key" name="pixKey" required autoComplete="off" value={pixKey} onChange={(event) => setPixKey(event.target.value)} />
        </Field>
        <p className="text-sm text-muted-foreground sm:col-span-2">A senha temporária aparece depois do cadastro. Entregue em mãos.</p>
        <Button type="submit" className="sm:col-span-2" disabled={pending || looking}>
          {pending ? "Cadastrando…" : "Cadastrar colaborador"}
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

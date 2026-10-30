"use client";

import type { EventoEmpresaView } from "@/data/supabase/reads";

const labels: Record<EventoEmpresaView["kind"], string> = {
  colaborador_criado: "Colaborador criado",
  senha_gerada: "Senha temporária gerada",
  senha_trocada: "Senha trocada",
  senha_renovada: "Senha temporária renovada",
  saldo_adicionado: "Saldo adicionado",
};

export function ActivityList({ events }: { events: EventoEmpresaView[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum registro ainda. Ações anteriores a esta versão não têm autor.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id} className="flex flex-col gap-1 border-l-2 border-primary pl-3">
          <p className="text-sm font-medium text-foreground">{labels[event.kind]}</p>
          <p className="text-sm text-muted-foreground">
            {event.employeeName ? `${event.employeeName} · ` : null}
            por {event.actorName} · {formatWhen(event.occurredAt)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

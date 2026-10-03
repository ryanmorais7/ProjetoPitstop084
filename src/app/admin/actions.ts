"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { horariosBloqueados, StatusAgendamento } from "@/db/schema";
import { eq } from "drizzle-orm";
import { COOKIE_SESSAO, criarTokenSessao, exigirSessaoAdmin, senhaValida } from "@/lib/adminAuth";
import { atualizarStatus, registrarCheckin, iniciarAtendimento } from "@/lib/bookings";
import {
  AgendamentoRecepcao,
  buscarAgendamentoPorCodigo,
  buscarAgendamentoPorToken,
  buscarAgendamentosRecepcao,
} from "@/lib/checkin";
import { interpretarLeituraPitPass } from "@/lib/pitpass";
import { horariosAgendamento } from "@/lib/data";
import { dataValidaParaAgendar } from "@/lib/agenda";

export interface LoginState {
  erro?: string;
}

export async function login(_estado: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const senha = String(formData.get("senha") ?? "");

  if (!(await senhaValida(senha))) {
    return { erro: "Senha incorreta." };
  }

  const token = await criarTokenSessao();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin/agendamentos");
}

export async function logout() {
  const cookieStore = await cookies();
  // precisa do mesmo "path" usado ao criar o cookie em login() — sem isso o navegador
  // trata como um cookie diferente e não limpa a sessão de verdade.
  cookieStore.delete({ name: COOKIE_SESSAO, path: "/admin" });
  redirect("/admin/login");
}

function revalidarAtendimento(id: number) {
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/clientes", "layout");
  revalidatePath(`/admin/atendimentos/${id}`);
}

export async function atualizarStatusAgendamento(id: number, status: StatusAgendamento) {
  await exigirSessaoAdmin();
  await atualizarStatus(id, status);
  revalidarAtendimento(id);
}

/** O QR identifica o agendamento; a placa confirma o veículo. Sem a conferência marcada na ficha, não há check-in. */
export async function fazerCheckin(id: number, formData: FormData) {
  await exigirSessaoAdmin();
  if (formData.get("placaConferida") !== "on") return;
  await registrarCheckin(id);
  revalidarAtendimento(id);
}

export async function iniciarAtendimentoAgendamento(id: number) {
  await exigirSessaoAdmin();
  await iniciarAtendimento(id);
  revalidarAtendimento(id);
}

export type ResultadoLeituraPitPass =
  | { ok: true; id: number }
  | { ok: false; erro: string; candidatos?: AgendamentoRecepcao[] };

/**
 * Resolve o conteúdo lido do QR (URL /checkin/<token>) ou o código digitado (P084-XXXX)
 * para o id do agendamento. Se não for nenhum dos dois, cai na busca interna por nome,
 * WhatsApp, placa ou código do cliente. Só funciona com sessão admin.
 */
export async function localizarPitPass(texto: string): Promise<ResultadoLeituraPitPass> {
  await exigirSessaoAdmin();
  const bruto = String(texto ?? "");
  const referencia = interpretarLeituraPitPass(bruto);
  if (referencia) {
    const registro =
      referencia.tipo === "token"
        ? await buscarAgendamentoPorToken(referencia.valor)
        : await buscarAgendamentoPorCodigo(referencia.valor);
    if (registro) return { ok: true, id: registro.id };
    // link de QR que não existe não é termo de busca
    if (bruto.includes("/checkin/")) {
      return { ok: false, erro: "QR não reconhecido. Busque pelo código P084, nome, WhatsApp ou placa." };
    }
  }

  const candidatos = await buscarAgendamentosRecepcao(bruto);
  if (candidatos.length === 1) return { ok: true, id: candidatos[0].id };
  if (candidatos.length > 1) return { ok: false, erro: "Mais de um agendamento encontrado. Escolha abaixo.", candidatos };
  return {
    ok: false,
    erro:
      referencia?.tipo === "codigo"
        ? `Nenhum agendamento com o código ${referencia.valor}.`
        : "Nenhum próximo agendamento encontrado. Tente o código P084, nome, WhatsApp ou placa.",
  };
}

export async function bloquearHorario(formData: FormData) {
  await exigirSessaoAdmin();
  const dia = String(formData.get("dia") ?? "");
  const horario = String(formData.get("horario") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;

  if (!dataValidaParaAgendar(dia) || !horariosAgendamento.includes(horario)) {
    return;
  }

  await db.insert(horariosBloqueados).values({ dia, horario, motivo });
  revalidatePath("/admin/agenda");
}

export async function desbloquearHorario(id: number) {
  await exigirSessaoAdmin();
  await db.delete(horariosBloqueados).where(eq(horariosBloqueados.id, id));
  revalidatePath("/admin/agenda");
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { horariosBloqueados, StatusAgendamento } from "@/db/schema";
import { eq } from "drizzle-orm";
import { COOKIE_SESSAO, criarTokenSessao, exigirSessaoAdmin, senhaValida } from "@/lib/adminAuth";
import { atualizarStatus } from "@/lib/bookings";
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

export async function atualizarStatusAgendamento(id: number, status: StatusAgendamento) {
  await exigirSessaoAdmin();
  await atualizarStatus(id, status);
  revalidatePath("/admin/agendamentos");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/clientes");
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

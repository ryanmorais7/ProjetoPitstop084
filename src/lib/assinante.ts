import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { assinaturas, clientes, veiculos } from "@/db/schema";
import { hojeIso } from "./agenda";
import {
  buscarAssinaturaVigente,
  buscarClientePorTelefone,
  buscarOuCriarCliente,
  buscarOuCriarVeiculo,
  calcularCiclo,
  verificarBeneficioDisponivel,
} from "./bookings";
import { Catalogo, itemDoBeneficio, planosPara } from "./catalogo";
import {
  CategoriaVeiculo,
  categoriaVeiculoValida,
  formatarRegraBeneficio,
  PlanoId,
  planoValido,
  regrasBeneficios,
  servicosPorPlano,
  tipoDaCategoria,
} from "./data";
import { formatarTelefone, telefoneValido } from "./format";

/**
 * "Sou assinante": o WhatsApp localiza o cadastro PitPass. A resposta pública tem só o que o
 * cartão PitPass já mostra (primeiro nome, plano, modelo e porte). A PLACA NUNCA sai daqui:
 * é ela que a recepção confere na chegada, então não pode ser revelada a quem só digita um número.
 */

export interface BeneficioAssinante {
  nome: string;
  /** "1x por semana", "Até 4x por ciclo"... */
  regra: string;
  descricao: string | null;
  disponivel: boolean;
  motivo: string | null;
}

export interface AssinantePublico {
  primeiroNome: string;
  planoId: PlanoId;
  planoNome: string;
  veiculo: string;
  categoria: CategoriaVeiculo;
  /** Cadastro feito no site, ainda não conferido pela recepção. */
  pendente: boolean;
  beneficios: BeneficioAssinante[];
}

type Cliente = typeof clientes.$inferSelect;
type Assinatura = typeof assinaturas.$inferSelect;
type Veiculo = typeof veiculos.$inferSelect;

export interface AssinanteEncontrado {
  cliente: Cliente;
  assinatura: Assinatura;
  veiculo: Veiculo;
  publico: AssinantePublico;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? "";
}

async function veiculoDaAssinatura(assinatura: Assinatura): Promise<Veiculo | null> {
  const doCliente = await db.select().from(veiculos).where(eq(veiculos.clienteId, assinatura.clienteId));
  return (
    doCliente.find((v) => v.id === assinatura.veiculoId) ?? doCliente.find((v) => v.principal) ?? doCliente[0] ?? null
  );
}

async function montar(
  cliente: Cliente,
  assinatura: Assinatura,
  veiculo: Veiculo,
  catalogo: Catalogo
): Promise<AssinanteEncontrado | null> {
  if (!planoValido(assinatura.plano)) return null;
  const planoId = assinatura.plano;
  const beneficios: BeneficioAssinante[] = [];
  for (const nome of servicosPorPlano[planoId]) {
    const item = itemDoBeneficio(catalogo, nome);
    if (item && !item.ativo) continue;
    const disponibilidade = await verificarBeneficioDisponivel({
      assinaturaId: assinatura.id,
      plano: planoId,
      beneficio: nome,
      cicloInicio: assinatura.cicloInicio,
    });
    beneficios.push({
      nome,
      regra: formatarRegraBeneficio(regrasBeneficios[planoId][nome]),
      descricao: item?.shortDescription ?? null,
      disponivel: disponibilidade.disponivel,
      motivo: disponibilidade.motivo ?? null,
    });
  }
  return {
    cliente,
    assinatura,
    veiculo,
    publico: {
      primeiroNome: primeiroNome(cliente.nome),
      planoId,
      planoNome: catalogo.planos[planoId].nome,
      veiculo: veiculo.modelo,
      categoria: categoriaVeiculoValida(veiculo.porte) ? veiculo.porte : "P",
      pendente: assinatura.status === "pendente",
      beneficios,
    },
  };
}

/** null = esse WhatsApp ainda não tem cadastro PitPass completo (cliente + plano + veículo). */
export async function buscarAssinante(telefone: string, catalogo: Catalogo): Promise<AssinanteEncontrado | null> {
  const cliente = await buscarClientePorTelefone(telefone);
  if (!cliente) return null;
  const assinatura = await buscarAssinaturaVigente(cliente.id);
  if (!assinatura) return null;
  const veiculo = await veiculoDaAssinatura(assinatura);
  if (!veiculo) return null;
  return montar(cliente, assinatura, veiculo, catalogo);
}

export type ResultadoCadastroAssinante =
  | { ok: true; assinante: AssinanteEncontrado; jaExistia: boolean }
  | { ok: false; erro: string };

const PLACA = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

/**
 * Cadastro PitPass, feito uma única vez. Reaproveita o cliente que já existir com esse WhatsApp
 * (nunca duplica) e o veículo igual que ele já tiver. O plano entra como "pendente": o cliente
 * já é reconhecido nas próximas visitas, e a recepção confirma o PitPass no admin.
 */
export async function cadastrarAssinante(corpo: unknown, catalogo: Catalogo): Promise<ResultadoCadastroAssinante> {
  const { nome, telefone, modelo, placa, categoria, planoId } = (corpo ?? {}) as Record<string, unknown>;

  const digitos = typeof telefone === "string" ? telefoneValido(telefone) : null;
  if (!digitos) return { ok: false, erro: "Confira o WhatsApp, com DDD." };

  // já tem cadastro completo: devolve o que existe, sem criar nada
  const existente = await buscarAssinante(digitos, catalogo);
  if (existente) return { ok: true, assinante: existente, jaExistia: true };

  if (typeof nome !== "string" || nome.trim().length < 2) return { ok: false, erro: "Informe seu nome." };
  if (typeof modelo !== "string" || modelo.trim().length < 2) return { ok: false, erro: "Informe o modelo do veículo." };
  if (!categoriaVeiculoValida(categoria)) return { ok: false, erro: "Escolha o tipo de veículo." };
  const placaLimpa = typeof placa === "string" ? placa.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  if (!PLACA.test(placaLimpa)) return { ok: false, erro: "Confira a placa do veículo." };

  const { cliente } = await buscarOuCriarCliente({
    nome,
    telefone: formatarTelefone(digitos),
    origem: "site",
  });
  const veiculo = await buscarOuCriarVeiculo({ clienteId: cliente.id, modelo, placa: placaLimpa, porte: categoria });

  let assinatura = await buscarAssinaturaVigente(cliente.id);
  if (assinatura) {
    // tinha plano mas faltava veículo: só completa o cadastro, o plano continua o que já era
    await db.update(assinaturas).set({ veiculoId: veiculo.id, updatedAt: new Date() }).where(eq(assinaturas.id, assinatura.id));
    assinatura = { ...assinatura, veiculoId: veiculo.id };
  } else {
    const planosDoVeiculo = planosPara(catalogo, tipoDaCategoria(categoria), true);
    if (!planoValido(planoId) || !planosDoVeiculo.some((p) => p.id === planoId)) {
      return { ok: false, erro: "Escolha o seu plano." };
    }
    const inicioEm = hojeIso();
    const { cicloInicio, cicloFim } = calcularCiclo(inicioEm);
    [assinatura] = await db
      .insert(assinaturas)
      .values({ clienteId: cliente.id, plano: planoId, veiculoId: veiculo.id, status: "pendente", inicioEm, cicloInicio, cicloFim })
      .returning();
  }

  const assinante = await montar(cliente, assinatura, veiculo, catalogo);
  if (!assinante) return { ok: false, erro: "Não foi possível salvar o cadastro. Tente novamente." };
  return { ok: true, assinante, jaExistia: false };
}

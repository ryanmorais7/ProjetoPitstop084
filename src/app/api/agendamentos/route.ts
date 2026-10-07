import { NextResponse } from "next/server";
import {
  categoriaVeiculoValida,
  CategoriaVeiculo,
  PlanoId,
  servicosPorPlano,
  precoPlano,
  precoServico,
  horariosAgendamento,
} from "@/lib/data";
import { hojeIso, dataValidaParaAgendar } from "@/lib/agenda";
import { criarAgendamento, verificarBeneficioDisponivel } from "@/lib/bookings";
import { adicionaisPara, disponivelNoSite, duracaoTotal, itemDoBeneficio, servicoBase } from "@/lib/catalogo";
import { carregarCatalogo } from "@/lib/catalogoServidor";
import { ocupacaoDaAgenda } from "@/lib/disponibilidade";
import { buscarAssinante } from "@/lib/assinante";
import { telefoneValido } from "@/lib/format";
import { urlCheckin } from "@/lib/checkin";

/**
 * Agenda pública: os trechos já ocupados (início e fim, em minutos do dia) de hoje em diante.
 * O navegador cruza isso com a duração do atendimento montado; o POST valida de novo.
 */
export async function GET() {
  const { bufferMin } = await carregarCatalogo();
  const ocupados = await ocupacaoDaAgenda({ aPartirDe: hojeIso(), bufferMin });
  return NextResponse.json({ ocupados, bufferMin }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { tipoAtendimento, telefone, dia, horario } = body ?? {};

  if (
    (tipoAtendimento !== "avulso" && tipoAtendimento !== "assinatura") ||
    typeof telefone !== "string" || !telefoneValido(telefone) ||
    typeof dia !== "string" || !dataValidaParaAgendar(dia) ||
    typeof horario !== "string" || !horariosAgendamento.includes(horario)
  ) {
    return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
  }

  const catalogo = await carregarCatalogo();
  const comum = { dia, horario, bufferMin: catalogo.bufferMin, origem: "landing" as const };
  let resultado;

  if (tipoAtendimento === "avulso") {
    const { nome, carro, placa, avulsosIds } = body;
    // `porteVeiculo` = nome antigo do campo (página aberta antes do deploy)
    const categoria: unknown = body.categoriaVeiculo ?? body.porteVeiculo;
    if (
      typeof nome !== "string" || nome.trim().length < 2 ||
      typeof carro !== "string" || carro.trim().length < 1 ||
      !categoriaVeiculoValida(categoria)
    ) {
      return NextResponse.json({ erro: "Dados obrigatórios inválidos" }, { status: 400 });
    }
    if (!Array.isArray(avulsosIds) || avulsosIds.some((id) => typeof id !== "string")) {
      return NextResponse.json({ erro: "Adicionais inválidos" }, { status: 400 });
    }

    // serviço base e adicionais vêm do catálogo vigente, sempre conferidos no servidor
    const base = servicoBase(catalogo, categoria);
    if (!base || !disponivelNoSite(base, categoria)) {
      return NextResponse.json({ erro: "Serviço indisponível para esse veículo." }, { status: 400 });
    }
    const permitidos = adicionaisPara(catalogo, categoria, true);
    const adicionais = [...new Set(avulsosIds as string[])].map((id) => permitidos.find((s) => s.id === id));
    if (adicionais.some((s) => !s)) {
      return NextResponse.json({ erro: "Adicional inválido" }, { status: 400 });
    }
    const validos = adicionais.filter((s): s is NonNullable<typeof s> => Boolean(s));

    resultado = await criarAgendamento({
      ...comum,
      nome,
      telefone,
      carro,
      placa: typeof placa === "string" ? placa : null,
      categoriaVeiculo: categoria,
      tipoAtendimento,
      servicoId: base.id,
      servicoNome: base.nome,
      servicosAdicionaisJson: JSON.stringify(
        validos.map((s) => ({ id: s.id, nome: s.nome, preco: precoServico(s, categoria) }))
      ),
      preco:
        (precoServico(base, categoria) ?? 0) +
        validos.reduce((soma, s) => soma + (precoServico(s, categoria) ?? 0), 0),
      duracaoMin: duracaoTotal([base, ...validos]),
    });
  } else {
    // Assinante: o WhatsApp localiza o cadastro. Nome, veículo, placa, porte e plano vêm do
    // banco, nunca do que o navegador mandar.
    const assinante = await buscarAssinante(telefone, catalogo);
    if (!assinante) {
      return NextResponse.json(
        { erro: "Não encontramos um cadastro PitPass para esse WhatsApp." },
        { status: 400 }
      );
    }
    const planoId = assinante.assinatura.plano as PlanoId;
    const { servicoPlano } = body;
    if (typeof servicoPlano !== "string" || !servicosPorPlano[planoId].includes(servicoPlano)) {
      return NextResponse.json({ erro: "Serviço do plano inválido" }, { status: 400 });
    }
    const disponibilidade = await verificarBeneficioDisponivel({
      assinaturaId: assinante.assinatura.id,
      plano: planoId,
      beneficio: servicoPlano,
      cicloInicio: assinante.assinatura.cicloInicio,
    });
    if (!disponibilidade.disponivel) {
      return NextResponse.json({ erro: disponibilidade.motivo ?? "Benefício indisponível." }, { status: 400 });
    }

    const categoria: CategoriaVeiculo = assinante.publico.categoria;
    const item = itemDoBeneficio(catalogo, servicoPlano);
    resultado = await criarAgendamento({
      ...comum,
      nome: assinante.cliente.nome,
      telefone: assinante.cliente.telefone,
      carro: assinante.veiculo.modelo,
      placa: assinante.veiculo.placa,
      categoriaVeiculo: categoria,
      tipoAtendimento,
      planoId,
      servicoPlano,
      servicoId: item?.id ?? null,
      servicoNome: servicoPlano,
      preco: precoPlano(catalogo.planos[planoId], categoria),
      duracaoMin: item ? duracaoTotal([item]) : null,
      assinaturaId: assinante.assinatura.id,
    });
  }

  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: resultado.status });
  }

  // O QR leva só a URL pública com o token, nunca dados pessoais.
  const checkinUrl = urlCheckin(new URL(request.url).origin, resultado.checkinToken);

  return NextResponse.json({ id: resultado.id, codigo: resultado.codigo, checkinUrl }, { status: 201 });
}

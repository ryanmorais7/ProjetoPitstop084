import { formatarDataCurta } from "./agenda";
import { formatarPreco } from "./format";
import { AVISO_NAO_FISCAL, dataDoRecibo, valorDoItem } from "./recibo";
import type { DadosRecibo } from "./recibo";

/**
 * PDF do recibo, montado no navegador (A4, fundo branco, amarelo só nos detalhes). A biblioteca
 * só é baixada quando alguém clica em "Baixar PDF" ou "Compartilhar".
 */
export async function gerarPdfRecibo(dados: DadosRecibo): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Recibo ${dados.numero} - PitStop084`);
  pdf.setAuthor(dados.empresa.nome);
  const pagina = pdf.addPage([595.28, 841.89]);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);

  const preto = rgb(0.04, 0.04, 0.045);
  const cinza = rgb(0.4, 0.42, 0.44);
  const linha = rgb(0.86, 0.86, 0.84);
  const amarelo = rgb(0.91, 0.67, 0.12);

  const margem = 48;
  const largura = pagina.getWidth() - margem * 2;
  const direita = margem + largura;
  let y = pagina.getHeight() - margem;

  // as fontes padrão do PDF só têm Latin-1: troca o que não existe (emoji, aspas curvas...)
  const limpo = (texto: string) =>
    texto
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/ /g, " ")
      .replace(/[^ -~¡-ÿ•]/g, "");

  type Fonte = typeof normal;
  const escrever = (texto: string, x: number, yy: number, tamanho: number, fonte: Fonte = normal, cor = preto) =>
    pagina.drawText(limpo(texto), { x, y: yy, size: tamanho, font: fonte, color: cor });
  const aDireita = (texto: string, yy: number, tamanho: number, fonte: Fonte = normal, cor = preto) =>
    escrever(texto, direita - fonte.widthOfTextAtSize(limpo(texto), tamanho), yy, tamanho, fonte, cor);
  const regua = (yy: number, cor = linha, espessura = 0.75) =>
    pagina.drawLine({ start: { x: margem, y: yy }, end: { x: direita, y: yy }, thickness: espessura, color: cor });
  const rotulo = (texto: string, x: number, yy: number) => escrever(texto.toUpperCase(), x, yy, 7.5, negrito, cinza);

  function quebrar(texto: string, fonte: Fonte, tamanho: number, maximo: number): string[] {
    const linhas: string[] = [];
    for (const paragrafo of limpo(texto).split("\n")) {
      let atual = "";
      for (const palavra of paragrafo.split(/\s+/)) {
        const tentativa = atual ? `${atual} ${palavra}` : palavra;
        if (fonte.widthOfTextAtSize(tentativa, tamanho) > maximo && atual) {
          linhas.push(atual);
          atual = palavra;
        } else {
          atual = tentativa;
        }
      }
      linhas.push(atual);
    }
    return linhas;
  }

  // Cabeçalho: marca à esquerda, identificação do recibo à direita
  const marca = "PITSTOP";
  escrever(marca, margem, y - 20, 24, negrito);
  escrever("084", margem + negrito.widthOfTextAtSize(marca, 24), y - 20, 24, negrito, amarelo);
  escrever("PREMIUM CAR STUDIO", margem, y - 34, 7.5, normal, cinza);

  aDireita("RECIBO DE SERVIÇO", y - 10, 11, negrito);
  aDireita(`Nº ${dados.numero}`, y - 25, 10);
  aDireita(`Data: ${dataDoRecibo(dados.emitidoEm)}`, y - 38, 10, normal, cinza);
  y -= 52;
  regua(y, amarelo, 1.5);
  y -= 26;

  // Cliente e veículo, lado a lado
  const coluna2 = margem + largura / 2 + 10;
  rotulo("Cliente", margem, y);
  rotulo("Veículo", coluna2, y);
  y -= 15;
  escrever(dados.cliente.nome, margem, y, 11, negrito);
  escrever(dados.veiculo.modelo, coluna2, y, 11, negrito);
  y -= 14;
  escrever(dados.cliente.telefone, margem, y, 9.5, normal, cinza);
  escrever(
    [`Tipo: ${dados.veiculo.tipo}`, dados.veiculo.porte].filter(Boolean).join(" · "),
    coluna2,
    y,
    9.5,
    normal,
    cinza
  );
  y -= 13;
  if (dados.cliente.codigo) escrever(`Cliente ${dados.cliente.codigo}`, margem, y, 9.5, normal, cinza);
  escrever(`Placa: ${dados.veiculo.placa ?? "não informada"}`, coluna2, y, 9.5, normal, cinza);
  y -= 26;

  rotulo("Atendimento", margem, y);
  if (dados.plano) rotulo("Plano", coluna2, y);
  y -= 15;
  escrever(
    `${dados.codigoAtendimento ?? "-"} · ${formatarDataCurta(dados.dataAtendimento)} · ${dados.horario}`,
    margem,
    y,
    10.5
  );
  if (dados.plano) escrever(dados.plano, coluna2, y, 10.5);
  y -= 30;

  // Serviços
  rotulo("Serviços", margem, y);
  aDireita("VALOR", y, 7.5, negrito, cinza);
  y -= 8;
  regua(y);
  y -= 18;
  for (const item of dados.itens) {
    const linhasItem = quebrar(`${item.adicional ? "+ " : ""}${item.descricao}`, normal, 10.5, largura - 130);
    aDireita(valorDoItem(item), y, 10.5, normal, item.valor != null ? preto : cinza);
    for (const texto of linhasItem) {
      escrever(texto, margem, y, 10.5, item.adicional ? normal : negrito);
      y -= 14;
    }
    y -= 4;
    regua(y + 6);
    y -= 8;
  }

  // Totais
  y -= 4;
  const linhaValor = (nome: string, valor: string, destaque = false) => {
    const tamanho = destaque ? 14 : 10.5;
    const fonte = destaque ? negrito : normal;
    escrever(nome, direita - 220, y, destaque ? 11 : 10.5, fonte, destaque ? preto : cinza);
    aDireita(valor, y, tamanho, fonte);
    y -= destaque ? 22 : 16;
  };
  if (dados.desconto > 0 || dados.acrescimo > 0) linhaValor("Subtotal", formatarPreco(dados.subtotal));
  if (dados.desconto > 0) linhaValor("Desconto", `- ${formatarPreco(dados.desconto)}`);
  if (dados.acrescimo > 0) linhaValor("Acréscimo", formatarPreco(dados.acrescimo));
  y -= 2;
  pagina.drawLine({ start: { x: direita - 220, y: y + 12 }, end: { x: direita, y: y + 12 }, thickness: 1, color: preto });
  y -= 6;
  linhaValor("TOTAL", formatarPreco(dados.total), true);
  linhaValor("Forma de pagamento", dados.formaPagamento);

  if (dados.observacao) {
    y -= 12;
    rotulo("Observação", margem, y);
    y -= 14;
    for (const texto of quebrar(dados.observacao, normal, 10, largura)) {
      escrever(texto, margem, y, 10, normal, cinza);
      y -= 13;
    }
  }

  // Rodapé: dados da empresa e aviso de que não é documento fiscal
  let rodape = margem + 44;
  regua(rodape + 14);
  escrever(dados.empresa.nome, margem, rodape, 9, negrito);
  rodape -= 12;
  const contato = [dados.empresa.documento, dados.empresa.endereco, dados.empresa.telefone].filter(Boolean).join(" · ");
  for (const texto of quebrar(contato, normal, 8.5, largura)) {
    escrever(texto, margem, rodape, 8.5, normal, cinza);
    rodape -= 11;
  }
  escrever(AVISO_NAO_FISCAL, margem, rodape - 2, 8, normal, cinza);

  return pdf.save();
}

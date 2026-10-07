"use client";

import { useState } from "react";
import { linkWhatsappPara } from "@/lib/data";
import { DadosRecibo, textoDoRecibo } from "@/lib/recibo";
import { gerarPdfRecibo } from "@/lib/reciboPdf";
import { useAviso } from "../AdminShell";

/** IMPRIMIR · BAIXAR PDF · COMPARTILHAR / WHATSAPP do recibo já emitido. */
export default function ReciboAcoes({ dados }: { dados: DadosRecibo }) {
  const avisar = useAviso();
  const [ocupado, setOcupado] = useState<"pdf" | "compartilhar" | null>(null);
  const nomeArquivo = `Recibo-${dados.numero}.pdf`;

  async function arquivoPdf(): Promise<File> {
    const bytes = await gerarPdfRecibo(dados);
    return new File([bytes as BlobPart], nomeArquivo, { type: "application/pdf" });
  }

  function baixar(arquivo: File) {
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function baixarPdf() {
    setOcupado("pdf");
    try {
      baixar(await arquivoPdf());
    } catch {
      avisar("Não foi possível gerar o PDF. Use Imprimir e salve como PDF.", "erro");
    } finally {
      setOcupado(null);
    }
  }

  /**
   * Celular: abre o compartilhamento do sistema com o PDF anexado (o WhatsApp aparece na lista).
   * Onde o navegador não compartilha arquivos (boa parte dos computadores): baixa o PDF e abre a
   * conversa do cliente no WhatsApp com o resumo do recibo, pra anexar o arquivo ali.
   */
  async function compartilhar() {
    setOcupado("compartilhar");
    try {
      const arquivo = await arquivoPdf();
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
        try {
          await navigator.share({ files: [arquivo], title: `Recibo ${dados.numero}`, text: `Recibo ${dados.numero} · PitStop084` });
        } catch {
          // a pessoa fechou a folha de compartilhamento: nada a fazer
        }
        return;
      }
      baixar(arquivo);
      window.open(linkWhatsappPara(dados.cliente.telefone, textoDoRecibo(dados)), "_blank", "noopener");
      avisar("PDF baixado. Anexe na conversa do WhatsApp");
    } catch {
      avisar("Não foi possível preparar o recibo para envio.", "erro");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="nao-imprimir flex flex-wrap gap-2">
      <button type="button" onClick={() => window.print()} className="adm-btn adm-btn-primario">
        Imprimir
      </button>
      <button type="button" onClick={baixarPdf} disabled={ocupado !== null} className="adm-btn">
        {ocupado === "pdf" ? "Gerando..." : "Baixar PDF"}
      </button>
      <button type="button" onClick={compartilhar} disabled={ocupado !== null} className="adm-btn">
        {ocupado === "compartilhar" ? "Preparando..." : "Compartilhar / WhatsApp"}
      </button>
    </div>
  );
}

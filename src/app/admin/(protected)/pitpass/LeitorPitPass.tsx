"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatarDataCurta } from "@/lib/agenda";
import type { AgendamentoRecepcao } from "@/lib/checkin";
import { localizarPitPass } from "../../actions";

/** API nativa (Chrome/Android, Edge). No Safari/iOS não existe: cai no jsQR, carregado só quando preciso. */
interface DetectorNativo {
  detect(fonte: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
type ConstrutorDetector = new (opcoes: { formats: string[] }) => DetectorNativo;

type Decodificador = (video: HTMLVideoElement) => Promise<string | null>;

async function criarDecodificador(canvas: HTMLCanvasElement): Promise<Decodificador> {
  const Nativo = (window as unknown as { BarcodeDetector?: ConstrutorDetector & {
    getSupportedFormats?: () => Promise<string[]>;
  } }).BarcodeDetector;

  if (Nativo) {
    try {
      const formatos = (await Nativo.getSupportedFormats?.()) ?? ["qr_code"];
      if (formatos.includes("qr_code")) {
        const detector = new Nativo({ formats: ["qr_code"] });
        return async (video) => {
          const lidos = await detector.detect(video);
          return lidos[0]?.rawValue ?? null;
        };
      }
    } catch {
      // segue pro fallback
    }
  }

  const { default: jsQR } = await import("jsqr");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth) return null;
    // reduz o frame: mais rápido em celular e suficiente pra um QR ocupando parte da tela
    const escala = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
    const w = Math.round(video.videoWidth * escala);
    const h = Math.round(video.videoHeight * escala);
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const imagem = ctx.getImageData(0, 0, w, h);
    return jsQR(imagem.data, w, h, { inversionAttempts: "dontInvert" })?.data ?? null;
  };
}

export default function LeitorPitPass({ codigoInicial = "" }: { codigoInicial?: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ativoRef = useRef(false);
  const [cameraAberta, setCameraAberta] = useState(false);
  const [iniciandoCamera, setIniciandoCamera] = useState(false);
  const [codigo, setCodigo] = useState(codigoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [candidatos, setCandidatos] = useState<AgendamentoRecepcao[]>([]);
  const [buscando, startTransition] = useTransition();

  function pararCamera() {
    ativoRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraAberta(false);
  }

  useEffect(() => pararCamera, []);

  function localizar(texto: string) {
    setErro(null);
    setCandidatos([]);
    startTransition(async () => {
      const resultado = await localizarPitPass(texto);
      if (resultado.ok) {
        router.push(`/admin/atendimentos/${resultado.id}?lido=1`);
      } else if (resultado.candidatos?.length) {
        setCandidatos(resultado.candidatos);
      } else {
        setErro(resultado.erro);
      }
    });
  }

  async function abrirCamera() {
    setErro(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro("Este navegador não libera a câmera aqui. Use o código P084 abaixo.");
      return;
    }
    setIniciandoCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      video.srcObject = stream;
      await video.play();
      setCameraAberta(true);
      ativoRef.current = true;

      const decodificar = await criarDecodificador(canvas);
      let ultimo = 0;
      const ler = async (agora: number) => {
        if (!ativoRef.current) return;
        if (agora - ultimo > 180) {
          ultimo = agora;
          const texto = await decodificar(video).catch(() => null);
          if (texto && ativoRef.current) {
            navigator.vibrate?.(40);
            pararCamera();
            localizar(texto);
            return;
          }
        }
        requestAnimationFrame(ler);
      };
      requestAnimationFrame(ler);
    } catch (e) {
      pararCamera();
      const nome = e instanceof Error ? e.name : "";
      setErro(
        nome === "NotAllowedError"
          ? "Permissão da câmera negada. Libere nas configurações do navegador ou digite o código."
          : "Não foi possível abrir a câmera. Digite o código P084 abaixo."
      );
    } finally {
      setIniciandoCamera(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-white/10 bg-panel">
        <div className={`relative aspect-square w-full bg-black sm:aspect-video ${cameraAberta ? "" : "hidden"}`}>
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {/* mira */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-56 w-56 rounded-xl border-2 border-gold/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
          </div>
          <button
            type="button"
            onClick={pararCamera}
            className="absolute right-3 top-3 rounded-md bg-black/70 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-white"
          >
            Fechar
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />

        {!cameraAberta && (
          <div className="p-6 text-center">
            <p className="text-sm text-text-secondary">Aponte a câmera para o QR do PitPass do cliente.</p>
            <button
              type="button"
              onClick={abrirCamera}
              disabled={iniciandoCamera || buscando}
              className="mt-4 w-full rounded-md bg-gold py-3.5 font-heading text-sm font-semibold tracking-wide text-asphalt transition hover:brightness-110 disabled:opacity-50 sm:w-auto sm:px-10"
            >
              {iniciandoCamera ? "Abrindo câmera..." : "Abrir câmera"}
            </button>
          </div>
        )}
        {cameraAberta && (
          <p className="px-4 py-3 text-center font-mono text-xs uppercase tracking-wide text-text-secondary">
            Procurando QR...
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (codigo.trim()) localizar(codigo);
        }}
        className="rounded-lg border border-white/10 bg-panel p-5"
      >
        <label htmlFor="codigo-pitpass" className="font-heading text-sm font-bold uppercase tracking-wide">
          Buscar sem QR
        </label>
        <div className="mt-3 flex gap-2">
          <input
            id="codigo-pitpass"
            value={codigo}
            // sem toUpperCase: o campo também aceita o link do QR colado, e o token diferencia maiúsculas
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="P084-0044, nome, WhatsApp ou placa"
            autoCapitalize="off"
            autoComplete="off"
            spellCheck={false}
            className="campo font-mono tracking-wide"
          />
          <button
            type="submit"
            disabled={buscando || !codigo.trim()}
            className="shrink-0 rounded-md border border-gold px-5 font-heading text-sm font-semibold tracking-wide text-gold transition hover:bg-gold hover:text-asphalt disabled:opacity-40"
          >
            {buscando ? "..." : "Buscar"}
          </button>
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Aceita código P084 (só o número também: 44 vira P084-0044), nome, WhatsApp, placa ou código do
          cliente (C084).
        </p>
      </form>

      {candidatos.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-panel p-5">
          <p className="font-heading text-sm font-bold uppercase tracking-wide">
            {candidatos.length} agendamentos encontrados
          </p>
          <ul className="mt-3 space-y-2">
            {candidatos.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/atendimentos/${c.id}?lido=1`}
                  className="block rounded-md border border-white/10 bg-asphalt px-4 py-3 transition-colors hover:border-gold"
                >
                  <span className="flex items-baseline justify-between gap-3 font-mono text-xs uppercase tracking-wide">
                    <span className="text-white">
                      {formatarDataCurta(c.dia)} • {c.horario}
                    </span>
                    <span className="text-gold">{c.codigo}</span>
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{c.nome}</span>
                  <span className="block text-xs text-text-secondary">
                    {c.carro} • {c.placa ?? "sem placa"}
                    {c.servicoNome ? ` • ${c.servicoNome}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs text-text-secondary">
        O QR identifica o agendamento. A placa confirma o veículo: confira antes do check-in.
      </p>

      {buscando && <p className="text-center font-mono text-xs uppercase tracking-wide text-text-secondary">Buscando PitPass...</p>}
      {erro && (
        <p role="alert" className="rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {erro}
        </p>
      )}
    </div>
  );
}

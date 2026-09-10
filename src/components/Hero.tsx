"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CarroAoVivo, carrosAoVivoMock } from "@/lib/data";

const statusOrder: CarroAoVivo["status"][] = ["Na fila", "Lavando", "Secando", "Finalizado"];

function proximoStatus(status: CarroAoVivo["status"]): CarroAoVivo["status"] {
  const i = statusOrder.indexOf(status);
  return statusOrder[(i + 1) % statusOrder.length];
}

const statusCor: Record<CarroAoVivo["status"], string> = {
  "Na fila": "text-text-secondary",
  Lavando: "text-cyan",
  Secando: "text-gold",
  Finalizado: "text-cyan",
};

export default function Hero() {
  const [carros, setCarros] = useState<CarroAoVivo[]>(carrosAoVivoMock);

  useEffect(() => {
    const id = setInterval(() => {
      setCarros((atual) => {
        const idx = Math.floor(Math.random() * atual.length);
        return atual.map((carro, i) =>
          i === idx ? { ...carro, status: proximoStatus(carro.status) } : carro
        );
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pt-24">
      <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 font-mono text-sm uppercase tracking-widest text-cyan">
            Assinatura automotiva
          </p>
          <h1 className="font-heading text-4xl font-bold leading-tight md:text-5xl">
            Seu carro sempre pronto,{" "}
            <span className="text-gold">sem você precisar lembrar</span>
          </h1>
          <p className="mt-6 max-w-md text-text-secondary">
            Lavagem detalhada, manutenção semanal e cuidado completo com hora marcada. Você assina,
            a gente cuida.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#assinatura"
              className="rounded-full bg-gold px-6 py-3 font-heading font-semibold text-asphalt transition hover:brightness-110"
            >
              Quero assinar
            </Link>
            <Link
              href="#avulsos"
              className="rounded-full border border-white/15 px-6 py-3 font-heading font-semibold text-text-primary transition hover:border-cyan hover:text-cyan"
            >
              Ver serviços avulsos
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
              Painel ao vivo
            </span>
            <span className="flex items-center gap-2 font-mono text-xs text-cyan">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan" />
              ao vivo
            </span>
          </div>
          <ul className="space-y-3">
            {carros.map((carro) => (
              <li
                key={carro.placaOuModelo}
                className="flex items-center justify-between rounded-lg bg-asphalt px-4 py-3"
              >
                <span className="font-mono text-sm text-text-primary">{carro.placaOuModelo}</span>
                <span className={`font-mono text-xs font-medium ${statusCor[carro.status]}`}>
                  {carro.status.toUpperCase()}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-text-secondary">
            Exemplo ilustrativo de status em tempo real do pátio.
          </p>
        </div>
      </div>
    </section>
  );
}

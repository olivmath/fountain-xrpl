"use client";

import { useEffect, useRef, useState } from "react";
import {
  BlocksIcon,
  CpuIcon,
  LayersIcon,
  ShieldCheckIcon,
  WalletIcon,
  WorkflowIcon,
} from "lucide-react";

import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";

const solutions = [
  {
    Icon: CpuIcon,
    name: "API única para emissão",
    description: "Crie, queime e reconcilie stablecoins BRL com webhooks e SDKs preparados para produção.",
    href: "#api",
    cta: "Ver documentação",
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2",
    background: (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_60%)] opacity-70" />
    ),
  },
  {
    Icon: ShieldCheckIcon,
    name: "Compliance automatizado",
    description: "KYC/KYB, listas de sanção e limites programáveis por carteira sem travar a experiência do usuário.",
    href: "#compliance",
    cta: "Conheça o fluxo",
    className: "lg:row-start-1 lg:row-end-2 lg:col-start-1",
    background: (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)] opacity-70" />
    ),
  },
  {
    Icon: WorkflowIcon,
    name: "Orquestração de liquidez",
    description: "PIX, TED e rails cripto integrados para liberar liquidações em minutos com regras personalizadas.",
    href: "#liquidez",
    cta: "Explorar orquestração",
    className: "lg:row-start-2 lg:row-end-3 lg:col-start-1",
    background: (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_60%)] opacity-70" />
    ),
  },
  {
    Icon: BlocksIcon,
    name: "Integração com tokenizadoras",
    description: "Colete dados do ativo, programe cronogramas de vesting e sincronize status em tempo real.",
    href: "#tokenizadoras",
    cta: "Ver integrações",
    className: "lg:row-start-3 lg:row-end-4 lg:col-start-1",
    background: (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.2),transparent_65%)] opacity-70" />
    ),
  },
  {
    Icon: WalletIcon,
    name: "Tesouraria on-chain",
    description: "Dashboards com prova de reservas, relatórios contábeis e auditoria contínua na XRP Ledger.",
    href: "#tesouraria",
    cta: "Abrir dashboard",
    className: "lg:row-start-1 lg:row-end-2 lg:col-start-3",
    background: (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_60%)] opacity-70" />
    ),
  },
  {
    Icon: LayersIcon,
    name: "Escalabilidade global",
    description: "Multi-entidade, múltiplas moedas e governança granular para lançar produtos cross-border.",
    href: "#escalabilidade",
    cta: "Planejar expansão",
    className: "lg:row-start-2 lg:row-end-4 lg:col-start-3",
    background: (
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),transparent_65%)] opacity-70" />
    ),
  },
];

export function SolutionSection() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="solucao" ref={ref} className="relative overflow-hidden bg-black px-6 py-20 text-white md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(60% 60% at 30% 40%, rgba(252,91,75,0.18) 0%, transparent 65%)",
            "radial-gradient(70% 70% at 70% 60%, rgba(88,112,255,0.22) 0%, transparent 70%)",
          ].join(","),
        }}
      />

      <div className="mx-auto max-w-6xl">
        <div
          className={cn(
            "mb-16 text-center transition-all duration-1000",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
          )}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-sm text-white/80">
            ✨ Plataforma Fountain
          </div>
          <h2 className="mt-6 text-balance text-4xl font-bold md:text-5xl">
            Solução completa para emissão de stablecoins em reais
          </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/70">
              APIs, compliance, liquidez e auditoria contínua em uma única infraestrutura pensada para tokenizadoras de
              ativos reais.
            </p>
        </div>

        <div
          className={cn(
            "transition-all duration-1000",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "150ms" : "0ms" }}
        >
          <BentoGrid className="lg:grid-rows-3">
            {solutions.map((solution) => (
              <BentoCard key={solution.name} {...solution} />
            ))}
          </BentoGrid>
        </div>
      </div>
    </section>
  );
}

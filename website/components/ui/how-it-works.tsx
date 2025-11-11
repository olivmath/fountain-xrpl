"use client";

import type React from "react";
import { Layers, Search, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {}

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
}

const StepCard: React.FC<StepCardProps> = ({ icon, title, description, benefits }) => (
  <div
    className={cn(
      "relative h-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white transition-all duration-300 ease-in-out",
      "hover:-translate-y-2 hover:border-white/20 hover:bg-white/10 hover:shadow-xl",
    )}
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-white">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
    <p className="mb-6 text-sm text-white/70">{description}</p>
    <ul className="space-y-3 text-sm text-white/70">
      {benefits.map((benefit, index) => (
        <li key={index} className="flex items-center gap-3">
          <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
          <span>{benefit}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({ className, ...props }) => {
  const stepsData = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Integre sua plataforma",
      description:
        "Conectamos sua tokenizadora ao ecossistema Fountain com onboarding assistido e ambiente sandbox.",
      benefits: [
        "SDK completo, exemplos de código e documentação interativa",
        "Coleção de MCPs e prompts prontos para automações com IA",
        "Ambiente sandbox na XRPL para validar integrações antes da produção",
      ],
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Automatize emissões com compliance",
      description: "Use nossa API para criar stablecoins lastreadas em BRL diretamente na XRPL com políticas de risco embutidas.",
      benefits: [
        "Fluxos de KYC/KYB, listas de sanção e due diligence automatizados",
        "Políticas configuráveis por ativo, emissor e limite operacional",
        "Auditoria contínua das reservas com trilha de aprovação",
      ],
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Liquide e acompanhe",
      description:
        "Distribua stablecoins para investidores e acompanhe liquidações e relatórios em um único painel.",
      benefits: [
        "Liquidação instantânea via PIX, RLUSD e XRP com gerenciamento de escrow",
        "Notificações via webhook para cada evento crítico da operação",
        "Exportação contábil e trilha de auditoria completa",
      ],
    },
  ];

  return (
    <section id="como-funciona" className={cn("w-full bg-black py-16 text-white sm:py-24", className)} {...props}>
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">Como funciona</h2>
          <p className="mt-4 text-lg text-white/70">
            Três etapas para integrar, emitir e controlar stablecoins lastreadas em reais usando a plataforma Fountain.
          </p>
        </div>

        <div className="relative mx-auto mb-12 flex w-full max-w-3xl items-center justify-between">
          <div aria-hidden="true" className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
          {stepsData.map((_, index) => (
            <div
              key={index}
              className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black text-lg font-semibold"
            >
              {index + 1}
            </div>
          ))}
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {stepsData.map((step, index) => (
            <StepCard key={index} icon={step.icon} title={step.title} description={step.description} benefits={step.benefits} />
          ))}
        </div>
      </div>
    </section>
  );
};


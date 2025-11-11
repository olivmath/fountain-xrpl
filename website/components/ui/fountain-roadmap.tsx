"use client";

import { RoadmapCard } from "@/components/ui/roadmap-card";
import type { RoadmapItem } from "@/components/ui/roadmap-card";

const roadmapItems: RoadmapItem[] = [
  {
    quarter: "V1 · HOJE",
    title: "Operação em produção",
    description: "Tokenizadora ativa, 4M BRL MRR e fluxos mint/burn completos.",
    status: "done",
  },
  {
    quarter: "V2 · 2 MESES",
    title: "Liquidez expandida",
    description: "Integrações com exchanges, PIX resiliente e RLUSD operacional.",
    status: "in-progress",
  },
  {
    quarter: "V3 · 6 MESES",
    title: "Escala enterprise",
    description: "+5 tokenizadoras, 20M BRL MRR e recursos enterprise.",
    status: "upcoming",
  },
  {
    quarter: "V4 · 12 MESES",
    title: "Expansão global",
    description: "Governança multi-empresa, múltiplas moedas e novas jurisdições.",
    status: "upcoming",
  },
];

export function RoadmapSection() {
  return (
    <section className="relative overflow-hidden bg-black px-6 py-20 text-white md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(100% 80% at 50% 50%, rgba(88,112,255,0.18) 0%, rgba(252,91,75,0.12) 40%, transparent 70%)",
          ].join(","),
        }}
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 text-center">
        <div className="max-w-2xl">
          <h2 className="text-balance text-4xl font-bold md:text-5xl">Nosso Roadmap</h2>
          <p className="mt-4 text-lg text-white/70">Da operação atual à infraestrutura global de stablecoins.</p>
        </div>

        <RoadmapCard
          title="Linha do tempo Fountain"
          description="Principais marcos de produto, liquidez e expansão regulatória."
          items={roadmapItems}
          className="border-white/10 bg-black/60"
        />
      </div>
    </section>
  );
}

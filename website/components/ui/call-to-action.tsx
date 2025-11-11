"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(160deg,#2C1E49_0%,#111028_65%,#06050f_100%)] px-6 py-20 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(55%_80%_at_50%_0%,rgba(99,114,191,0.35),transparent_70%)]" />
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 text-center">
        <span className="rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
          Demonstração personalizada
        </span>
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Veja a Fountain em ação e planeje sua emissão de stablecoins
        </h2>
        <p className="max-w-2xl text-base text-white/70 sm:text-lg">
          Agende uma conversa rápida com nossa equipe para explorar o sandbox, integrações com a XRPL e o roadmap que
          está acelerando tokenizadoras na América Latina.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#6372BF] text-white shadow-[0_20px_40px_-20px_rgba(99,114,191,0.6)] transition hover:bg-[#4f5fa8]"
        >
          <Link href="https://calendly.com/bellujrb/demo-fountain" target="_blank" rel="noopener noreferrer">
            Agendar demonstração
          </Link>
        </Button>
      </div>
    </section>
  );
}


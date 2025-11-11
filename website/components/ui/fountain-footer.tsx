"use client";

import Image from "next/image";

export function FooterSection() {
  return (
    <footer className="relative mx-auto flex w-full max-w-4xl flex-col items-center justify-center border-t border-white/10 bg-black px-6 py-12 text-white lg:py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <Image src="/Fountain%20PitchDeck.png" alt="Fountain" width={140} height={42} priority />
          <span className="sr-only">Fountain</span>
        </div>
        <p className="max-w-2xl text-sm text-white/60">
          Automatizamos a emissão de stablecoins para acelerar a tokenização de ativos reais na América Latina, com foco em transparência, conformidade e experiência do usuário.
        </p>
        <a
          href="mailto:hello@fountain.dev"
          className="hover:text-white text-sm text-white/80 transition-all duration-300"
        >
          hello@fountain.dev
        </a>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 text-sm text-white/60">
        <p>Siga nossas atualizações:</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-white transition-all duration-300">
            Instagram
          </a>
          <a href="#" className="hover:text-white transition-all duration-300">
            YouTube
          </a>
          <a href="#" className="hover:text-white transition-all duration-300">
            LinkedIn
          </a>
        </div>
      </div>

      <div className="mt-12 w-full border-t border-white/10 pt-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} Fountain. Todos os direitos reservados.
      </div>
    </footer>
  );
}

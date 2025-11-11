"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

export function Web3HeroAnimated() {
  const pillars = [92, 84, 78, 70, 62, 54, 46, 34, 18, 34, 46, 54, 62, 70, 78, 84, 92]

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <style>
        {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes subtlePulse {
            0%, 100% {
              opacity: 0.8;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.03);
            }
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 0.8s ease-out forwards;
          }
        `}
      </style>

      <section className="relative isolate h-screen overflow-hidden bg-black text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-30"
          style={{
            backgroundImage: [
              "radial-gradient(80% 55% at 50% 52%, rgba(44,30,73,0.85) 0%, rgba(44,30,73,0.65) 32%, rgba(44,30,73,0.4) 58%, rgba(0,0,0,0.9) 85%)",
              "radial-gradient(85% 60% at 15% 0%, rgba(99,114,191,0.55) 0%, rgba(44,30,73,0.45) 38%, rgba(0,0,0,0) 68%)",
              "radial-gradient(70% 50% at 85% 24%, rgba(99,114,191,0.35) 0%, rgba(0,0,0,0) 60%)",
              "linear-gradient(to bottom, rgba(44,30,73,0.35), rgba(0,0,0,0) 50%)",
            ].join(","),
            backgroundColor: "#000",
          }}
        />

        <div
          aria-hidden
          className="absolute inset-0 -z-20 bg-[radial-gradient(140%_120%_at_50%_0%,transparent_60%,rgba(44,30,73,0.85))]"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 mix-blend-screen opacity-30"
          style={{
            backgroundImage: [
              "repeating-linear-gradient(90deg, rgba(179,179,179,0.12) 0 1px, transparent 1px 96px)",
              "repeating-linear-gradient(90deg, rgba(179,179,179,0.07) 0 1px, transparent 1px 24px)",
              "repeating-radial-gradient(80% 55% at 50% 52%, rgba(99,114,191,0.12) 0 1px, transparent 1px 120px)",
            ].join(","), 
            backgroundBlendMode: "screen",
          }}
        />

        <header className="relative z-10">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-8">
            <div className="flex items-center gap-3">
              <Image src="/Fountain%20PitchDeck.png" alt="Fountain" width={120} height={40} priority />
              <span className="sr-only">Fountain</span>
            </div>

            <nav className="hidden items-center gap-8 text-sm/6 text-white/80 md:flex">
              {["Solução", "Como Funciona", "Roadmap", "Documentação"].map((i) => (
                <a key={i} className="hover:text-white transition" href="#">
                  {i}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <button className="rounded-full px-4 py-2 text-sm text-[#B3B3B3] transition hover:text-white">Conectar</button>
              <button className="rounded-full bg-gradient-to-r from-[#6372BF] to-[#2C1E49] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:shadow-lg hover:shadow-[#6372BF]/40">
                Solicitar Acesso
              </button>
            </div>

            <button className="md:hidden rounded-full bg-white/10 px-3 py-2 text-sm text-white/80">Menu</button>
          </div>
        </header>

        <div className="relative z-10 mx-auto grid w-full max-w-5xl place-items-center px-6 py-16 md:py-24 lg:py-28">
          <div className={`mx-auto text-center ${isMounted ? "animate-fadeInUp" : "opacity-0"}`}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-white/70 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6372BF]" /> Tokenização de Ativos
            </span>
            <h1
              style={{ animationDelay: "200ms" }}
              className={`mt-6 text-4xl font-bold tracking-tight md:text-6xl ${isMounted ? "animate-fadeInUp" : "opacity-0"}`}
            >
              Stablecoin Factory para RWA
            </h1>
            <p
              style={{ animationDelay: "300ms" }}
              className={`mx-auto mt-5 max-w-2xl text-balance text-white/80 md:text-lg ${isMounted ? "animate-fadeInUp" : "opacity-0"}`}
            >
              Automatize a emissão de stablecoins lastreadas em reais para tokenizadoras de ativos reais. Seguro, rápido
              e sem burocracia na XRPL.
            </p>
            <div
              style={{ animationDelay: "400ms" }}
              className={`mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row ${isMounted ? "animate-fadeInUp" : "opacity-0"}`}
            >
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#6372BF] to-[#2C1E49] px-6 py-3 text-sm font-semibold text-white shadow transition hover:shadow-lg hover:shadow-[#6372BF]/40"
              >
                Começar Agora
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 backdrop-blur hover:border-white/40 hover:text-white"
              >
                Saiba Mais
              </a>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-10 w-full max-w-6xl px-6 pb-24">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
            {/* Clientes em breve */}
          </div>
        </div>

        <div
          className="pointer-events-none absolute bottom-[128px] left-1/2 z-0 h-36 w-28 -translate-x-1/2 rounded-md bg-gradient-to-b from-[#6372BF]/55 via-[#2C1E49]/45 to-transparent"
          style={{ animation: "subtlePulse 6s ease-in-out infinite" }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42vh]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex h-full items-end gap-px px-[2px]">
            {pillars.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-black transition-height duration-1000 ease-in-out"
                style={{
                  height: isMounted ? `${h}%` : "0%",
                  transitionDelay: `${Math.abs(i - Math.floor(pillars.length / 2)) * 60}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

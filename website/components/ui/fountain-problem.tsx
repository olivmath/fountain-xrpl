"use client"

import { useEffect, useRef, useState } from "react"

export function ProblemSection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const problems = [
    {
      title: "Montanhas de Burocracia",
      description: "KYC, AML, compliance regulatório",
      icon: "📋",
    },
    {
      title: "Caros e Demorados",
      description: "Processos custosos com longos atrasos",
      icon: "⏱️",
    },
    {
      title: "Ineficiências",
      description: "Fluxos manuais e redundâncias",
      icon: "⚙️",
    },
    {
      title: "Riscos Legais",
      description: "Vulnerabilidades de compliance",
      icon: "⚖️",
    },
  ]

  return (
    <section ref={ref} className="relative overflow-hidden bg-black px-6 py-20 md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            "radial-gradient(80% 60% at 50% 30%, rgba(252,91,75,0.2) 0%, rgba(214,76,82,0.15) 40%, transparent 70%)",
            "radial-gradient(100% 80% at 20% 80%, rgba(88,112,255,0.1) 0%, transparent 60%)",
          ].join(","),
        }}
      />

      <div className="mx-auto max-w-7xl">
        <div
          className={`mb-16 text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">O Problema Real</h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Até 2030, o mercado global de tokenização de ativos (RWA) deve explodir para +US$ 16 trilhões. Mas a
            infraestrutura não está pronta.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur transition-all duration-500 hover:border-red-500/50 hover:bg-white/10 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: isVisible ? `${i * 150}ms` : "0ms",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-transparent to-purple-500/0 group-hover:from-red-500/10 group-hover:to-purple-500/10 transition-all" />
              <div className="relative z-10">
                <div className="text-4xl mb-4">{problem.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-sm text-white/70">{problem.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 md:p-12 backdrop-blur">
          <h3 className="text-xl font-semibold mb-6">O Fluxo Atual</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-semibold">
                1
              </div>
              <div>
                <p className="font-semibold">Investidor quer investir em imóvel tokenizado</p>
                <p className="text-sm text-white/60">Afonso quer investir R$ 10.000 em propriedades tokenizadas</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-semibold">
                2
              </div>
              <div>
                <p className="font-semibold">Construtora lança tokens RWA</p>
                <p className="text-sm text-white/60">
                  America Park Building lança propriedade de R$ 3.6M em frações de 10K
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-semibold">
                3
              </div>
              <div>
                <p className="font-semibold">Tokenizadora cria infraestrutura</p>
                <p className="text-sm text-white/60">
                  Sonica precisa gerenciar KYC, AML, stablecoins e depósitos manualmente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-semibold">
                4
              </div>
              <div>
                <p className="font-semibold">Processo se repete para cada cliente</p>
                <p className="text-sm text-white/60">Ineficiência replicada para cada nova construtora ou empresa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

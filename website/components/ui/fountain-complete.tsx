"use client"
import { ProblemSection } from "./fountain-problem"
import { SolutionSection } from "./fountain-solution"
import { HowItWorksSection } from "./fountain-how-it-works"
import { RoadmapSection } from "./fountain-roadmap"
import { CallToAction } from "./call-to-action"
import { FooterSection } from "./fountain-footer"
import { Web3HeroAnimated } from "./animated-web3-landing-page"

export function FountainComplete() {
  return (
    <div className="min-h-screen w-full bg-black text-white">
      <Web3HeroAnimated />
      <SolutionSection />
      <HowItWorksSection />
      <RoadmapSection />
      <CallToAction />
      <FooterSection />
    </div>
  )
}

import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { ProblemStatement } from "@/components/landing/problem-statement"
import { Solution } from "@/components/landing/solution"
// import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { Benefits } from "@/components/landing/benefits"
import { SystemPreview } from "@/components/landing/system-preview"
import { CallToAction } from "@/components/landing/call-to-action"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <ProblemStatement />
      <Solution />
      {/* <HowItWorks /> */}
      <Features />
      <Benefits />
      <SystemPreview />
      <CallToAction />
      <Footer />
    </main>
  )
}

/*
import { ArrowRight } from "lucide-react"

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "User Mengirim Pertanyaan",
      description: "Pemerintah daerah mengirimkan pertanyaan teknis melalui chatbot",
    },
    {
      number: "2",
      title: "Retrieval Dokumen",
      description: "Sistem mencari dan mengambil dokumen resmi yang relevan",
    },
    {
      number: "3",
      title: "LLM Menghasilkan Jawaban",
      description: "Model AI menganalisis dan menyusun jawaban yang akurat",
    },
    {
      number: "4",
      title: "Admin Eskalasi",
      description: "Jika diperlukan, admin dapat memberikan respons manual",
    },
  ]

  return (
    <section id="cara-kerja" className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Bagaimana Sistem RAG Bekerja</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Proses transformasi pertanyaan menjadi solusi yang tepat sasaran
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 md:gap-2">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="bg-background border border-border rounded-xl p-6 mb-4 min-h-48 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden md:flex absolute top-20 -right-2 translate-x-full">
                  <ArrowRight className="w-6 h-6 text-primary/30" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary/5 border border-primary/20 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">Teknologi RAG (Retrieval-Augmented Generation)</h3>
          <p className="text-muted-foreground mb-4">
            Sistem kami menggabungkan kemampuan pencarian dokumen dengan kekuatan model bahasa terbesar, memastikan
            setiap jawaban didukung oleh informasi resmi terkini dari Komdigi.
          </p>
        </div>
      </div>
    </section>
  )
}
*/

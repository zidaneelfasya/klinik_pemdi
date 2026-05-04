import { Check } from "lucide-react"

export function Features() {
  const features = [
    // "Chatbot LLM + RAG",
    "Manajemen Tiket Konsultasi",
    "Dashboard Direktur",
    "Super Admin Document Ingestion",
    "Arsip Percakapan Otomatis",
    "Workflow SPBE-Compliant",
  ]

  return (
    <section 
      id="fitur" 
      // className="py-16 md:py-24 bg-background"
      className="py-16 md:py-24 bg-muted/30"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Fitur Lengkap untuk Manajemen Konsultasi
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Semua alat yang Anda butuhkan untuk mengelola konsultasi digital secara efisien dan profesional
            </p>

            <ul className="space-y-3">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Visual */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20 min-h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">5+</div>
              <p className="text-muted-foreground font-medium">Fitur Terintegrasi</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Zap, FileCheck, Ticket, BarChart3 } from "lucide-react"

export function Solution() {
  const solutions = [
    // {
    //   icon: Zap,
    //   title: "Chatbot AI 24/7",
    //   description: "Respons instan tanpa henti untuk setiap pertanyaan konsultasi",
    // },
    {
      icon: FileCheck,
      title: "Integrasi Dokumen SPBE",
      description: "Akses terkonsentralisasi ke semua dokumen resmi dan panduan teknis",
    },
    {
      icon: Ticket,
      title: "Sistem Ticketing Otomatis",
      description: "Eskalasi dan tracking konsultasi yang terstruktur dan transparan",
    },
    {
      icon: BarChart3,
      title: "Dashboard Monitoring Pimpinan",
      description: "Laporan real-time tentang volume dan kualitas konsultasi",
    },
  ]

  return (
    <section id="solusi" className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Solusi Helpdesk Digital </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transformasi layanan konsultasi dengan teknologi terdepan untuk pemerintah daerah
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
          {solutions.map((solution, idx) => {
            const Icon = solution.icon
            return (
              <div
                key={idx}
                className="w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] 
                   bg-card border border-border rounded-xl p-6 
                   hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">
                  {solution.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {solution.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

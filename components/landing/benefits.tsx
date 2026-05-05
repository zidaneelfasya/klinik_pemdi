import { Zap, Clock, Shield, TrendingUp } from "lucide-react"

export function Benefits() {
  const benefits = [
    {
      icon: Zap,
      title: "Jawaban Cepat & Akurat",
      description: "Respons instan berdasarkan dokumen resmi terverifikasi",
    },
    {
      icon: Clock,
      title: "Konsultasi Tanpa Batas Waktu",
      description: "Layanan tersedia 24/7 untuk semua pemerintah daerah",
    },
    {
      icon: Shield,
      title: "Konsistensi Informasi",
      description: "Semua jawaban konsisten dengan panduan resmi Komdigi",
    },
    {
      icon: TrendingUp,
      title: "Memperkuat Tata Kelola Digital",
      description: "Mendukung transformasi digital sesuai standar SPBE",
    },
  ]

  return (
    <section 
      id="spbe" 
      // className="py-16 md:py-24 bg-muted/30"
      className="py-16 md:py-24 bg-background"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Manfaat untuk Pengguna Pemerintah</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tingkatkan efisiensi dan kualitas layanan konsultasi digital Anda
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <div
                key={idx}
                className="bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

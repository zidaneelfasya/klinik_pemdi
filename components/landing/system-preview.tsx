import { MessageSquare, Users, FileText, Settings } from "lucide-react"
import WhatsAppPreview from "./whatsapp-preview"

export function SystemPreview() {
  const previews = [
    {
      icon: MessageSquare,
      title: "Chat Interface",
      description: "Antarmuka chatbot yang user-friendly untuk konsultasi realtime",
    },
    {
      icon: Users,
      title: "Admin Dashboard",
      description: "Dashboard lengkap untuk monitoring dan manajemen konsultasi",
    },
    {
      icon: FileText,
      title: "Ticket Management",
      description: "Sistem tiket untuk tracking dan eskalasi konsultasi",
    },
    {
      icon: Settings,
      title: "Document Panel",
      description: "Panel khusus Super Admin untuk ingestion dokumen resmi",
    },
  ]

  return (
    <section 
      // className="py-16 md:py-24 bg-background"
      className="py-16 md:py-24 bg-muted/30"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Pratinjau Sistem</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Komponen utama dari Chatbot Helpdesk Konsultasi Digital
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {previews.map((preview, idx) => {
            const Icon = preview.icon
            return (
              <div
                key={idx}
                className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{preview.title}</h3>
                <p className="text-sm text-muted-foreground">{preview.description}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-2">Preview WhatsApp Chatbot</h3>
            <p className="text-muted-foreground">Simulasi interaksi dengan chatbot Klinik PEMDI di WhatsApp</p>
          </div>
          <div className="flex justify-center">
            <WhatsAppPreview />
          </div>
        </div>
      </div>
    </section>
  )
}

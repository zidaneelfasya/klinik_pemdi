import { Button } from "@/Components/ui/button"
import { Card, CardContent } from "@/Components/ui/card"
import { Menu, Clock, Users, MessageCircle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">K</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">KOMINFO</span>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">BSI</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">BKN</span>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">BSSN</span>
                  </div>
                </div>
              </div>
            </div>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent">
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[500px] bg-gradient-to-r from-blue-900/90 to-transparent flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/hero.jpeg?height=500&width=1200')",
          }}
        />
        <div className="absolute inset-0 bg-blue-900/70" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg transform rotate-45"></div>
              </div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Klinik</h1>
          <h2 className="text-4xl md:text-5xl font-bold mb-2">Pemerintah</h2>
          <h3 className="text-4xl md:text-5xl font-bold">Digital</h3>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-8">
              Tanya dan Akan Kami Jawab
              <br />
              Setiap Saat dan Setiap Waktu
            </h2>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="h-6 w-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">System 24/7</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Platform digital yang tersedia 24 jam sehari, 7 hari seminggu untuk melayani kebutuhan komunikasi
                    dan konsultasi pemerintah daerah dengan pemerintah pusat. Sistem terintegrasi yang memudahkan proses
                    administrasi dan koordinasi.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bottom Section */}
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1">
                  <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <MessageCircle className="h-12 w-12 text-purple-600 mx-auto" />
                    </div>
                  </div>
                </div>
                <div className="order-1 md:order-2">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    Klinik Pemerintah Digital merupakan inovasi dalam pelayanan publik yang menghubungkan pemerintah
                    daerah dengan pemerintah pusat melalui platform digital terintegrasi. Platform ini menggantikan
                    sistem manual berbasis formulir dengan solusi digital yang lebih efisien dan responsif.
                  </p>
                  <p className="text-gray-700 leading-relaxed text-lg mt-4">
                    Dengan sistem yang tersedia 24/7, pemerintah daerah dapat mengajukan pertanyaan, konsultasi, dan
                    mendapatkan bantuan teknis kapan saja. Hal ini meningkatkan efektivitas koordinasi dan mempercepat
                    proses pengambilan keputusan di tingkat daerah.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Klinik Pemerintah Digital</h3>
              <p className="text-blue-200 leading-relaxed">
                Platform digital yang memfasilitasi komunikasi dan koordinasi antara pemerintah daerah dengan pemerintah
                pusat untuk meningkatkan efektivitas pelayanan publik.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-blue-200">
                <li>Konsultasi Online</li>
                <li>Bantuan Teknis</li>
                <li>Koordinasi Program</li>
                <li>Pelaporan Digital</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-blue-200">
                <li>Email: info@klinikpemdi.go.id</li>
                <li>Telepon: (021) 123-4567</li>
                <li>WhatsApp: 0812-3456-7890</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
            <p>&copy; 2024 Kementerian Komunikasi dan Informatika. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

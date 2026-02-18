import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-primary py-16 md:py-24 text-primary-foreground">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />

      <div className="mx-auto max-w-4xl px-4 md:px-6 text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Siap Transformasi Layanan Konsultasi Anda?
        </h2>

        <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
          Bergabunglah dengan pemerintah daerah modern yang menggunakan teknologi AI
          untuk layanan konsultasi digital yang lebih baik
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://wa.me/62895364523741"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 h-12 text-base">
              Gunakan Chatbot Helpdesk Sekarang
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>


        {/* Logo Section */}
        <div className="flex w-full justify-center mt-8">
          <div className="w-fit rounded-[26px] border-4 border-blue-300 bg-white px-6 py-4">
            <div className="flex items-center justify-center gap-6">
              {/* Dikelola Oleh */}
              <div className="flex flex-col items-center">
                <p className="mb-4 text-sm font-medium text-blue-700">
                  dikelola oleh :
                </p>
                <img
                  src="/images/komdigi_logo3.png"
                  alt="Komdigi"
                  className="h-10 object-contain"
                />
              </div>

              {/* Divider */}
              <div className="h-12 w-px bg-blue-500" />

              {/* Didukung Oleh */}
              <div className="flex flex-col items-center">
                <p className="mb-4 text-sm font-medium text-blue-700">
                  didukung oleh :
                </p>

                <div className="flex items-center gap-3">
                  <img src="/images/kemenpanrb_logo.png" className="h-10 object-contain" />
                  <img src="/images/bssn_logo.png" className="h-10 object-contain" />
                  <img src="/images/bappenas_logo.png" className="h-10 object-contain" />
                  <img src="/images/bakti_logo.jpg" className="h-10 object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

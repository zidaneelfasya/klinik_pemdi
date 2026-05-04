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
          Bergabunglah dengan pemerintah daerah modern yang menggunakan teknologi digital
          untuk layanan konsultasi digital yang lebih baik
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            className="w-[92%] max-w-[360px] mx-auto md:w-auto md:max-w-none bg-primary-foreground text-primary hover:bg-primary-foreground/90 gap-2 h-12 px-5 text-[13px] sm:text-base whitespace-nowrap text-center rounded-full"
            asChild
          >
            <a
              href="https://wa.me/62895364523741"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              Gunakan Chatbot Helpdesk Sekarang
              <ArrowRight className="w-4 h-4 shrink-0" />
            </a>
          </Button>
        </div>


        {/* Logo Section */}
        <div className="flex w-full justify-center mt-4">
          <div className="w-[92%] max-w-[360px] md:max-w-none md:w-fit rounded-[26px] border-4 border-blue-300 bg-white px-2 py-4 md:px-6 md:py-4">
            <div className="flex items-center justify-center gap-2 md:gap-6">
              {/* Dikelola Oleh */}
              <div className="flex flex-col items-center flex-shrink-0">
                <p className="mb-2 md:mb-4 text-[7px] md:text-sm font-bold md:font-medium uppercase md:normal-case tracking-wider md:tracking-normal text-blue-700">
                  dikelola oleh :
                </p>
                <img
                  src="/images/komdigi_logo3.png"
                  alt="Komdigi"
                  className="h-5 md:h-10 w-auto object-contain"
                />
              </div>

              {/* Vertical Divider */}
              <div className="h-10 md:h-12 w-px bg-blue-200 md:bg-blue-500 flex-shrink-0" />

              {/* Didukung Oleh */}
              <div className="flex flex-col items-center flex-1 md:flex-none min-w-0">
                <p className="mb-2 md:mb-4 text-[7px] md:text-sm font-bold md:font-medium uppercase md:normal-case tracking-wider md:tracking-normal text-blue-700">
                  didukung oleh :
                </p>

                <div className="flex flex-nowrap items-center justify-center gap-2 md:gap-3 w-full">
                  <img src="/images/kemenpanrb_logo.png" className="h-5 md:h-10 w-auto object-contain" />
                  <img src="/images/bssn_logo.png" className="h-5 md:h-10 w-auto object-contain" />
                  <img src="/images/bappenas_logo.png" className="h-5 md:h-10 w-auto object-contain" />
                  <img src="/images/bakti_logo.jpg" className="h-5 md:h-10 w-auto object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

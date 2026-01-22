import Image from "next/image";

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted px-4">
            <div className="w-full max-w-6xl flex flex-col md:flex-row overflow-hidden rounded-2xl shadow-lg bg-white">

                {/* KIRI */}
                <div className="relative w-full md:w-1/2 h-[260px] md:h-[600px]">
                    <Image
                        src="/images/form.png"
                        alt="Background Gradient"
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/30" />

                    {/* Konten */}
                    <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 md:px-10 text-center text-white space-y-3 md:space-y-5">
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight -mb-1">
                            Klinik Pemerintah Digital
                        </h1>

                        <p className="text-xs md:text-base opacity-90 max-w-md leading-relaxed">
                            Untuk mendapatkan akses akun{" "}
                            <span className="font-semibold">Admin Instansi</span>,
                            silakan hubungi kami melalui nomor berikut:
                        </p>

                        <div className="bg-white rounded-full py-2 md:py-3 px-6 md:px-8 shadow-md">
                            <span className="text-black font-medium text-sm md:text-base tracking-wide">
                                +62 895-3645-23741
                            </span>
                        </div>

                        <p className="text-[11px] md:text-sm opacity-80">
                            Tim kami akan membantu proses aktivasi akun Anda
                        </p>
                    </div>
                </div>

                {/* KANAN */}
                <div className="w-full md:w-1/2 flex items-center justify-center px-4 md:px-6 py-8 md:py-0">
                    {children}
                </div>

            </div>
        </div>
    );
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { toast } from "sonner"

interface FormData {
  nama: string
  telepon: string
  instansi: string
  kota: string
  provinsi: string
  skorSpbe: string
  topikKonsultasi: string[]
  fokusTujuan: string
  uraianKebutuhan: string
  konsultasiLanjut: string
  mekanisme?: string
  suratPermohonan?: string
}

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState<FormData>({
    nama: "",
    telepon: "",
    instansi: "",
    kota: "",
    provinsi: "",
    skorSpbe: "",
    topikKonsultasi: [],
    fokusTujuan: "",
    uraianKebutuhan: "",
    konsultasiLanjut: "",
    mekanisme: "",
    suratPermohonan: "",
  })
  const [topics, setTopics] = useState<string[]>([])
  const [topicsLoading, setTopicsLoading] = useState(false)
  const [topicsError, setTopicsError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopics = async () => {
      setTopicsLoading(true)
      setTopicsError(null)
      try {
        const res = await axios.get("/api/v1/konsultasi/topics")
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setTopics(res.data.data.map((t: { nama_topik: string }) => t.nama_topik))
        } else {
          setTopicsError("Gagal memuat topik konsultasi")
        }
      } catch {
        setTopicsError("Gagal memuat topik konsultasi")
      } finally {
        setTopicsLoading(false)
      }
    }
    fetchTopics()
  }, [])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // input handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    if (name === "skorSpbe") {
      // Hanya angka desimal dengan titik, maksimal 4 karakter (misal 3.00, 4.56)
      // Allow empty, or 1-2 digit, titik, 1-2 digit (ex: 3, 3.0, 3.00, 4.56)
      if (/^\d{0,1}(\.\d{0,2})?$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }))
        setErrors((prev) => ({ ...prev, [name]: "" }))
      }
      // Jika user paksa input huruf/format salah, abaikan perubahan
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: "" }))
  }

  // checkbox handler
  const handleCheckbox = (value: string, checked: boolean) => {
    setFormData((prev) => {
      const updated = checked
        ? [...prev.topikKonsultasi, value]
        : prev.topikKonsultasi.filter((item) => item !== value)
      return { ...prev, topikKonsultasi: updated }
    })
    setErrors((prev) => ({ ...prev, topikKonsultasi: "" }))
  }



  const validateStep = (currentStep: number) => {
    const newErrors: { [key: string]: string } = {}
    if (currentStep === 1) {
      if (!formData.nama) newErrors.nama = "Nama wajib diisi"
      if (!formData.telepon) newErrors.telepon = "Nomor telepon wajib diisi"
      if (!formData.instansi) newErrors.instansi = "Instansi wajib diisi"
      if (!formData.kota) newErrors.kota = "Kota wajib diisi"
      if (!formData.provinsi) newErrors.provinsi = "Provinsi wajib diisi"
      if (!formData.skorSpbe) {
        newErrors.skorSpbe = "Skor SPBE wajib diisi"
      } else if (!/^[0-5](\.\d{1,2})?$/.test(formData.skorSpbe)) {
        newErrors.skorSpbe = "Format skor harus angka desimal, contoh: 3.00 atau 4.56"
      } else {
        const skor = parseFloat(formData.skorSpbe)
        if (isNaN(skor) || skor < 0 || skor > 5) {
          newErrors.skorSpbe = "Skor SPBE harus antara 0.00 dan 5.00"
        }
      }
    } else if (currentStep === 2) {
      if (formData.topikKonsultasi.length === 0)
        newErrors.topikKonsultasi = "Pilih minimal 1 topik konsultasi"
      if (!formData.fokusTujuan) newErrors.fokusTujuan = "Fokus tujuan wajib diisi"
      if (!formData.uraianKebutuhan)
        newErrors.uraianKebutuhan = "Uraian kebutuhan wajib diisi"
      if (!formData.konsultasiLanjut)
        newErrors.konsultasiLanjut = "Pilih salah satu opsi"
    } else if (currentStep === 3) {
      if (!formData.mekanisme) newErrors.mekanisme = "Pilih mekanisme konsultasi"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (step === 3 && !validateStep(3)) return
    setLoading(true)
    try {
  const res = await axios.post("/api/tickets", formData)
      if (res.data && res.data.success) {
        if (typeof window !== "undefined") {
          localStorage.setItem("last_ticket_id", res.data.ticket)
        }
        router.push("/ticket-sukses")
      } else {
        toast.error("❌ Tiket gagal dibuat. Silakan coba lagi.")
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Axios Error:", err.response?.data || err.message)
      } else if (err instanceof Error) {
        console.error("Error:", err.message)
      } else {
        console.error("Unknown error:", err)
      }
      toast.error("❌ Terjadi kesalahan saat membuat tiket")
    } finally {
      setLoading(false)
    }
  }

  const handleNextFromStep1 = () => {
    if (validateStep(1)) setStep(2)
  }

  const handleNextFromStep2 = () => {
    if (validateStep(2)) {
      if (formData.konsultasiLanjut === "Ya") {
        setStep(3)
      } else {
        setStep(4)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl border-none rounded-2xl overflow-hidden p-4 bg-card">
        <div className="flex flex-col lg:flex-row min-h-[700px]">
          {/* Panel Kiri */}
          <div className="flex-1 relative">
            <div className="absolute inset-0">
              <Image
                src="/images/form.png"
                alt="Background"
                fill
                className="object-cover rounded-2xl"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-black/10"></div>

            <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center text-foreground space-y-6">
              <h1 className="text-2xl font-bold">Klinik Pemerintah Digital</h1>
              <p className="text-sm opacity-90 max-w-md">
                Ikuti langkah-langkah mudah berikut untuk mengajukan konsultasi
                SPBE/Pemerintah Digital.
              </p>

              <div className="space-y-4 mt-8 w-full max-w-xs">
                {["1. Isi Data Diri", "2. Isi Detail Konsultasi", "3. Konfirmasi & Tiket", "4. Buat Tiket"].map(
                  (label, i) => (
                    <div
                      key={i}
                      className={`rounded-md py-2 px-4 border border-border ${
                        step === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <span className="text-sm">{label}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Panel Kanan */}
          <div className="flex-1 flex items-center justify-center p-8">
            {/* Step 1 */}
            {step === 1 && (
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Formulir Konsultasi - Data Diri
                </h2>

                {[
                  { name: "nama", label: "Nama Lengkap" },
                  { name: "telepon", label: "Nomor Telepon (Aktif di WhatsApp)" },
                  { name: "instansi", label: "Instansi / Organisasi" },
                  { name: "kota", label: "Asal Kota/Kabupaten" },
                  { name: "provinsi", label: "Asal Provinsi" },
                  {
                    name: "skorSpbe",
                    label: "Berapa skor indeks SPBE di daerah Anda saat ini?",
                  },
                ].map((field) => (
                  <div className="space-y-2" key={field.name}>
                    <Label className="text-foreground">{field.label}</Label>
                    {field.name === "skorSpbe" ? (
                      <Input
                        name="skorSpbe"
                        type="text"
                        inputMode="decimal"
                        pattern="^[0-5](\\.\\d{1,2})?$"
                        value={formData.skorSpbe}
                        onChange={handleChange}
                        maxLength={4}
                        className="bg-input border-border text-foreground"
                        placeholder="Contoh: 3.00 atau 4.56 (0.00 - 5.00)"
                      />
                    ) : (
                      <Input
                        name={field.name}
                        value={formData[field.name as keyof FormData] as string}
                        onChange={handleChange}
                        className="bg-input border-border text-foreground"
                      />
                    )}
                    {errors[field.name] && (
                      <p className="text-destructive text-xs">{errors[field.name]}</p>
                    )}
                  </div>
                ))}

                <Button
                  onClick={handleNextFromStep1}
                  className="w-full bg-primary text-primary-foreground"
                >
                  Next →
                </Button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Formulir Konsultasi - Detail
                </h2>

                {/* Topik Konsultasi */}
                <fieldset className="space-y-2">
                  <Label className="text-foreground">Topik Konsultasi</Label>
                  {topicsLoading && <p className="text-muted-foreground text-xs">Memuat topik...</p>}
                  {topicsError && <p className="text-destructive text-xs">{topicsError}</p>}
                  {!topicsLoading && !topicsError && topics.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={formData.topikKonsultasi.includes(item)}
                        onCheckedChange={(checked) =>
                          handleCheckbox(item, checked === true)
                        }
                        className="border-2 border-border focus:ring-ring focus:border-ring"
                      />
                      <Label htmlFor={item} className="text-foreground text-sm">
                        {item}
                      </Label>
                    </div>
                  ))}
                  {errors.topikKonsultasi && (
                    <p className="text-destructive text-xs">{errors.topikKonsultasi}</p>
                  )}
                </fieldset>

                <div className="space-y-2">
                  <Label className="text-foreground">Fokus Tujuan <span className="text-destructive">*</span></Label>
                  <div className="text-xs text-muted-foreground mb-1">
                    Contoh : Mengelola SPBE/Pemerintah Digital di daerah, memanfaatkan aplikasi dan infrastruktur, meningkatkan indeks SPBE, dsb
                  </div>
                  <textarea
                    name="fokusTujuan"
                    value={formData.fokusTujuan}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-input border-border text-foreground"
                  />
                  {errors.fokusTujuan && (
                    <p className="text-destructive text-xs">{errors.fokusTujuan}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Uraian Kebutuhan Konsultasi <span className="text-destructive">*</span></Label>
                  <div className="text-xs text-muted-foreground mb-1">
                    Jelaskan aspek, masalah, atau pertanyaan yang ingin dikonsultasikan
                  </div>
                  <textarea
                    name="uraianKebutuhan"
                    value={formData.uraianKebutuhan}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-input border-border text-foreground"
                  />
                  {errors.uraianKebutuhan && (
                    <p className="text-destructive text-xs">{errors.uraianKebutuhan}</p>
                  )}
                </div>

                {/* Konsultasi lanjut */}
                <fieldset className="space-y-2">
                  <Label className="text-foreground">
                    Apakah Anda membutuhkan konsultasi lebih lanjut?
                  </Label>
                  <RadioGroup
                    value={formData.konsultasiLanjut}
                    onValueChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        konsultasiLanjut: val,
                      }))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Ya"
                        id="ya"
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <Label htmlFor="ya" className="text-foreground">
                        Ya
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value="Tidak"
                        id="tidak"
                        className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <Label htmlFor="tidak" className="text-foreground">
                        Tidak
                      </Label>
                    </div>
                  </RadioGroup>
                  {errors.konsultasiLanjut && (
                    <p className="text-destructive text-xs">{errors.konsultasiLanjut}</p>
                  )}
                </fieldset>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(1)}
                    className="w-full bg-secondary text-secondary-foreground"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleNextFromStep2}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Mekanisme Konsultasi
                </h2>

                <RadioGroup
                  value={formData.mekanisme}
                  onValueChange={(val) =>
                    setFormData((prev) => ({ ...prev, mekanisme: val }))
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="WhatsApp"
                      id="wa"
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor="wa" className="text-foreground">
                      Dengan chat via WhatsApp
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Zoom"
                      id="zoom"
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor="zoom" className="text-foreground">
                      Daring (Zoom Meeting)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Luring"
                      id="luring"
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                    <Label htmlFor="luring" className="text-foreground">
                      Luring di Kantor Pusat Kominfo
                    </Label>
                  </div>
                </RadioGroup>
                {errors.mekanisme && (
                  <p className="text-destructive text-xs">{errors.mekanisme}</p>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground">Surat Permohonan (opsional)</Label>
                  <textarea
                    name="suratPermohonan"
                    value={formData.suratPermohonan}
                    onChange={handleChange}
                    className="w-full p-2 rounded bg-input border-border text-foreground"
                    placeholder="Tulis keterangan surat permohonan jika ada (opsional)"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full bg-secondary text-secondary-foreground"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-primary text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin mr-2 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Memproses...
                      </span>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 - langsung buat tiket */}
            {step === 4 && (
              <div className="w-full max-w-md space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Langsung Buat Tiket 🚀
                </h2>
                <p className="text-muted-foreground mb-6">
                  Anda memilih untuk tidak melakukan konsultasi lebih lanjut.
                  Klik submit untuk langsung membuat tiket.
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(2)}
                    className="w-full bg-secondary text-secondary-foreground"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-primary text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin mr-2 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                        Memproses...
                      </span>
                    ) : (
                      "Submit Tiket"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

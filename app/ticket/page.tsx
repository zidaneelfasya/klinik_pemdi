"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, HelpCircle, Package, Search, Calendar } from "lucide-react";
import axios from "axios";

type TicketStatus = "diajukan" | "proses" | "selesai";

interface TicketData {
  id: number;
  ticket: string;
  nama_lengkap: string;
  instansi_organisasi: string;
  asal_provinsi: string;
  asal_kota_kabupaten: string;
  nomor_telepon: string;
  kategori: string;
  uraian_kebutuhan_konsultasi: string;
  fokus_tujuan: string;
  kondisi_implementasi_spbe?: string;
  skor_indeks_spbe: number;
  mekanisme_konsultasi: string;
  butuh_konsultasi_lanjut: boolean;
  surat_permohonan?: string;
  solusi?: string;
  status: string;
  created_at: string;
  updated_at: string;
  timestamp?: string;
  pic_id?: string;
}

interface StatusStep {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  completed: boolean;
  date?: string;
  description?: string;
}

const getStatusSteps = (
  status: TicketStatus,
  submittedAt: string,
  answeredAt?: string,
  ticketData?: TicketData,
  getStatusLabel?: (status: string) => string
): StatusStep[] => {
  // Helper function to safely format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return undefined;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return undefined;
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return undefined;
    }
  };

  return [
    {
      label: "Diajukan",
      icon: <HelpCircle className="w-6 h-6" />,
      active: true,
      completed: true,
      date: formatDate(submittedAt),
      description: "Tiket berhasil diajukan"
    },
    {
      label: ticketData?.status === "cancel" ? "Konsultasi Dibatalkan" : "Dalam Proses",
      icon: <Clock className="w-6 h-6" />,
      active: status !== "diajukan",
      completed: status === "selesai" || ticketData?.status === "cancel",
      date: status !== "diajukan" ? formatDate(submittedAt) : undefined,
      description: status !== "diajukan" ? 
        ticketData?.status === "cancel" 
          ? `Konsultasi telah dibatalkan - Status: ${ticketData && getStatusLabel ? getStatusLabel(ticketData.status) : ''}`
          : `Tiket sedang dalam proses penanganan - Status: ${ticketData && getStatusLabel ? getStatusLabel(ticketData.status) : ''}` 
        : undefined
    },
    {
      label: "Selesai",
      icon: <CheckCircle2 className="w-6 h-6" />,
      active: status === "selesai",
      completed: status === "selesai",
      date: formatDate(answeredAt),
      description: status === "selesai" ? "Tiket telah selesai dijawab" : undefined
    },
  ];
};

async function fetchTicket(ticketCode: string) {
  const res = await axios.get(`/api/v1/tickets`, {
    params: { ticket: ticketCode },
  });
  console.log("Response data:", res.data);
  
  // API returns { success: true, data: {...} }, so we need to extract the data property
  if (res.data.success && res.data.data) {
    return res.data.data;
  }
  
  // If response format is different, return as is
  return res.data;
}

export default function TicketTrackingPage() {
  const [ticketCode, setTicketCode] = useState("");
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await fetchTicket(ticketCode.trim());
      console.log("Ticket data received:", data);
      setTicket(data);
    } catch (err: any) {
      console.error("Error fetching ticket:", err);
      const errorMessage = err.response?.data?.error || err.message || "Tiket tidak ditemukan";
      setError(errorMessage);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTicketCode("");
    setTicket(null);
    setError(null);
    setHasSearched(false);
  };

  const getTicketStatus = (): TicketStatus => {
    if (!ticket) return "diajukan";
    if (ticket.solusi || ticket.status === "done") return "selesai";
    if (ticket.status === "new") return "diajukan";
    if (ticket.status === "cancel") return "proses"; // Still show as "proses" to trigger the cancelled step
    return "proses";
  };

  const getStatusColor = (status: string) => {
    const statusColors = {
      'new': 'bg-blue-100 text-blue-800 border-blue-200',
      'on process': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ready to send': 'bg-purple-100 text-purple-800 border-purple-200',
      'konsultasi zoom': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'done': 'bg-green-100 text-green-800 border-green-200',
      'FU pertanyaan': 'bg-orange-100 text-orange-800 border-orange-200',
      'cancel': 'bg-red-100 text-red-800 border-red-200'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      'new': 'Baru',
      'on process': 'Dalam Proses',
      'ready to send': 'Siap Dikirim',
      'konsultasi zoom': 'Konsultasi Zoom',
      'done': 'Selesai',
      'FU pertanyaan': 'Follow Up Pertanyaan',
      'cancel': 'Dibatalkan'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const steps = ticket ? getStatusSteps(getTicketStatus(), ticket.created_at, ticket.updated_at, ticket, getStatusLabel) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Ticket</h1>
          <p className="text-gray-600">Lacak status tiket konsultasi Anda</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-xl">Masukkan Kode Tiket</CardTitle>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="pb-4">
              <div className="flex gap-3">
                <Input
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Masukkan kode tiket (contoh: TICKET-ABC123)"
                  className="flex-1"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !ticketCode.trim()}>
                  {loading ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {loading ? "Mencari..." : "Lacak"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {error && (
              <Card className="mb-8 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-red-600 text-lg font-medium mb-2">Tiket Tidak Ditemukan</div>
                    <div className="text-red-500 mb-4">{error}</div>
                    <Button onClick={handleReset} variant="outline">
                      Coba Lagi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {ticket && (
              <>
                {/* Ticket Info Header */}
                <Card className="mb-6 shadow-lg border-l-4 border-l-blue-600">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Tiket #{ticketCode}</h2>
                        <div className="flex items-center gap-3">
                          <p className="text-gray-600">
                            {ticket.kategori ? `Konsultasi ${ticket.kategori.charAt(0).toUpperCase() + ticket.kategori.slice(1)}` : "Konsultasi Umum"}
                          </p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">Estimasi Penyelesaian</div>
                        <div className="font-medium text-lg">
                          {getTicketStatus() === "selesai" 
                            ? "Selesai" 
                            : "3-7 Hari Kerja"
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Diajukan pada {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Tanggal tidak tersedia'}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Progress */}
                <Card className="mb-6 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Status Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      {/* Progress Line */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div 
                        className={`absolute left-8 top-0 w-0.5 transition-all duration-500 ${
                          ticket?.status === "cancel" ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          height: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` 
                        }}
                      ></div>

                      {/* Steps */}
                      <div className="space-y-8">
                        {steps.map((step, index) => (
                          <div key={step.label} className="relative flex items-start gap-4">
                            {/* Icon */}
                            <div className={`
                              relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 transition-all duration-300
                              ${step.completed 
                                ? ticket?.status === "cancel" && step.label === "Konsultasi Dibatalkan"
                                  ? 'bg-red-500 border-red-500 text-white'
                                  : 'bg-green-500 border-green-500 text-white'
                                : step.active 
                                  ? 'bg-blue-500 border-blue-500 text-white' 
                                  : 'bg-gray-100 border-gray-300 text-gray-400'
                              }
                            `}>
                              {step.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-2">
                              <div className={`
                                text-lg font-semibold mb-1
                                ${step.completed 
                                  ? ticket?.status === "cancel" && step.label === "Konsultasi Dibatalkan"
                                    ? 'text-red-700'
                                    : 'text-green-700'
                                  : step.active ? 'text-blue-700' : 'text-gray-400'
                                }
                              `}>
                                {step.label}
                              </div>
                              
                              {step.date && (
                                <div className="text-sm text-gray-600 mb-2">
                                  {step.date}
                                </div>
                              )}
                              
                              {step.description && (
                                <div className="text-sm text-gray-700">
                                  {step.description}
                                </div>
                              )}
                            </div>

                            {step.completed && (
                              <div className={`font-medium text-sm pt-2 ${
                                ticket?.status === "cancel" && step.label === "Konsultasi Dibatalkan"
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }`}>
                                {ticket?.status === "cancel" && step.label === "Konsultasi Dibatalkan"
                                  ? '✗ Dibatalkan'
                                  : '✓ Selesai'
                                }
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ticket Details */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Detail Tiket</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Ticket Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50">
                      <div>
                        <div className="text-sm font-medium text-gray-600">Nama Lengkap</div>
                        <div className="text-gray-900">{ticket.nama_lengkap}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Instansi/Organisasi</div>
                        <div className="text-gray-900">{ticket.instansi_organisasi}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Lokasi</div>
                        <div className="text-gray-900">{ticket.asal_kota_kabupaten}, {ticket.asal_provinsi}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Mekanisme Konsultasi</div>
                        <div className="text-gray-900">{ticket.mekanisme_konsultasi}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Status Detail</div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                            {getStatusLabel(ticket.status)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-600">Skor Indeks SPBE</div>
                        <div className="text-gray-900">{ticket.skor_indeks_spbe}/5</div>
                      </div>
                    </div>

                    {/* Question */}
                    <div className="p-4 rounded-lg bg-blue-50 border-l-4 border-blue-400">
                      <div className="font-semibold text-blue-900 mb-2">Pertanyaan:</div>
                      <div className="text-blue-800">
                        {ticket.uraian_kebutuhan_konsultasi || "Pertanyaan tidak ditemukan"}
                      </div>
                    </div>

                    {/* Fokus Tujuan */}
                    {ticket.fokus_tujuan && (
                      <div className="p-4 rounded-lg bg-purple-50 border-l-4 border-purple-400">
                        <div className="font-semibold text-purple-900 mb-2">Fokus Tujuan:</div>
                        <div className="text-purple-800">{ticket.fokus_tujuan}</div>
                      </div>
                    )}

                    {/* Answer */}
                    <div className={`p-4 rounded-lg border-l-4 ${
                      ticket.solusi 
                        ? 'bg-green-50 border-green-400' 
                        : 'bg-gray-50 border-gray-400'
                    }`}>
                      <div className={`font-semibold mb-2 ${
                        ticket.solusi ? 'text-green-900' : 'text-gray-700'
                      }`}>
                        Jawaban:
                      </div>
                      <div className={ticket.solusi ? 'text-green-800' : 'text-gray-600 italic'}>
                        {ticket.solusi || "Belum ada jawaban, tiket masih dalam proses penanganan."}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button onClick={handleReset} variant="outline" className="w-full">
                      Lacak Tiket Lain
                    </Button>
                  </CardFooter>
                </Card>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
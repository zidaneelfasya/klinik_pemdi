import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function generateTicketId() {
  return "TICKET-" + Math.random().toString(36).substr(2, 9).toUpperCase()
}

// 📌 CREATE TICKET
export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const ticketId = generateTicketId();

  try {
    const currentTimestamp = new Date().toISOString()

    // Insert konsultasi data first
    const { data: konsultasiData, error } = await supabase
      .from("konsultasi_spbe")
      .insert([
        {
          ticket: ticketId,
          nama_lengkap: body.nama,
          jabatan: body.jabatan,
          nomor_telepon: body.telepon,
          instansi_organisasi: body.instansi,
          asal_kota_kabupaten: body.kota,
          asal_provinsi: body.provinsi,
          uraian_kebutuhan_konsultasi: body.uraianKebutuhan,
          skor_indeks_spbe: body.skorSpbe ?? null,
          kondisi_implementasi_spbe: body.kondisi ?? null,
          fokus_tujuan: body.fokusTujuan ?? null,
          mekanisme_konsultasi: body.mekanisme,
          surat_permohonan: body.suratPermohonan ?? null,
          butuh_konsultasi_lanjut: body.konsultasiLanjut === "Ya",
          status: "new",
          kategori: body.kategori ?? "tata kelola",
          timestamp: currentTimestamp,
          created_at: currentTimestamp,
          updated_at: currentTimestamp
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert konsultasi error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Insert topik konsultasi relasi jika ada
    if (body.topikKonsultasi && Array.isArray(body.topikKonsultasi) && body.topikKonsultasi.length > 0) {
      // Ambil ID topik berdasarkan nama
      const { data: topikData, error: topikError } = await supabase
        .from("topik_konsultasi")
        .select("id, nama_topik")
        .in("nama_topik", body.topikKonsultasi);

      if (topikError) {
        console.error("Error fetching topik:", topikError);
      } else if (topikData && topikData.length > 0) {
        // Insert relasi konsultasi-topik
        const topikRelasi = topikData.map(topik => ({
          konsultasi_id: konsultasiData.id,
          topik_id: topik.id
        }));

        const { error: relasiError } = await supabase
          .from("konsultasi_topik")
          .insert(topikRelasi);

        if (relasiError) {
          console.error("Error inserting topik relasi:", relasiError);
        }
      }
    }

    // Kirim notifikasi WhatsApp setelah berhasil insert data
    try {
      await sendWhatsAppTicketNotification(body, ticketId);
    } catch (whatsappError) {
      console.error("Error sending WhatsApp notification:", whatsappError);
      // Tidak perlu menggagalkan request jika WhatsApp gagal
    }

    return NextResponse.json({ success: true, ticket: ticketId, data: konsultasiData });

  } catch (error) {
    console.error("Error in POST /api/tickets:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fungsi untuk mengirim notifikasi WhatsApp ticket
async function sendWhatsAppTicketNotification(body: any, ticketId: string) {
  try {
    // URL WhatsApp API (bisa dikonfigurasi via env)
    const whatsappApiUrl = 'http://localhost:5000';

    // Format nomor telepon untuk WhatsApp (hapus karakter non-digit dan tambahkan prefix jika perlu)
    const cleanPhoneNumber = body.telepon.replace(/\D/g, '');

    // Jika nomor dimulai dengan 0, ganti dengan 62 (Indonesia)
    const whatsappNumber = cleanPhoneNumber.startsWith('0')
      ? '62' + cleanPhoneNumber.substring(1)
      : cleanPhoneNumber.startsWith('62')
        ? cleanPhoneNumber
        : '62' + cleanPhoneNumber;

    console.log(`📱 Sending WhatsApp notification to ${whatsappNumber} for ticket ${ticketId}`);

    const api = `${whatsappApiUrl}/api/send-ticket`;
    console.log(api)
    const response = await fetch(`${api}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: whatsappNumber,
        ticket: ticketId,
        nama: body.nama,
        instansi: body.instansi,
        kota: body.kota,
        provinsi: body.provinsi,
        topikKonsultasi: body.topikKonsultasi || [],
        fokusTujuan: body.fokusTujuan,
        uraianKebutuhan: body.uraianKebutuhan,
        konsultasiLanjut: body.konsultasiLanjut,
        mekanisme: body.mekanisme
      }),
      // Set timeout untuk mencegah hanging
      signal: AbortSignal.timeout(10000) // 10 detik timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API responded with status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ WhatsApp notification sent successfully:", result);
    return result;

  } catch (error) {
    console.error("❌ Failed to send WhatsApp notification:", error);
    throw error;
  }
}

// 📌 GET TICKET BY ID
export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const ticketId = searchParams.get("ticket")

  console.log("Mencari tiket:", ticketId)

  if (!ticketId) {
    return NextResponse.json(
      { success: false, error: "Ticket ID tidak ditemukan" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("konsultasi_spbe")
    .select("*")
    .eq("ticket", ticketId)
    .maybeSingle() // supaya gak error keras kalau kosong

  if (error) {
    console.error("Supabase fetch error:", error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: "Tiket tidak ditemukan" },
      { status: 404 }
    )
  }

  // Only include solusi field if status is "done"
  if (data.status !== "done") {
    const { solusi, ...dataWithoutSolusi } = data
    return NextResponse.json({ success: true, data: dataWithoutSolusi })
  }

  return NextResponse.json({ success: true, data })
}
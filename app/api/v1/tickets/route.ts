import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ===============================
   ENUM CONSTANT
================================ */

const STATUS_DEFAULT = "pending";

const ALLOWED_KATEGORI = [
  "teknis",
  "administratif",
  "strategis",
  "lainnya",
] as const;

/* ===============================
   HELPER: Generate Ticket ID
================================ */
function generateTicketId() {
  return "TICKET-" + Math.random().toString(36).substring(2, 11).toUpperCase();
}

/* ===============================
   HELPER: Resolve Kategori (ANTI ERROR)
================================ */
function resolveKategori(topikList: string[]): string {
  const text = topikList.join(" ").toLowerCase();

  if (
    text.includes("akses internet") ||
    text.includes("infrastruktur") ||
    text.includes("keamanan")
  ) {
    return "teknis";
  }

  if (
    text.includes("layanan") ||
    text.includes("manajemen") ||
    text.includes("sumber daya manusia")
  ) {
    return "administratif";
  }

  if (
    text.includes("tata kelola") ||
    text.includes("arsitektur") ||
    text.includes("evaluasi") ||
    text.includes("kebijakan")
  ) {
    return "strategis";
  }

  return "lainnya";
}

/* ===============================
   POST → Buat Tiket
================================ */
export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    const body = await req.json();
    const ticketId = generateTicketId();
    const now = new Date().toISOString();

    // 🔥 KATEGORI DIAMANKAN DI BACKEND
    const kategori = resolveKategori(
      Array.isArray(body.topikKonsultasi) ? body.topikKonsultasi : []
    );

    // 🛡️ Final safety check
    const finalKategori = ALLOWED_KATEGORI.includes(kategori as any)
      ? kategori
      : "lainnya";

    console.log("TOPIK:", body.topikKonsultasi);
    console.log("KATEGORI FINAL:", finalKategori);

    /* ===============================
       INSERT KONSULTASI
    ================================ */
    const { data: konsultasi, error } = await supabase
      .from("konsultasi_spbe")
      .insert([
        {
          ticket: ticketId,
          nama_lengkap: body.nama,
          nomor_telepon: body.telepon,
          instansi_organisasi: body.instansi,
          asal_kota_kabupaten: body.kota,
          asal_provinsi: body.provinsi,
          uraian_kebutuhan_konsultasi: body.uraianKebutuhan,
          skor_indeks_spbe: body.skorSpbe ? Number(body.skorSpbe) : null,
          kondisi_implementasi_spbe: body.kondisi ?? null,
          fokus_tujuan: body.fokusTujuan ?? null,
          mekanisme_konsultasi: body.mekanisme ?? null,
          surat_permohonan: body.suratPermohonan ?? null,
          butuh_konsultasi_lanjut: body.konsultasiLanjut === "Ya",

          // ✅ ENUM VALID
          status: STATUS_DEFAULT,
          kategori: finalKategori,

          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    /* ===============================
       RELASI TOPIK
    ================================ */
    if (Array.isArray(body.topikKonsultasi) && body.topikKonsultasi.length > 0) {
      const { data: topikData, error: topikError } = await supabase
        .from("topik_konsultasi")
        .select("id, nama_topik")
        .in("nama_topik", body.topikKonsultasi);

      if (topikError) {
        console.error("FETCH TOPIK ERROR:", topikError);
      }

      if (topikData?.length) {
        const relasi = topikData.map((topik) => ({
          konsultasi_id: konsultasi.id,
          topik_id: topik.id,
        }));

        const { error: relasiError } = await supabase
          .from("konsultasi_topik")
          .insert(relasi);

        if (relasiError) {
          console.error("INSERT RELASI ERROR:", relasiError);
        }
      }
    }

    /* ===============================
       RESPONSE
    ================================ */
    return NextResponse.json({
      success: true,
      ticket: ticketId,
      data: konsultasi,
    });
  } catch (err) {
    console.error("API FATAL ERROR:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* ===============================
   GET → Ambil Tiket
================================ */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticket = searchParams.get("ticket");

  if (!ticket) {
    return NextResponse.json(
      { error: "Kode tiket wajib diisi" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("konsultasi_spbe")
    .select("*")
    .eq("ticket", ticket)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Tiket tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(data);
}

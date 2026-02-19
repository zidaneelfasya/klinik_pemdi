// Types untuk Konsultasi SPBE

export interface KonsultasiSPBE {
  id: number;
  timestamp: string | null;
  nama_lengkap: string | null;
  jabatan: string | null;
  nomor_telepon: string | null;
  instansi_organisasi: string | null;
  asal_kota_kabupaten: string | null;
  asal_provinsi: string | null;
  uraian_kebutuhan_konsultasi: string | null;
  skor_indeks_spbe: number | null;
  kondisi_implementasi_spbe: string | null;
  fokus_tujuan: string | null;
  mekanisme_konsultasi: string | null;
  surat_permohonan: string | null;
  butuh_konsultasi_lanjut: boolean | null;
  status: StatusEnum;
  pic_id: number | null;
  solusi: string | null;
  kategori: KategoriEnum;
  ticket: string | null;
  created_at: string;
  updated_at: string;
  pic_list?: PIC | null;
  konsultasi_unit?: KonsultasiUnit[];
  konsultasi_topik?: KonsultasiTopik[];
}

export interface PIC {
  id: number;
  nama_pic: string;
}

export interface UnitPenanggungJawab {
  id: number;
  nama_unit: string;
  nama_pic: string | null;
  // pic_list?: PIC | null;
}

export interface TopikKonsultasi {
  id: number;
  nama_topik: string;
}

export interface KonsultasiUnit {
  konsultasi_id: number;
  unit_id: number;
  unit_penanggungjawab: UnitPenanggungJawab;
}

export interface KonsultasiTopik {
  konsultasi_id: number;
  topik_id: number;
  topik_konsultasi: TopikKonsultasi;
}

export type StatusEnum = 'new' | 'on process' | 'ready to send' | 'konsultasi zoom' | 'done' | 'FU pertanyaan' | 'cancel';

export type KategoriEnum = 'tata kelola' | 'infrastruktur' | 'aplikasi' | 'keamanan informasi' | 'SDM';

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
}

export interface KonsultasiStats {
  total: number;
  byStatus: Record<string, number>;
  byKategori: Record<string, number>;
  byPIC: Record<string, { count: number; pic_name: string }>;
  monthly: Record<string, number>;
  recent: Partial<KonsultasiSPBE>[];
}

// Query parameters for API
export interface KonsultasiQueryParams {
  id?: string;
  status?: StatusEnum;
  kategori?: KategoriEnum;
  pic_id?: string;
  instansi?: string;
  limit?: string;
  offset?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Form data for creating/updating konsultasi
export interface KonsultasiFormData {
  timestamp?: string;
  nama_lengkap?: string;
  jabatan?: string;
  nomor_telepon?: string;
  instansi_organisasi?: string;
  asal_kota_kabupaten?: string;
  asal_provinsi?: string;
  uraian_kebutuhan_konsultasi?: string;
  skor_indeks_spbe?: number;
  kondisi_implementasi_spbe?: string;
  fokus_tujuan?: string;
  mekanisme_konsultasi?: string;
  surat_permohonan?: string;
  butuh_konsultasi_lanjut?: boolean;
  status?: StatusEnum;
  pic_id?: number;
  solusi?: string;
  kategori?: KategoriEnum;
  ticket?: string;
}


CREATE TYPE status_konsultasi AS ENUM ('new', 'on process', 'ready to send', 'konsultasi zoom', 'done', 'fu pertanyaan', 'cancel');
CREATE TYPE kategori_konsultasi AS ENUM ('tata kelola', 'infrastruktur', 'aplikasi', 'keamanan informasi', 'sdm');


CREATE TABLE public.file_context_uploads (
  id character varying NOT NULL,
  original_name character varying NOT NULL,
  unique_name character varying NOT NULL,
  path_url text,
  upload_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT file_context_uploads_pkey PRIMARY KEY (id)
);
CREATE TABLE public.konsultasi_spbe (
  id integer NOT NULL DEFAULT nextval('konsultasi_spbe_id_seq'::regclass),
  timestamp timestamp with time zone DEFAULT now(),
  nama_lengkap text NOT NULL,
  nomor_telepon text NOT NULL,
  instansi_organisasi text NOT NULL,
  asal_kota_kabupaten text NOT NULL,
  asal_provinsi text NOT NULL,
  uraian_kebutuhan_konsultasi text NOT NULL,
  skor_indeks_spbe numeric,
  kondisi_implementasi_spbe text,
  fokus_tujuan text,
  mekanisme_konsultasi text,
  surat_permohonan text,
  butuh_konsultasi_lanjut boolean DEFAULT false,
  status USER-DEFINED DEFAULT 'new'::status_konsultasi,
  pic_id integer,
  solusi text,
  kategori text,
  ticket character varying UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  jabatan text NOT NULL,
  CONSTRAINT konsultasi_spbe_pkey PRIMARY KEY (id),
  CONSTRAINT konsultasi_spbe_pic_id_fkey FOREIGN KEY (pic_id) REFERENCES public.pic_list(id)
);
CREATE TABLE public.konsultasi_topik (
  konsultasi_id integer NOT NULL,
  topik_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT konsultasi_topik_pkey PRIMARY KEY (konsultasi_id, topik_id),
  CONSTRAINT konsultasi_topik_konsultasi_id_fkey FOREIGN KEY (konsultasi_id) REFERENCES public.konsultasi_spbe(id),
  CONSTRAINT konsultasi_topik_topik_id_fkey FOREIGN KEY (topik_id) REFERENCES public.topik_konsultasi(id)
);
CREATE TABLE public.konsultasi_unit (
  konsultasi_id integer NOT NULL,
  unit_id integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT konsultasi_unit_pkey PRIMARY KEY (konsultasi_id, unit_id),
  CONSTRAINT konsultasi_unit_konsultasi_id_fkey FOREIGN KEY (konsultasi_id) REFERENCES public.konsultasi_spbe(id),
  CONSTRAINT konsultasi_unit_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit_penanggungjawab(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  thread_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id)
);
CREATE TABLE public.pic_list (
  id integer NOT NULL DEFAULT nextval('pic_list_id_seq'::regclass),
  nama_pic text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pic_list_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  full_name text,
  phone text,
  email text,
  nip text,
  jabatan text,
  satuan_kerja text,
  instansi text,
  avatar_url text,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'pic'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT threads_pkey PRIMARY KEY (id),
  CONSTRAINT threads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.topik_konsultasi (
  id integer NOT NULL DEFAULT nextval('topik_konsultasi_id_seq'::regclass),
  nama_topik text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT topik_konsultasi_pkey PRIMARY KEY (id)
);
CREATE TABLE public.unit_penanggungjawab (
  id integer NOT NULL DEFAULT nextval('unit_penanggungjawab_id_seq'::regclass),
  nama_unit text NOT NULL UNIQUE,
  nama_pic text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unit_penanggungjawab_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_unit_penanggungjawab (
  id integer NOT NULL DEFAULT nextval('user_unit_penanggungjawab_id_seq'::regclass),
  user_id uuid,
  unit_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_unit_penanggungjawab_pkey PRIMARY KEY (id),
  CONSTRAINT user_unit_penanggungjawab_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_unit_penanggungjawab_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.unit_penanggungjawab(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_konsultasi_spbe_status ON konsultasi_spbe(status);
CREATE INDEX IF NOT EXISTS idx_konsultasi_spbe_pic_id ON konsultasi_spbe(pic_id);
CREATE INDEX IF NOT EXISTS idx_konsultasi_spbe_timestamp ON konsultasi_spbe(timestamp);
CREATE INDEX IF NOT EXISTS idx_konsultasi_spbe_ticket ON konsultasi_spbe(ticket);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_konsultasi_topik_topik_id ON konsultasi_topik(topik_id);
CREATE INDEX IF NOT EXISTS idx_konsultasi_unit_unit_id ON konsultasi_unit(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_unit_penanggungjawab_user_id ON user_unit_penanggungjawab(user_id);
CREATE INDEX IF NOT EXISTS idx_user_unit_penanggungjawab_unit_id ON user_unit_penanggungjawab(unit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at column
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'file_context_uploads', 'profiles', 'threads', 'messages',
            'konsultasi_spbe', 'pic_list', 'topik_konsultasi', 
            'unit_penanggungjawab', 'user_unit_penanggungjawab'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', tbl.tablename, tbl.tablename, tbl.tablename, tbl.tablename);
    END LOOP;
END $$;


INSERT INTO pic_list (nama_pic) VALUES
('Safira'),
('Morris'),
('Allysa'),
('Babas'),
('Ana'),
('Rossi'),
('Hamid');

INSERT INTO unit_penanggungjawab (nama_unit, nama_pic) VALUES
('Tim Akselerasi Pemerintah Daerah','Safira'),
('Tim Smart City','Dina'),
('Tim Desa dan Konkuren','Rian'),
('Direktorat Aplikasi Pemerintah','Sofi'),
('Direktorat Infrastruktur Pemerintah','Nayaka'),
('Direktorat Strajak', 'Yuki'),
('BAKTI', NULL),
('Ditjen Infrastruktur Digital','Hilman'),
('BSSN','Ivan Bashofi'),
('KemenPANRB','Iksan');

INSERT INTO topik_konsultasi (nama_topik) VALUES
('Arsitektur, Tata Kelola, Regulasi, dan Kebijakan'),
('Aplikasi SPBE/Pemerintah Digital'),
('Infrastruktur SPBE/Pemerintah Digital'),
('Akses Internet'),
('Manajemen Data dan Informasi'),
('Keamanan Data'),
('Layanan Digital Pemerintah'),
('Pengelolaan Sumber Daya Manusia SPBE/Pemerintah Digital'),
('Pengukuran dan Evaluasi SPBE/Pemerintah Digital');


-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

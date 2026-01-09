
CREATE TYPE status_konsultasi AS ENUM ('new', 'on process', 'ready to send', 'konsultasi zoom', 'done', 'fu pertanyaan', 'cancel');
CREATE TYPE kategori_konsultasi AS ENUM ('tata kelola', 'infrastruktur', 'aplikasi', 'keamanan informasi', 'sdm');

-- Table: file_context_uploads
CREATE TABLE IF NOT EXISTS file_context_uploads (
    id VARCHAR PRIMARY KEY,
    original_name VARCHAR NOT NULL,
    unique_name VARCHAR NOT NULL,
    path_url TEXT,
    upload_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: pic_list
CREATE TABLE IF NOT EXISTS pic_list (
    id SERIAL PRIMARY KEY,
    nama_pic TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: topik_konsultasi
CREATE TABLE IF NOT EXISTS topik_konsultasi (
    id SERIAL PRIMARY KEY,
    nama_topik TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: unit_penanggungjawab
CREATE TABLE IF NOT EXISTS unit_penanggungjawab (
    id SERIAL PRIMARY KEY,
    nama_unit TEXT NOT NULL UNIQUE,
    nama_pic TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: profiles (requires auth.users table from Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    nip TEXT,
    jabatan TEXT,
    satuan_kerja TEXT,
    instansi TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'pic')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: threads
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: konsultasi_spbe
CREATE TABLE IF NOT EXISTS konsultasi_spbe (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    nama_lengkap TEXT NOT NULL,
    nomor_telepon TEXT NOT NULL,
    instansi_organisasi TEXT NOT NULL,
    asal_kota_kabupaten TEXT NOT NULL,
    asal_provinsi TEXT NOT NULL,
    uraian_kebutuhan_konsultasi TEXT NOT NULL,
    skor_indeks_spbe NUMERIC(5,2),
    kondisi_implementasi_spbe TEXT,
    fokus_tujuan TEXT,
    mekanisme_konsultasi TEXT,
    surat_permohonan TEXT,
    butuh_konsultasi_lanjut BOOLEAN DEFAULT false,
    status status_konsultasi DEFAULT 'pending',
    pic_id INTEGER REFERENCES pic_list(id),
    solusi TEXT,
    kategori kategori_konsultasi DEFAULT 'lainnya',
    ticket VARCHAR UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table: konsultasi_topik
CREATE TABLE IF NOT EXISTS konsultasi_topik (
    konsultasi_id INTEGER REFERENCES konsultasi_spbe(id) ON DELETE CASCADE,
    topik_id INTEGER REFERENCES topik_konsultasi(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (konsultasi_id, topik_id)
);

-- Junction table: konsultasi_unit
CREATE TABLE IF NOT EXISTS konsultasi_unit (
    konsultasi_id INTEGER REFERENCES konsultasi_spbe(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES unit_penanggungjawab(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (konsultasi_id, unit_id)
);

-- Table: user_unit_penanggungjawab
CREATE TABLE IF NOT EXISTS user_unit_penanggungjawab (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_id INTEGER REFERENCES unit_penanggungjawab(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, unit_id)
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

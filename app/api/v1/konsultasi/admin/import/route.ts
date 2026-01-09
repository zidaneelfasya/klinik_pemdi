import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

interface ImportedRow {
  nama_lengkap?: string;
  nomor_telepon?: any; // Changed to any to handle different data types
  instansi_organisasi?: string;
  asal_kota_kabupaten?: string;
  asal_provinsi?: string;
  uraian_kebutuhan_konsultasi?: string;
  topik_konsultasi?: string;
  skor_indeks_spbe?: any; // Changed to any
  kondisi_implementasi_spbe?: string;
  fokus_tujuan?: string;
  mekanisme_konsultasi?: string;
  surat_permohonan?: string;
  butuh_konsultasi_lanjut?: string | boolean;
  kategori?: string;
  status?: string;
  pic_name?: string;
  unit_names?: string;
  topik_names?: string;
  solusi?: string;
  timestamp?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check user authentication and permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/vnd.ms-excel.sheet.macroEnabled.12', // xlsm
      'application/octet-stream' // fallback for some Excel files
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file.' },
        { status: 400 }
      );
    }

    // Read file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { 
      type: 'array',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with raw values to handle different data types
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      raw: false, // Get formatted values
      defval: '' 
    }) as ImportedRow[];

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'File is empty or no valid data found' },
        { status: 400 }
      );
    }

    // Get reference data for validation
    const [picResult, unitResult, topikResult] = await Promise.all([
      supabase.from('pic_list').select('id, nama_pic'),
      supabase.from('unit_penanggungjawab').select('id, nama_unit'),
      supabase.from('topik_konsultasi').select('id, nama_topik')
    ]);

    const picMap = new Map(
      picResult.data?.map(pic => [pic.nama_pic.toLowerCase(), pic.id]) || []
    );
    const unitMap = new Map(
      unitResult.data?.map(unit => [unit.nama_unit.toLowerCase(), unit.id]) || []
    );
    const topikMap = new Map(
      topikResult.data?.map(topik => [topik.nama_topik.toLowerCase(), topik.id]) || []
    );

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

      try {
        // Validate required fields
        if (!row.nama_lengkap) {
          throw new Error('Nama lengkap is required');
        }

        // Normalize and clean data
        const normalizeString = (value: any): string | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'string') return value.trim();
          if (typeof value === 'number') return value.toString().trim();
          if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
          return String(value).trim();
        };

        const normalizeNumber = (value: any): number | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            // Handle comma as decimal separator
            const cleaned = value.replace(',', '.').replace(/[^\d.-]/g, '');
            const num = parseFloat(cleaned);
            return isNaN(num) ? null : num;
          }
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        };

        const normalizePhone = (value: any): string | null => {
          if (!value) return null;
          const phoneStr = String(value).trim();
          // Remove any non-digit characters except +
          const cleaned = phoneStr.replace(/[^\d+]/g, '');
          return cleaned || null;
        };

        // Handle nomor_telepon
        const nomorTelepon = normalizePhone(row.nomor_telepon);
        
        // Validate enum values
        const validKategori = ['tata kelola', 'infrastruktur', 'aplikasi', 'keamanan informasi', 'sdm']; // Lowercase all
        const validStatus = ['new', 'on process', 'ready to send', 'konsultasi zoom', 'done', 'fu pertanyaan', 'cancel'];

        let kategori = row.kategori?.toLowerCase().trim() || 'tata kelola';
        
        // Map kategori value from CSV to database value
        if (kategori === 'sdm') {
          kategori = 'SDM'; // Match your database value
        } else if (kategori === 'keamanan data') {
          kategori = 'keamanan informasi'; // Map if needed
        }
        
        if (kategori && !validKategori.includes(kategori.toLowerCase())) {
          throw new Error(`Invalid kategori: ${row.kategori}`);
        }

        const status = row.status?.toLowerCase().trim() || 'new';
        if (status && !validStatus.includes(status.toLowerCase())) {
          throw new Error(`Invalid status: ${row.status}`);
        }

        // Find PIC ID
        let picId = null;
        if (row.pic_name) {
          const picName = normalizeString(row.pic_name);
          if (picName) {
            picId = picMap.get(picName.toLowerCase());
            if (!picId) {
              console.warn(`PIC not found: ${row.pic_name} (row ${rowNumber})`);
            }
          }
        }

        // Parse timestamp
        let timestamp = null;
        if (row.timestamp) {
          try {
            // Handle Excel date numbers
            if (typeof row.timestamp === 'number') {
              // Excel date (days since 1900)
              const excelDate = row.timestamp;
              const msSince1900 = (excelDate - 25569) * 86400 * 1000; // 25569 = days from 1900-01-01 to 1970-01-01
              timestamp = new Date(msSince1900);
            } else {
              timestamp = new Date(row.timestamp);
            }
            
            if (isNaN(timestamp.getTime())) {
              timestamp = null;
            }
          } catch {
            timestamp = null;
          }
        }

        // Parse butuh_konsultasi_lanjut
        let butuhKonsultasiLanjut = null;
        if (row.butuh_konsultasi_lanjut !== undefined && row.butuh_konsultasi_lanjut !== null) {
          if (typeof row.butuh_konsultasi_lanjut === 'boolean') {
            butuhKonsultasiLanjut = row.butuh_konsultasi_lanjut;
          } else {
            const value = normalizeString(row.butuh_konsultasi_lanjut);
            if (value) {
              const lowerValue = value.toLowerCase();
              butuhKonsultasiLanjut = ['ya', 'yes', 'true', '1', 'y'].includes(lowerValue);
            }
          }
        }

        // Clean skor_indeks_spbe
        let skorIndeks = null;
        if (row.skor_indeks_spbe !== undefined && row.skor_indeks_spbe !== null) {
          skorIndeks = normalizeNumber(row.skor_indeks_spbe);
        }

        // Check if topik_konsultasi column exists in database schema
        const { data: tableInfo } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_name', 'konsultasi_spbe')
          .eq('column_name', 'topik_konsultasi');

        const hasTopikKonsultasiColumn = tableInfo && tableInfo.length > 0;

        // Prepare konsultasi data
        const konsultasiData: any = {
          nama_lengkap: normalizeString(row.nama_lengkap),
          nomor_telepon: nomorTelepon,
          instansi_organisasi: normalizeString(row.instansi_organisasi),
          asal_kota_kabupaten: normalizeString(row.asal_kota_kabupaten),
          asal_provinsi: normalizeString(row.asal_provinsi),
          uraian_kebutuhan_konsultasi: normalizeString(row.uraian_kebutuhan_konsultasi),
          // Only include topik_konsultasi if column exists
          ...(hasTopikKonsultasiColumn && { 
            topik_konsultasi: normalizeString(row.topik_konsultasi) 
          }),
          skor_indeks_spbe: skorIndeks,
          kondisi_implementasi_spbe: normalizeString(row.kondisi_implementasi_spbe),
          fokus_tujuan: normalizeString(row.fokus_tujuan),
          mekanisme_konsultasi: normalizeString(row.mekanisme_konsultasi),
          surat_permohonan: normalizeString(row.surat_permohonan),
          butuh_konsultasi_lanjut: butuhKonsultasiLanjut,
          kategori: kategori,
          status: status,
          pic_id: picId,
          solusi: normalizeString(row.solusi),
          timestamp,
        };

        // Remove undefined/null values
        Object.keys(konsultasiData).forEach(key => {
          if (konsultasiData[key] === undefined || konsultasiData[key] === null) {
            delete konsultasiData[key];
          }
        });

        const { data: insertedKonsultasi, error: insertError } = await supabase
          .from('konsultasi_spbe')
          .insert(konsultasiData)
          .select('id')
          .single();

        if (insertError) {
          throw new Error(`Failed to insert konsultasi: ${insertError.message}`);
        }

        const konsultasiId = insertedKonsultasi.id;

        // Insert units if provided
        if (row.unit_names) {
          const unitStr = normalizeString(row.unit_names);
          if (unitStr) {
            const unitNames = unitStr.split(',').map(name => name.trim());
            const unitInserts = [];

            for (const unitName of unitNames) {
              if (unitName) {
                const unitId = unitMap.get(unitName.toLowerCase());
                if (unitId) {
                  unitInserts.push({
                    konsultasi_id: konsultasiId,
                    unit_id: unitId
                  });
                } else {
                  console.warn(`Unit not found: ${unitName} (row ${rowNumber})`);
                }
              }
            }

            if (unitInserts.length > 0) {
              const { error: unitError } = await supabase
                .from('konsultasi_unit')
                .insert(unitInserts);

              if (unitError) {
                console.warn(`Failed to insert units for row ${rowNumber}:`, unitError);
              }
            }
          }
        }

        // Insert topics if provided
        if (row.topik_names) {
          const topikStr = normalizeString(row.topik_names);
          if (topikStr) {
            const topikNames = topikStr.split(',').map(name => name.trim());
            const topikInserts = [];

            for (const topikName of topikNames) {
              if (topikName) {
                const topikId = topikMap.get(topikName.toLowerCase());
                if (topikId) {
                  topikInserts.push({
                    konsultasi_id: konsultasiId,
                    topik_id: topikId
                  });
                } else {
                  console.warn(`Topik not found: ${topikName} (row ${rowNumber})`);
                }
              }
            }

            if (topikInserts.length > 0) {
              const { error: topikError } = await supabase
                .from('konsultasi_topik')
                .insert(topikInserts);

              if (topikError) {
                console.warn(`Failed to insert topics for row ${rowNumber}:`, topikError);
              }
            }
          }
        }

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${result.success} records imported successfully, ${result.failed} failed.`,
      result
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { 
        error: 'Import failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
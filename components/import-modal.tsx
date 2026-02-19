"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  UploadIcon, 
  FileSpreadsheetIcon, 
  LoaderIcon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  DownloadIcon,
  FileTextIcon
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

interface ImportModalProps {
  onImportComplete?: () => void;
}

export function ImportModal({ onImportComplete }: ImportModalProps) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = React.useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (isValidFileType(droppedFile)) {
        handleFileChange(droppedFile);
      } else {
        toast.error('Invalid file type. Please upload Excel (.xlsx, .xls) or CSV file.');
      }
    }
  };

  const isValidFileType = (file: File) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    return allowedTypes.includes(file.type);
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading('Importing data...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/konsultasi/admin/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data.result);
      
      toast.dismiss(loadingToast);
      toast.success(`Import completed! ${data.result.success} records imported successfully.`);
      
      if (onImportComplete) {
        onImportComplete();
      }

    } catch (error) {
      console.error('Import error:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        nama_lengkap: 'John Doe',
        nomor_telepon: '081234567890',
        instansi_organisasi: 'Pemkot Jakarta',
        jabatan: 'Kepala Bidang IT',
        asal_kota_kabupaten: 'Jakarta Pusat',
        asal_provinsi: 'DKI Jakarta',
        uraian_kebutuhan_konsultasi: 'Membutuhkan konsultasi untuk implementasi SPBE',
        skor_indeks_spbe: 2.5,
        kondisi_implementasi_spbe: 'Belum optimal',
        fokus_tujuan: 'Meningkatkan layanan digital',
        mekanisme_konsultasi: 'Online',
        surat_permohonan: '',
        butuh_konsultasi_lanjut: true,
        kategori: 'tata kelola',
        status: 'new',
        pic_name: 'Safira',
        unit_names: 'Tim Akselerasi Pemerintah Daerah;Tim Smart City',
        topik_names: 'Arsitektur, Tata Kelola, Regulasi, dan Kebijakan;Aplikasi SPBE/Pemerintah Digital',
        solusi: '',
        timestamp: '2024-01-15 10:30:00'
      }
    ];

    const wb = XLSX.utils.book_new();
    
    const wsTemplate = XLSX.utils.json_to_sheet(templateData);
    
    wsTemplate['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
      { wch: 40 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 40 }, { wch: 50 }, { wch: 30 }, { wch: 20 }
    ];
    
    XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template');

    const referenceData = [
      ['FIELD WAJIB DIISI (*):'],
      ['- nama_lengkap (*): Nama lengkap pemohon'],
      ['- nomor_telepon (*): Nomor telepon/WA (contoh: 081234567890)'],
      ['- instansi_organisasi (*): Nama instansi/organisasi'],
      ['- jabatan (*): Jabatan pemohon (contoh: Kepala Bidang IT, Staff Dinas, dll)'],
      ['- asal_kota_kabupaten (*): Kota/Kabupaten asal'],
      ['- asal_provinsi (*): Provinsi asal'],
      ['- uraian_kebutuhan_konsultasi (*): Deskripsi kebutuhan konsultasi'],
      [''],
      ['KATEGORI (pilih salah satu): tata kelola, infrastruktur, aplikasi, keamanan informasi, sdm'],
      ['STATUS (pilih salah satu): new, on process, ready to send, konsultasi zoom, done, fu pertanyaan, cancel'],
      ['BUTUH_KONSULTASI_LANJUT (boolean): true atau false'],
      ['PIC (pilih salah satu): Safira, Morris, Allysa, Babas, Ana, Rossi, Hamid'],
      ['UNIT (bisa lebih dari satu, pisahkan dengan semicolon ;): Tim Akselerasi Pemerintah Daerah; Tim Smart City; Tim Desa dan Konkuren; Direktorat Aplikasi Pemerintah; Direktorat Infrastruktur Pemerintah; Direktorat Strajak; BAKTI; Ditjen Infrastruktur Digital; BSSN; KemenPANRB'],
      ['TOPIK (bisa lebih dari satu, pisahkan dengan semicolon ;):'],
      ['  - Arsitektur, Tata Kelola, Regulasi, dan Kebijakan'],
      ['  - Aplikasi SPBE/Pemerintah Digital'],
      ['  - Infrastruktur SPBE/Pemerintah Digital'],
      ['  - Akses Internet'],
      ['  - Manajemen Data dan Informasi'],
      ['  - Keamanan Data'],
      ['  - Layanan Digital Pemerintah'],
      ['  - Pengelolaan Sumber Daya Manusia SPBE/Pemerintah Digital'],
      ['  - Pengukuran dan Evaluasi SPBE/Pemerintah Digital'],
      [''],
      ['CONTOH PENGISIAN UNIT DAN TOPIK:'],
      ['  unit_names: Tim Akselerasi Pemerintah Daerah;Tim Smart City'],
      ['  topik_names: Arsitektur, Tata Kelola, Regulasi, dan Kebijakan;Aplikasi SPBE/Pemerintah Digital'],
      [''],
      ['CATATAN PENTING:'],
      ['- Field dengan tanda (*) WAJIB diisi, tidak boleh kosong'],
      ['- skor_indeks_spbe berupa angka desimal antara 0-5 (contoh: 2.5)'],
      ['- timestamp format: YYYY-MM-DD HH:MM:SS atau kosongkan untuk menggunakan waktu saat ini'],
      ['- unit_names dan topik_names bisa diisi lebih dari satu dengan dipisahkan SEMICOLON (;)'],
      ['- butuh_konsultasi_lanjut: gunakan true/false atau ya/tidak'],
      ['- Pastikan nama topik dan unit ditulis PERSIS seperti di referensi (case-insensitive)'],
    ];

    const wsReference = XLSX.utils.aoa_to_sheet(referenceData);
    wsReference['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsReference, 'Referensi');
    
    XLSX.writeFile(wb, 'template_import_konsultasi_spbe.xlsx');
    
    toast.success('Template downloaded successfully');
  };

  const downloadErrors = () => {
    if (!result?.errors.length) return;

    const ws = XLSX.utils.json_to_sheet(result.errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
    XLSX.writeFile(wb, 'import_errors.xlsx');
    
    toast.success('Error report downloaded');
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetModal();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UploadIcon className="size-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Konsultasi SPBE</DialogTitle>
          <DialogDescription>
            Upload file Excel atau CSV untuk mengimpor data konsultasi secara massal. Download template terlebih dahulu untuk format yang benar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileTextIcon className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Template Import</span>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <DownloadIcon className="size-4 mr-1" />
              Download
            </Button>
          </div>

          {/* File Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={uploading}
            />
            
            <div className="space-y-2">
              <FileSpreadsheetIcon className="size-8 mx-auto text-muted-foreground" />
              {file ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports Excel (.xlsx, .xls) and CSV files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Import Result */}
          {result && (
            <div className="space-y-3">
              <Alert className={result.success > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">
                      Import Summary
                    </p>
                    <p className="text-xs">
                      {result.success} record(s) imported successfully
                      {result.failed > 0 && `, ${result.failed} record(s) failed`}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircleIcon className="size-5 text-green-600 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-green-800">Success</div>
                    <div className="text-lg font-bold text-green-600">{result.success}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircleIcon className="size-5 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-red-800">Failed</div>
                    <div className="text-lg font-bold text-red-600">{result.failed}</div>
                  </div>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Import Errors</Label>
                    <Button variant="outline" size="sm" onClick={downloadErrors}>
                      <DownloadIcon className="size-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <Alert key={index} className="py-2">
                        <AlertDescription className="text-xs">
                          <span className="font-medium">Row {error.row}:</span> {error.error}
                        </AlertDescription>
                      </Alert>
                    ))}
                    {result.errors.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{result.errors.length - 5} more errors...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={uploading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <LoaderIcon className="size-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <UploadIcon className="size-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// lib/context-api.ts
import { PDFFile, VectorstoreInfo, UploadResponse } from '@/types/context';

const RAG_BASE_URL = process.env.NEXT_PUBLIC_RAG_BASE_URL;

export class ContextAPI {
  // Get all PDF files
  static async getPDFFiles(): Promise<PDFFile[]> {
    const response = await fetch(`${RAG_BASE_URL}/admin/documents/documents/pdfs`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Upload new PDF file
  static async uploadPDF(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${RAG_BASE_URL}/admin/documents/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Delete PDF file
  static async deletePDF(pdfId: string): Promise<{ message: string }> {
    const response = await fetch(`${RAG_BASE_URL}/admin/documents/documents/${pdfId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Process PDF into vectorstore
  static async processPDF(pdfId: string): Promise<{ message: string }> {
    const response = await fetch(`${RAG_BASE_URL}/admin/documents/documents/process-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdf_id: pdfId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Rebuild entire vectorstore
  static async rebuildVectorstore(): Promise<{ message: string }> {
    const response = await fetch(`${RAG_BASE_URL}/admin/documents/documents/rebuild-vectorstore`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get vectorstore info
  static async getVectorstoreInfo(): Promise<VectorstoreInfo> {
    const response = await fetch(`${RAG_BASE_URL}/admin/documents/documents/vectorstore-info`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }
}

// Helper functions
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

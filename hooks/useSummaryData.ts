import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SummaryData {
  overview: {
    total: number;
    recentActivity: number;
    accessLevel: string;
  };
  statusStats: Record<string, number>;
  kategoriStats: Record<string, number>;
  topikStats: Record<string, number>;
  provinsiStats: Record<string, number>;
  keywordStats: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    monthName: string;
    count: number;
  }>;
  unitStats: Array<{
    unit_id: number;
    unit_name: string;
    count: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
    color: string;
  }>;
  charts: {
    statusDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    kategoriDistribution: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    topikDistribution: Array<{
      name: string;
      fullName: string;
      value: number;
      color: string;
    }>;
  };
}

interface FilterParams {
  year?: string | null;
  month?: string | null;
  date?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export function useSummaryData(filterParams?: FilterParams) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummaryData = async (params?: FilterParams) => {
    try {
      setLoading(true);
      setError(null);

      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.year) queryParams.append('year', params.year);
      if (params?.month) queryParams.append('month', params.month);
      if (params?.date) queryParams.append('date', params.date);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);

      const url = `/api/v1/konsultasi/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch summary data: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch summary data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching summary data:', err);
      
      toast.error('Gagal memuat data ringkasan', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = (params?: FilterParams) => {
    fetchSummaryData(params || filterParams);
  };

  useEffect(() => {
    fetchSummaryData(filterParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams?.year, filterParams?.month, filterParams?.date, filterParams?.startDate, filterParams?.endDate]);

  return {
    data,
    loading,
    error,
    refreshData
  };
}

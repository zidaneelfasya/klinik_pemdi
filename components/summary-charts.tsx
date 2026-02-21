import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface ChartData {
  monthlyTrend: Array<{
    month: string;
    monthName: string;
    count: number;
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

interface SummaryChartsProps {
  data: ChartData | null;
  loading: boolean;
  error?: string | null;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-primary">
          Konsultasi: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium capitalize">{payload[0].name}</p>
        <p className="text-sm text-primary">
          Jumlah: {payload[0].value}
        </p>
        <p className="text-xs text-muted-foreground">
          {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export function SummaryCharts({ data, loading, error }: SummaryChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className={i === 0 ? "md:col-span-2" : ""}>
            <CardHeader>
              <Skeleton className="h-5 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              {error || 'Gagal memuat data grafik'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { monthlyTrend, charts } = data;

  // Add total to pie chart data for percentage calculation
  const statusTotal = charts.statusDistribution.reduce((sum, item) => sum + item.value, 0);
  const kategoriTotal = charts.kategoriDistribution.reduce((sum, item) => sum + item.value, 0);
  
  const statusWithTotal = charts.statusDistribution.map(item => ({ ...item, total: statusTotal }));
  const kategoriWithTotal = charts.kategoriDistribution.map(item => ({ ...item, total: kategoriTotal }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Monthly Trend Line Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Tren Konsultasi Bulanan</CardTitle>
          <CardDescription>
            Perkembangan jumlah konsultasi berdasarkan periode yang dipilih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="monthName" 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs fill-muted-foreground"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribusi Status</CardTitle>
          <CardDescription>
            Persentase konsultasi berdasarkan status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusWithTotal}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {statusWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribusi Kategori</CardTitle>
          <CardDescription>
            Persentase konsultasi per kategori SPBE
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={kategoriWithTotal}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {kategoriWithTotal.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Additional monthly comparison chart
export function MonthlyComparisonChart({ data, loading }: SummaryChartsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { monthlyTrend } = data;

  // Calculate month-over-month growth
  const trendWithGrowth = monthlyTrend.map((item, index) => {
    const previousMonth = index > 0 ? monthlyTrend[index - 1] : null;
    const growth = previousMonth ? 
      ((item.count - previousMonth.count) / Math.max(previousMonth.count, 1)) * 100 : 0;
    
    return {
      ...item,
      growth: Math.round(growth)
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Perbandingan Bulanan</CardTitle>
        <CardDescription>
          Jumlah konsultasi dan pertumbuhan month-over-month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={trendWithGrowth}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="monthName" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-3">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-sm text-primary">
                        Konsultasi: {payload[0]?.value}
                      </p>
                      {payload[1] && (
                        <p className="text-sm text-orange-500">
                          Pertumbuhan: {payload[1].value}%
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="count" 
              fill="hsl(var(--primary))"
              name="Jumlah Konsultasi"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey="growth" 
              fill="hsl(var(--orange))"
              name="Pertumbuhan (%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import {
	ResponsiveContainer,
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
	Legend,
	ComposedChart,
	ReferenceLine,
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

export function MonthlyComparisonChart({ data, loading }: SummaryChartsProps) {
	if (loading) {
		return (
			<Card className="md:col-span-2 shadow-sm">
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

	// Calculate discrete MoM growth logic
	const trendWithGrowth = monthlyTrend.map((item, index) => {
		const previousMonth = index > 0 ? monthlyTrend[index - 1] : null;
		
		let momGrowth = 0;
		if (previousMonth) {
			if (previousMonth.count === 0 && item.count > 0) {
				momGrowth = 100;
			} else if (previousMonth.count > 0) {
				momGrowth = ((item.count - previousMonth.count) / previousMonth.count) * 100;
			}
		}

		return {
			...item,
			growth: Math.round(momGrowth),
		};
	});

	return (
		<Card className="md:col-span-2 shadow-sm">
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="text-xl font-bold tracking-tight">
							Perbandingan Bulanan
						</CardTitle>
						<CardDescription className="text-sm">
							Jumlah konsultasi dan pertumbuhan month-over month
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="px-0 sm:px-4">
				<div className="h-[350px] w-full mt-4">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={trendWithGrowth}
							margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
						>
							<CartesianGrid
								strokeDasharray="3 3"
								vertical={false}
								stroke="#f1f5f9"
							/>
							<XAxis
								dataKey="monthName"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#94a3b8", fontSize: 11 }}
								dy={10}
							/>
							{/* Sumbu Kiri - Konsultasi (Dinamis) */}
							<YAxis
								yAxisId="left"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#94a3b8", fontSize: 11 }}
								domain={([dataMin, dataMax]) => {
									const safeMax = isNaN(dataMax) ? 1 : Math.max(dataMax, 1);
									const hasNegatives = (trendWithGrowth || []).some(v => (v.growth || 0) < 0);
									if (!hasNegatives) return [0, safeMax];
									return [-safeMax, safeMax]; 
								}}
								allowDataOverflow={true}
								tickFormatter={(value) => (value < 0 ? "" : value)}
							/>
							{/* Sumbu Kanan - MoM Growth (Dinamis) */}
							<YAxis
								yAxisId="right"
								orientation="right"
								axisLine={false}
								tickLine={false}
								tick={{ fill: "#94a3b8", fontSize: 11 }}
								domain={(() => {
									const hasNegatives = (trendWithGrowth || []).some(v => (v.growth || 0) < 0);
									if (!hasNegatives) return [0, 100];
									return [-100, 100];
								})()}
								tickFormatter={(value) => `${value}%`}
							/>
							<Tooltip
								cursor={{ fill: "#f1f5f9", opacity: 0.5 }}
								content={({ active, payload, label }) => {
									if (active && payload && payload.length) {
										return (
											<div className="bg-white border border-slate-100 shadow-xl rounded-lg p-3">
												<p className="text-xs font-bold text-slate-500 uppercase mb-2">
													{label}
												</p>
												<div className="space-y-1">
													<div className="flex items-center gap-3">
														<div className="w-2 h-2 rounded-full bg-blue-600" />
														<span className="text-sm text-slate-600">
															Jumlah konsultasi:{" "}
															<span className="font-bold">
																{payload[0]?.value}
															</span>
														</span>
													</div>
													<div className="flex items-center gap-3">
														<div className="w-2 h-2 rounded-full bg-slate-950" />
														<span className="text-sm text-slate-600">
															Pertumbuhan:{" "}
															<span className="font-bold">
																{payload[1]?.value}%
															</span>
														</span>
													</div>
												</div>
											</div>
										);
									}
									return null;
								}}
							/>
							<Legend
								verticalAlign="top"
								align="right"
								iconType="circle"
								wrapperStyle={{ paddingBottom: "20px", fontSize: "12px" }}
							/>
							{/* Garis Dasar Nol yang sangat jelas */}
							<ReferenceLine
								yAxisId="right"
								y={0}
								stroke="#94a3b8"
								strokeWidth={1.5}
							/>
							<Bar
								yAxisId="left"
								dataKey="count"
								name="Jumlah konsultasi"
								fill="hsl(var(--primary))"
								radius={[4, 4, 0, 0]}
								barSize={40}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="growth"
								name="Pertumbuhan month-over month"
								stroke="#020617"
								strokeWidth={3}
								dot={{ r: 4, fill: "#020617", strokeWidth: 2, stroke: "#fff" }}
								activeDot={{ r: 6, strokeWidth: 0 }}
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}

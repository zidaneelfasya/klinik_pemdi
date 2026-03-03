"use client";

import React, { useEffect } from "react";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
	ColumnDef,
	ColumnFiltersState,
	Row,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import {
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
	type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
	SortableContext,
	arrayMove,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
	BuildingIcon,
	CheckCircle2Icon,
	CheckIcon,
	ChevronDownIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	ClockIcon,
	ColumnsIcon,
	FileTextIcon,
	FilterIcon,
	FilterXIcon,
	GripVerticalIcon,
	LoaderIcon,
	MoreVerticalIcon,
	PlusIcon,
	RefreshCcw,
	SearchIcon,
	TagIcon,
	UserIcon,
	XIcon,
} from "lucide-react";
import { useData } from "@/app/context/data-context";
import { useUser } from "@/app/context/user-context";
import { ImportModal } from "./import-modal";

export const konsultasiSchema = z.object({
	id: z.number(),
	ticket: z.string().nullable(),
	nama_lengkap: z.string().nullable(),
	jabatan: z.string().nullable(),
	instansi_organisasi: z.string().nullable(),
	asal_kota_kabupaten: z.string().nullable(),
	asal_provinsi: z.string().nullable(),
	nomor_telepon: z.string().nullable(),

	status: z.enum([
		"new",
		"on process",
		"ready to send",
		"konsultasi zoom",
		"done",
		"fu pertanyaan",
		"cancel",
	]),
	kategori: z.enum([
		"tata kelola",
		"infrastruktur",
		"aplikasi",
		"keamanan informasi",
		"SDM",
	]),
	pic_name: z.string().nullable(),
	skor_indeks_spbe: z.number().nullable(),
	uraian_kebutuhan_konsultasi: z.string().nullable(),
	solusi: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	units: z
		.array(
			z.object({
				unit_id: z.number(),
				unit_name: z.string().nullable(),
				unit_pic_name: z.string().nullable(),
			})
		)
		.optional(),
	topics: z
		.array(
			z.object({
				topik_id: z.number(),
				topik_name: z.string().nullable(),
			})
		)
		.optional(),
});

type KonsultasiData = z.infer<typeof konsultasiSchema>;

// Filter Components
interface FilterOption {
	value: string;
	label: string;
	icon?: React.ReactNode;
}

// Search Input Component
function SearchFilter({
	globalFilter,
	setGlobalFilter,
}: {
	globalFilter: string;
	setGlobalFilter: (value: string) => void;
}) {
	const [localValue, setLocalValue] = React.useState(globalFilter);

	// Debounce search input
	React.useEffect(() => {
		const timer = setTimeout(() => {
			setGlobalFilter(localValue);
		}, 500);

		return () => clearTimeout(timer);
	}, [localValue, setGlobalFilter]);

	// Update local value when globalFilter changes externally
	React.useEffect(() => {
		setLocalValue(globalFilter);
	}, [globalFilter]);

	return (
		<div className="relative">
			<SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
			<Input
				placeholder="Cari nama, instansi, asal daerah, atau ticket..."
				value={localValue}
				onChange={(event) => setLocalValue(event.target.value)}
				className="pl-10 pr-10 w-96"
			/>
			{localValue && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								setLocalValue("");
								setGlobalFilter("");
							}}
							className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
						>
							<FilterXIcon className="size-3" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Hapus pencarian</p>
					</TooltipContent>
				</Tooltip>
			)}
		</div>
	);
}

// Category Filter Component
function CategoryFilter({ table }: { table: any }) {
	const categoryOptions: FilterOption[] = [
		{
			value: "tata kelola",
			label: "Tata Kelola",
			icon: <TagIcon className="size-4" />,
		},
		{
			value: "infrastruktur",
			label: "Infrastruktur",
			icon: <TagIcon className="size-4" />,
		},
		{
			value: "aplikasi",
			label: "Aplikasi",
			icon: <TagIcon className="size-4" />,
		},
		{
			value: "keamanan informasi",
			label: "Keamanan Informasi",
			icon: <TagIcon className="size-4" />,
		},
		{ value: "SDM", label: "SDM", icon: <TagIcon className="size-4" /> },
	];

	const categoryFilter =
		(table.getColumn("kategori")?.getFilterValue() as string[]) ?? [];

	const handleCategoryChange = (categoryValue: string, checked: boolean) => {
		const currentFilter =
			(table.getColumn("kategori")?.getFilterValue() as string[]) ?? [];
		if (checked) {
			table
				.getColumn("kategori")
				?.setFilterValue([...currentFilter, categoryValue]);
		} else {
			table
				.getColumn("kategori")
				?.setFilterValue(
					currentFilter.filter((value: string) => value !== categoryValue)
				);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={categoryFilter.length > 0 ? "default" : "outline"}
					size="sm"
					className="gap-1"
				>
					<TagIcon className="size-4" />
					Kategori
					{categoryFilter.length > 0 && (
						<>
							<Badge
								variant="secondary"
								className="ml-1 text-xs bg-background/20 text-foreground"
							>
								{categoryFilter.length}
							</Badge>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										onClick={(e) => {
											e.stopPropagation();
											table.getColumn("kategori")?.setFilterValue([]);
										}}
										className="ml-1  p-0 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center cursor-pointer rounded-sm"
									></span>
								</TooltipTrigger>
							</Tooltip>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="start" className="w-56">
				{categoryOptions.map((option) => (
					<DropdownMenuCheckboxItem
						key={option.value}
						checked={categoryFilter.includes(option.value)}
						onCheckedChange={(checked) =>
							handleCategoryChange(option.value, checked)
						}
					>
						<div className="flex items-center gap-2">
							{option.icon}
							<span>{option.label}</span>
						</div>
					</DropdownMenuCheckboxItem>
				))}
				{categoryFilter.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => table.getColumn("kategori")?.setFilterValue([])}
						>
							<FilterXIcon className="size-4 mr-2" />
							Clear Filter
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// Status Filter Component
function StatusFilter({ table }: { table: any }) {
	const statusOptions: FilterOption[] = [
		{ value: "new", label: "New", icon: <ClockIcon className="size-4" /> },
		{
			value: "on process",
			label: "On Process",
			icon: <LoaderIcon className="size-4" />,
		},
		{
			value: "ready to send",
			label: "Ready to Send",
			icon: <ClockIcon className="size-4" />,
		},
		{
			value: "konsultasi zoom",
			label: "Konsultasi Zoom",
			icon: <ClockIcon className="size-4" />,
		},
		{
			value: "done",
			label: "Done",
			icon: <CheckCircle2Icon className="size-4" />,
		},
		{
			value: "fu pertanyaan",
			label: "FU Pertanyaan",
			icon: <ClockIcon className="size-4" />,
		},
		{
			value: "cancel",
			label: "Cancel",
			icon: <ClockIcon className="size-4" />,
		},
	];

	const statusFilter =
		(table.getColumn("status")?.getFilterValue() as string[]) ?? [];

	const handleStatusChange = (statusValue: string, checked: boolean) => {
		const currentFilter =
			(table.getColumn("status")?.getFilterValue() as string[]) ?? [];
		if (checked) {
			table
				.getColumn("status")
				?.setFilterValue([...currentFilter, statusValue]);
		} else {
			table
				.getColumn("status")
				?.setFilterValue(
					currentFilter.filter((value: string) => value !== statusValue)
				);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={statusFilter.length > 0 ? "default" : "outline"}
					size="sm"
					className="gap-1"
				>
					<ClockIcon className="size-4" />
					Status
					{statusFilter.length > 0 && (
						<>
							<Badge
								variant="secondary"
								className="ml-1 text-xs bg-background/20 text-foreground"
							>
								{statusFilter.length}
							</Badge>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										onClick={(e) => {
											e.stopPropagation();
											table.getColumn("status")?.setFilterValue([]);
										}}
										className="ml-1 p-0 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center cursor-pointer rounded-sm"
									></span>
								</TooltipTrigger>
							</Tooltip>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				{statusOptions.map((option) => (
					<DropdownMenuCheckboxItem
						key={option.value}
						checked={statusFilter.includes(option.value)}
						onCheckedChange={(checked) =>
							handleStatusChange(option.value, checked)
						}
					>
						<div className="flex items-center gap-2">
							{option.icon}
							<span>{option.label}</span>
						</div>
					</DropdownMenuCheckboxItem>
				))}
				{statusFilter.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => table.getColumn("status")?.setFilterValue([])}
						>
							<FilterXIcon className="size-4 mr-2" />
							Clear Filter
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// Unit Filter Component
function UnitFilter({ table }: { table: any }) {
	const { unitList } = useData();
	const unitFilter =
		(table.getColumn("units")?.getFilterValue() as number[]) ?? [];

	const handleUnitChange = (unitId: number, checked: boolean) => {
		const currentFilter =
			(table.getColumn("units")?.getFilterValue() as number[]) ?? [];
		if (checked) {
			table.getColumn("units")?.setFilterValue([...currentFilter, unitId]);
		} else {
			table
				.getColumn("units")
				?.setFilterValue(currentFilter.filter((id: number) => id !== unitId));
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant={unitFilter.length > 0 ? "default" : "outline"}
					size="sm"
					className="gap-1"
				>
					<BuildingIcon className="size-4" />
					Unit
					{unitFilter.length > 0 && (
						<>
							<Badge
								variant="secondary"
								className="ml-1 text-xs bg-background/20 text-foreground"
							>
								{unitFilter.length}
							</Badge>
							<Tooltip>
								<TooltipTrigger asChild>
									<span
										onClick={(e) => {
											e.stopPropagation();
											table.getColumn("units")?.setFilterValue([]);
										}}
										className="ml-1 p-0 hover:bg-destructive/20 hover:text-destructive flex items-center justify-center cursor-pointer rounded-sm"
									>
										<FilterXIcon className="size-3" />
									</span>
								</TooltipTrigger>
								<TooltipContent>
									<p>Hapus filter unit</p>
								</TooltipContent>
							</Tooltip>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-64 max-h-80 overflow-y-auto"
			>
				{unitList.map((unit) => (
					<DropdownMenuCheckboxItem
						key={unit.id}
						checked={unitFilter.includes(unit.id)}
						onCheckedChange={(checked) => handleUnitChange(unit.id, checked)}
					>
						<div className="flex flex-col items-start">
							<span className="text-sm font-medium">{unit.nama_unit}</span>
							{unit.nama_pic && (
								<span className="text-xs text-muted-foreground">
									PIC: {unit.nama_pic}
								</span>
							)}
						</div>
					</DropdownMenuCheckboxItem>
				))}
				{unitFilter.length > 0 && (
					<>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => table.getColumn("units")?.setFilterValue([])}
						>
							<FilterXIcon className="size-4 mr-2" />
							Clear Filter
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// Filter Summary Component
function FilterSummary({
	table,
	globalFilter,
	setGlobalFilter,
}: {
	table: any;
	globalFilter: string;
	setGlobalFilter: (value: string) => void;
}) {
	const categoryFilter =
		(table.getColumn("kategori")?.getFilterValue() as string[]) ?? [];
	const statusFilter =
		(table.getColumn("status")?.getFilterValue() as string[]) ?? [];
	const unitFilter =
		(table.getColumn("units")?.getFilterValue() as number[]) ?? [];

	const hasActiveFilters =
		globalFilter ||
		categoryFilter.length > 0 ||
		statusFilter.length > 0 ||
		unitFilter.length > 0;

	if (!hasActiveFilters) return null;

	return (
		<div className="flex flex-wrap gap-2 px-4 py-2 bg-muted/30 border-b">
			<span className="text-sm font-medium text-muted-foreground">
				Filter aktif:
			</span>

			{globalFilter && (
				<Badge variant="outline" className="gap-1">
					<SearchIcon className="size-3" />
					Pencarian: "{globalFilter}"
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setGlobalFilter("")}
						className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive"
					>
						<FilterXIcon className="size-3" />
					</Button>
				</Badge>
			)}

			{categoryFilter.length > 0 && (
				<Badge variant="outline" className="gap-1">
					<TagIcon className="size-3" />
					Kategori: {categoryFilter.length} dipilih
					<Button
						variant="ghost"
						size="sm"
						onClick={() => table.getColumn("kategori")?.setFilterValue([])}
						className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive"
					>
						<FilterXIcon className="size-3" />
					</Button>
				</Badge>
			)}

			{statusFilter.length > 0 && (
				<Badge variant="outline" className="gap-1">
					<ClockIcon className="size-3" />
					Status: {statusFilter.length} dipilih
					<Button
						variant="ghost"
						size="sm"
						onClick={() => table.getColumn("status")?.setFilterValue([])}
						className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive"
					>
						<FilterXIcon className="size-3" />
					</Button>
				</Badge>
			)}

			{unitFilter.length > 0 && (
				<Badge variant="outline" className="gap-1">
					<BuildingIcon className="size-3" />
					Unit: {unitFilter.length} dipilih
					<Button
						variant="ghost"
						size="sm"
						onClick={() => table.getColumn("units")?.setFilterValue([])}
						className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20 hover:text-destructive"
					>
						<FilterXIcon className="size-3" />
					</Button>
				</Badge>
			)}
		</div>
	);
}

// Combined Filter Bar Component
function FilterBar({
	table,
	globalFilter,
	setGlobalFilter,
	totalCount,
	loading,
}: {
	table: any;
	globalFilter: string;
	setGlobalFilter: (value: string) => void;
	totalCount: number;
	loading: boolean;
}) {
	const hasFilters =
		(table.getColumn("kategori")?.getFilterValue() as string[])?.length > 0 ||
		(table.getColumn("status")?.getFilterValue() as string[])?.length > 0 ||
		(table.getColumn("units")?.getFilterValue() as number[])?.length > 0 ||
		globalFilter;

	const clearAllFilters = () => {
		table.getColumn("kategori")?.setFilterValue([]);
		table.getColumn("status")?.setFilterValue([]);
		table.getColumn("units")?.setFilterValue([]);
		setGlobalFilter("");
	};

	return (
		<div className="flex items-center justify-between gap-4 p-4 border-b">
			<div className="flex items-center gap-4 flex-1">
				<SearchFilter
					globalFilter={globalFilter}
					setGlobalFilter={setGlobalFilter}
				/>
				<div className="flex items-center gap-2">
					<CategoryFilter table={table} />
					<StatusFilter table={table} />
					<UnitFilter table={table} />
				</div>
				{hasFilters && (
					<Button
						variant="ghost"
						size="sm"
						onClick={clearAllFilters}
						className="gap-1"
						disabled={loading}
					>
						<FilterXIcon className="size-4" />
						Clear All
					</Button>
				)}
			</div>
			<div className="flex items-center gap-2">
				{loading ? (
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<LoaderIcon className="size-4 animate-spin" />
						Memuat...
					</div>
				) : (
					<span className="text-sm text-muted-foreground">
						{totalCount} total hasil
					</span>
				)}
			</div>
		</div>
	);
}

// Interface for PIC data
interface PICData {
	id: number;
	nama_pic: string;
}

// Interface for Unit data
interface UnitData {
	id: number;
	nama_unit: string;
	nama_pic: string | null;
}

// PIC Selector Component
function PICSelector({
	konsultasiId,
	currentPicName,
	onUpdate,
}: {
	konsultasiId: number;
	currentPicName: string | null;
	onUpdate: (newPicName: string | null) => void;
}) {
	const { picList, loading } = useData();
	const [updating, setUpdating] = React.useState(false);

	const handlePicChange = async (selectedPicId: string) => {
		// Handle "null" case for unassigning PIC
		if (selectedPicId === "null") {
			setUpdating(true);
			const loadingToast = toast.loading("Menghapus PIC assignment...");

			try {
				const response = await fetch("/api/v1/konsultasi", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						id: konsultasiId,
						pic_id: null,
					}),
				});

				if (!response.ok) throw new Error("Failed to remove PIC");

				const result = await response.json();
				if (result.success) {
					onUpdate(null);

					toast.dismiss(loadingToast);
					toast.success("PIC assignment berhasil dihapus!", {
						description: `Konsultasi #${konsultasiId} sekarang belum memiliki PIC`,
						duration: 4000,
					});
				} else {
					throw new Error(result.message || "Update failed");
				}
			} catch (error) {
				console.error("Error removing PIC:", error);

				toast.dismiss(loadingToast);
				toast.error("Gagal menghapus PIC assignment", {
					description:
						error instanceof Error
							? error.message
							: "Terjadi kesalahan saat menghapus PIC",
					duration: 4000,
				});
			} finally {
				setUpdating(false);
			}
			return;
		}

		// Handle selecting a specific PIC
		const selectedPic = picList.find(
			(pic) => pic.id.toString() === selectedPicId
		);
		if (!selectedPic) return;

		setUpdating(true);

		// Show loading toast
		const loadingToast = toast.loading(
			`Mengupdate PIC ke ${selectedPic.nama_pic}...`
		);

		try {
			const response = await fetch("/api/v1/konsultasi", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: konsultasiId,
					pic_id: selectedPic.id,
				}),
			});

			if (!response.ok) throw new Error("Failed to update PIC");

			const result = await response.json();
			if (result.success) {
				onUpdate(selectedPic.nama_pic);

				// Dismiss loading toast and show success
				toast.dismiss(loadingToast);
				toast.success(`PIC berhasil diupdate ke ${selectedPic.nama_pic}!`, {
					description: `Konsultasi #${konsultasiId} sekarang ditangani oleh ${selectedPic.nama_pic}`,
					duration: 4000,
				});
			} else {
				throw new Error(result.message || "Update failed");
			}
		} catch (error) {
			console.error("Error updating PIC:", error);

			// Dismiss loading toast and show error
			toast.dismiss(loadingToast);
			toast.error("Gagal mengupdate PIC", {
				description:
					error instanceof Error
						? error.message
						: "Terjadi kesalahan saat mengupdate PIC",
				duration: 4000,
			});
		} finally {
			setUpdating(false);
		}
	};

	return (
		<Select onValueChange={handlePicChange} disabled={updating || loading}>
			<SelectTrigger className="h-8 w-full border-transparent bg-transparent hover:bg-muted/30 focus:border focus:bg-background">
				<div className="flex items-center gap-1">
					<UserIcon className="size-3 text-muted-foreground" />
					<span className="text-sm">
						{loading ? "Loading..." : currentPicName || "Pilih PIC"}
					</span>
				</div>
			</SelectTrigger>
			<SelectContent>
				{loading ? (
					<div className="p-2 text-sm text-muted-foreground">
						Memuat daftar PIC...
					</div>
				) : (
					<>
						<SelectItem value="null">Belum ditentukan</SelectItem>
						{picList.map((pic) => (
							<SelectItem key={pic.id} value={pic.id.toString()}>
								<div className="flex items-center gap-2">
									<UserIcon className="size-4" />
									{pic.nama_pic}
								</div>
							</SelectItem>
						))}
					</>
				)}
			</SelectContent>
		</Select>
	);
}

// Status Selector Component
function StatusSelector({
	konsultasiId,
	currentStatus,
	onUpdate,
}: {
	konsultasiId: number;
	currentStatus: string;
	onUpdate: (newStatus: string) => void;
}) {
	const [updating, setUpdating] = React.useState(false);

	const statusOptions = [
		{ value: "new", label: "New", icon: <ClockIcon className="size-3" /> },
		{
			value: "on process",
			label: "On Process",
			icon: <LoaderIcon className="size-3 animate-spin" />,
		},
		{
			value: "ready to send",
			label: "Ready to Send",
			icon: <ClockIcon className="size-3" />,
		},
		{
			value: "konsultasi zoom",
			label: "Konsultasi Zoom",
			icon: <ClockIcon className="size-3" />,
		},
		{
			value: "done",
			label: "Done",
			icon: <CheckCircle2Icon className="size-3" />,
		},
		{
			value: "fu pertanyaan",
			label: "FU Pertanyaan",
			icon: <ClockIcon className="size-3" />,
		},
		{
			value: "cancel",
			label: "Cancel",
			icon: <ClockIcon className="size-3" />,
		},
	];

	const handleStatusChange = async (newStatus: string) => {
		if (newStatus === currentStatus) return;

		setUpdating(true);
		const loadingToast = toast.loading(`Mengupdate status ke ${newStatus}...`);

		try {
			const response = await fetch("/api/v1/konsultasi", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: konsultasiId,
					status: newStatus,
				}),
			});

			if (!response.ok) throw new Error("Failed to update status");

			const result = await response.json();
			if (result.success) {
				onUpdate(newStatus);

				toast.dismiss(loadingToast);
				toast.success(`Status berhasil diupdate ke ${newStatus}!`, {
					description: `Konsultasi #${konsultasiId} sekarang berstatus ${newStatus}`,
					duration: 4000,
				});
			} else {
				throw new Error(result.message || "Update failed");
			}
		} catch (error) {
			console.error("Error updating status:", error);

			toast.dismiss(loadingToast);
			toast.error("Gagal mengupdate status", {
				description:
					error instanceof Error
						? error.message
						: "Terjadi kesalahan saat mengupdate status",
				duration: 4000,
			});
		} finally {
			setUpdating(false);
		}
	};

	const currentStatusOption = statusOptions.find(
		(option) => option.value === currentStatus
	);

	return (
		<Select
			onValueChange={handleStatusChange}
			disabled={updating}
			value={currentStatus}
		>
			<SelectTrigger className="h-8 w-full border-transparent bg-transparent hover:bg-muted/30 focus:border focus:bg-background">
				<Badge
					variant="outline"
					className={`flex gap-1 px-2 py-1 text-xs capitalize ${getStatusColor(
						currentStatus
					)}`}
				>
					{currentStatusOption?.icon}
					{currentStatus}
				</Badge>
			</SelectTrigger>
			<SelectContent>
				{statusOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						<div className="flex items-center gap-2">
							{option.icon}
							<span className="capitalize">{option.label}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

// Category Selector Component
function CategorySelector({
	konsultasiId,
	currentCategory,
	onUpdate,
}: {
	konsultasiId: number;
	currentCategory: string;
	onUpdate: (newCategory: string) => void;
}) {
	const [updating, setUpdating] = React.useState(false);

	const categoryOptions = [
		{ value: "tata kelola", label: "Tata Kelola" },
		{ value: "infrastruktur", label: "Infrastruktur" },
		{ value: "aplikasi", label: "Aplikasi" },
		{ value: "keamanan informasi", label: "Keamanan Informasi" },
		{ value: "SDM", label: "SDM" },
	];

	const handleCategoryChange = async (newCategory: string) => {
		if (newCategory === currentCategory) return;

		setUpdating(true);
		const loadingToast = toast.loading(
			`Mengupdate kategori ke ${newCategory}...`
		);

		try {
			const response = await fetch("/api/v1/konsultasi", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: konsultasiId,
					kategori: newCategory,
				}),
			});

			if (!response.ok) throw new Error("Failed to update category");

			const result = await response.json();
			if (result.success) {
				onUpdate(newCategory);

				toast.dismiss(loadingToast);
				toast.success(`Kategori berhasil diupdate ke ${newCategory}!`, {
					description: `Konsultasi #${konsultasiId} sekarang berkategori ${newCategory}`,
					duration: 4000,
				});
			} else {
				throw new Error(result.message || "Update failed");
			}
		} catch (error) {
			console.error("Error updating category:", error);

			toast.dismiss(loadingToast);
			toast.error("Gagal mengupdate kategori", {
				description:
					error instanceof Error
						? error.message
						: "Terjadi kesalahan saat mengupdate kategori",
				duration: 4000,
			});
		} finally {
			setUpdating(false);
		}
	};

	return (
		<Select
			onValueChange={handleCategoryChange}
			disabled={updating}
			value={currentCategory}
		>
			<SelectTrigger className="h-8 w-full border-transparent bg-transparent hover:bg-muted/30 focus:border focus:bg-background">
				<Badge
					variant="outline"
					className={`px-2 py-1 text-xs capitalize ${getCategoryColor(
						currentCategory
					)}`}
				>
					<TagIcon className="size-3 mr-1" />
					{currentCategory}
				</Badge>
			</SelectTrigger>
			<SelectContent>
				{categoryOptions.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						<div className="flex items-center gap-2">
							<TagIcon className="size-4" />
							<span className="capitalize">{option.label}</span>
						</div>
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
	const { attributes, listeners } = useSortable({
		id,
	});

	return (
		<Button
			{...attributes}
			{...listeners}
			variant="ghost"
			size="icon"
			className="size-6 h-6 w-6 p-0 text-muted-foreground hover:bg-transparent"
		>
			{/* <GripVerticalIcon className="size-3 text-muted-foreground" /> */}
			<span className="sr-only">Drag to reorder</span>
		</Button>
	);
}

// ===============================
// URAIAN KEBUTUHAN DISPLAY
// ===============================
function UraianKebutuhanDisplay({
	konsultasiId,
	uraianKebutuhan,
	currentSolusi,
	onSolusiUpdate,
}: {
	konsultasiId: number;
	uraianKebutuhan: string | null;
	currentSolusi: string | null;
	onSolusiUpdate: (newSolusi: string | null) => void;
}) {
	const [isDialogOpen, setIsDialogOpen] = React.useState(false);
	const [editValue, setEditValue] = React.useState(currentSolusi || "");
	const [updating, setUpdating] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(false);

	const handleSave = async () => {
		if (editValue === currentSolusi) {
			setIsDialogOpen(false);
			return;
		}

		setUpdating(true);
		const loadingToast = toast.loading("Menyimpan solusi...");

		try {
			const response = await fetch("/api/v1/konsultasi", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: konsultasiId,
					solusi: editValue || null,
				}),
			});

			if (!response.ok) throw new Error("Failed to update solusi");

			const result = await response.json();
			if (result.success) {
				onSolusiUpdate(editValue || null);
				setIsDialogOpen(false);

				toast.dismiss(loadingToast);
				toast.success("Solusi berhasil disimpan!", {
					description: `Konsultasi #${konsultasiId} telah diperbarui`,
				});
			} else {
				throw new Error(result.message || "Update failed");
			}
		} catch (error) {
			toast.dismiss(loadingToast);
			toast.error("Gagal menyimpan solusi");
		} finally {
			setUpdating(false);
		}
	};

	const handleCancel = () => {
		setEditValue(currentSolusi || "");
		setIsDialogOpen(false);
	};

	return (
		<div className="max-w-[320px] w-full space-y-3">

			{/* STATUS BADGE */}
			<div className="flex items-center justify-between w-full">
				<span
					className={`text-xs px-2 py-1 rounded-full font-medium ${currentSolusi
							? "bg-green-100 text-green-700"
							: "bg-yellow-100 text-yellow-700"
						}`}
				>
					{currentSolusi ? "Sudah Ada Solusi" : "Belum Ada Solusi"}
				</span>
			</div>

			{/* URAIAN */}
			<div>
				{uraianKebutuhan ? (
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="text-left hover:bg-muted/30 rounded px-2 py-1 transition-colors w-full"
					>
						<div
							className={`text-sm text-muted-foreground leading-relaxed ${isExpanded
									? "whitespace-pre-wrap break-words"
									: "line-clamp-3"
								}`}
						>
							{uraianKebutuhan}
						</div>
					</button>
				) : (
					<div className="text-sm text-muted-foreground italic">
						Uraian kebutuhan belum tersedia
					</div>
				)}
			</div>

			{/* RINGKASAN SOLUSI */}
			{currentSolusi && (
				<div className="text-xs text-muted-foreground bg-muted p-2 rounded line-clamp-2">
					{currentSolusi}
				</div>
			)}

			{/* BUTTON EDIT / TAMBAH */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setEditValue(currentSolusi || "")}
						className="h-7 px-3"
					>
						<FileTextIcon className="size-3 mr-1" />
						{currentSolusi ? "Edit Solusi" : "Tambah Solusi"}
					</Button>
				</DialogTrigger>

				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Input Solusi Konsultasi</DialogTitle>
						<DialogDescription>
							Konsultasi #{konsultasiId}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4">
						<div>
							<Label className="text-sm font-medium">
								Uraian Kebutuhan
							</Label>
							<div className="text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap max-h-32 overflow-y-auto">
								{uraianKebutuhan || "Belum tersedia"}
							</div>
						</div>

						<div>
							<Label htmlFor="solusi" className="text-sm font-medium">
								Solusi
							</Label>
							<Textarea
								id="solusi"
								value={editValue}
								onChange={(e) => setEditValue(e.target.value)}
								className="min-h-[150px] resize-none"
								disabled={updating}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleCancel}
							disabled={updating}
						>
							Batal
						</Button>
						<Button
							onClick={handleSave}
							disabled={updating || editValue === currentSolusi}
						>
							{updating ? (
								<LoaderIcon className="size-4 animate-spin mr-2" />
							) : (
								<CheckIcon className="size-4 mr-2" />
							)}
							Simpan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}


// ===============================
// SOLUSI EDITOR (TABLE VERSION)
// ===============================
function SolusiEditor({
	konsultasiId,
	currentSolusi,
	onUpdate,
}: {
	konsultasiId: number;
	currentSolusi: string | null;
	onUpdate: (newSolusi: string | null) => void;
}) {
	const [isEditing, setIsEditing] = React.useState(false);
	const [editValue, setEditValue] = React.useState(currentSolusi || "");
	const [updating, setUpdating] = React.useState(false);
	const [isExpanded, setIsExpanded] = React.useState(false);

	const handleSave = async () => {
		if (editValue === currentSolusi) {
			setIsEditing(false);
			return;
		}

		setUpdating(true);
		const loadingToast = toast.loading("Menyimpan solusi...");

		try {
			const response = await fetch("/api/v1/konsultasi", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: konsultasiId,
					solusi: editValue || null,
				}),
			});

			const result = await response.json();
			if (result.success) {
				onUpdate(editValue || null);
				setIsEditing(false);
				toast.dismiss(loadingToast);
				toast.success("Solusi berhasil disimpan!");
			}
		} catch {
			toast.dismiss(loadingToast);
			toast.error("Gagal menyimpan solusi");
		} finally {
			setUpdating(false);
		}
	};

	if (isEditing) {
		return (
			<div className="space-y-2 max-w-[200px]">
				<Textarea
					value={editValue}
					onChange={(e) => setEditValue(e.target.value)}
					className="min-h-[120px] resize-none"
				/>
				<div className="flex gap-2">
					<Button size="sm" onClick={handleSave} disabled={updating}>
						Simpan
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={() => setIsEditing(false)}
					>
						Batal
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2 max-w-[200px]">

			{/* STATUS */}
			<span
				className={`text-xs px-2 py-1 rounded-full font-medium ${currentSolusi
						? "bg-green-100 text-green-700"
						: "bg-yellow-100 text-yellow-700"
					}`}
			>
				{currentSolusi ? "Sudah Ada Solusi" : "Belum Ada Solusi"}
			</span>

			{currentSolusi ? (
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					onDoubleClick={() => setIsEditing(true)}
					className="text-left hover:bg-muted/30 rounded px-2 py-1 w-full"
				>
					<div
						className={`text-sm text-muted-foreground ${isExpanded ? "whitespace-pre-wrap" : "line-clamp-3"
							}`}
					>
						{currentSolusi}
					</div>
				</button>
			) : (
				<Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
					Tambah Solusi
				</Button>
			)}
		</div>
	);
}

// Unit Selector Component
function UnitSelector({
	konsultasiId,
	currentUnits,
	onUpdate,
}: {
	konsultasiId: number;
	currentUnits: Array<{
		unit_id: number;
		unit_name: string | null;
		unit_pic_name: string | null;
	}>;
	onUpdate: (
		newUnits: Array<{
			unit_id: number;
			unit_name: string | null;
			unit_pic_name: string | null;
		}>
	) => void;
}) {
	const { unitList, loading } = useData();
	const [updating, setSaving] = React.useState(false);
	const [isOpen, setIsOpen] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [isEditing, setIsEditing] = React.useState(false);
	const [selectedUnits, setSelectedUnits] = React.useState(currentUnits);

	// Get currently selected unit IDs from the editing state
	const selectedUnitIds = React.useMemo(
		() => new Set(selectedUnits.map((unit) => unit.unit_id)),
		[selectedUnits]
	);

	// Filter units based on search query
	const filteredUnits = React.useMemo(
		() =>
			unitList.filter((unit) =>
				unit.nama_unit.toLowerCase().includes(searchQuery.toLowerCase())
			),
		[unitList, searchQuery]
	);

	// Update selectedUnits when currentUnits changes
	React.useEffect(() => {
		setSelectedUnits(currentUnits);
	}, [currentUnits]);

	const handleUnitToggle = (unit: UnitData) => {
		const isSelected = selectedUnitIds.has(unit.id);
		let newUnits: Array<{
			unit_id: number;
			unit_name: string | null;
			unit_pic_name: string | null;
		}>;

		if (isSelected) {
			// Remove unit
			newUnits = selectedUnits.filter((u) => u.unit_id !== unit.id);
		} else {
			// Add unit
			newUnits = [
				...selectedUnits,
				{
					unit_id: unit.id,
					unit_name: unit.nama_unit,
					unit_pic_name: unit.nama_pic || null,
				},
			];
		}

		setSelectedUnits(newUnits);
	};

	const handleRemoveUnit = (unitId: number) => {
		const newUnits = selectedUnits.filter((u) => u.unit_id !== unitId);
		setSelectedUnits(newUnits);
	};

	const handleSave = async () => {
		setSaving(true);
		const loadingToast = toast.loading("Menyimpan unit penanggung jawab...");

		try {
			// Get unit IDs for API call
			const unitIds = selectedUnits.map((unit) => unit.unit_id);

			const response = await fetch("/api/v1/konsultasi/units", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					konsultasi_id: konsultasiId,
					unit_ids: unitIds,
				}),
			});

			if (!response.ok) throw new Error("Failed to update units");

			const result = await response.json();
			if (result.success) {
				onUpdate(selectedUnits);
				setIsEditing(false);
				setIsOpen(false);

				toast.dismiss(loadingToast);
				toast.success("Unit penanggung jawab berhasil disimpan!", {
					description: `Konsultasi #${konsultasiId} sekarang memiliki ${selectedUnits.length} unit penanggung jawab`,
					duration: 4000,
				});
			} else {
				throw new Error(result.message || "Update failed");
			}
		} catch (error) {
			console.error("Error updating units:", error);

			toast.dismiss(loadingToast);
			toast.error("Gagal menyimpan unit penanggung jawab", {
				description:
					error instanceof Error
						? error.message
						: "Terjadi kesalahan saat menyimpan unit",
				duration: 4000,
			});
		} finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		setSelectedUnits(currentUnits);
		setIsEditing(false);
		setIsOpen(false);
		setSearchQuery("");
	};

	const handleEdit = () => {
		setIsEditing(true);
		setIsOpen(true);
	};

	const hasChanges = React.useMemo(() => {
		if (currentUnits.length !== selectedUnits.length) return true;

		const currentIds = new Set(currentUnits.map((u) => u.unit_id));
		const selectedIds = new Set(selectedUnits.map((u) => u.unit_id));

		return (
			currentUnits.some((u) => !selectedIds.has(u.unit_id)) ||
			selectedUnits.some((u) => !currentIds.has(u.unit_id))
		);
	}, [currentUnits, selectedUnits]);

	return (
		<div className="w-full relative">
			{/* Display selected units as chips */}
			{currentUnits.length > 0 && !isEditing && (
				<div className="flex flex-wrap gap-1 mb-2">
					{currentUnits.slice(0, 2).map((unit) => (
						<Badge
							key={unit.unit_id}
							variant="secondary"
							className="text-xs px-2 py-1 flex items-center gap-1"
						>
							{unit.unit_name}
							{isEditing && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleRemoveUnit(unit.unit_id);
									}}
									disabled={updating}
									className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
								>
									<XIcon className="size-2" />
								</button>
							)}
						</Badge>
					))}
				</div>
			)}

			{/* Show editing units when in editing mode */}
			{isEditing && selectedUnits.length > 0 && (
				<div className="flex flex-wrap gap-1 mb-2 p-2 bg-muted/30 rounded border-dashed border-2 border-muted">
					<div className="text-xs text-muted-foreground w-full mb-1">
						Preview:
					</div>
					{selectedUnits.map((unit) => (
						<Badge
							key={unit.unit_id}
							variant="outline"
							className="text-xs px-2 py-1 flex items-center gap-1"
						>
							{unit.unit_name}
							<button
								onClick={(e) => {
									e.stopPropagation();
									handleRemoveUnit(unit.unit_id);
								}}
								disabled={updating}
								className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
							>
								<XIcon className="size-2" />
							</button>
						</Badge>
					))}
				</div>
			)}

			{/* Dropdown for selecting units */}
			{isEditing ? (
				<div className="space-y-2">
					<Select open={isOpen} onOpenChange={setIsOpen}>
						<SelectTrigger className="h-8 w-full border-transparent bg-transparent hover:bg-muted/30 focus:border focus:bg-background">
							<div className="flex items-center gap-1 w-full whitespace-nowrap">
								<UserIcon className="size-3 text-muted-foreground flex-shrink-0" />
								<span className="text-sm normal-case flex-1 min-w-0">
									{selectedUnits.length > 2
										? `+${selectedUnits.length - 2} unit lainnya`
										: "Pilih Unit"}
								</span>
							</div>
						</SelectTrigger>
						<SelectContent className="w-64">
							{/* Search input */}
							<div className="px-2 py-2">
								<Input
									placeholder="Cari unit..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-8 text-sm"
								/>
							</div>

							{loading ? (
								<div className="p-2 text-sm text-muted-foreground">
									Memuat daftar unit...
								</div>
							) : filteredUnits.length === 0 ? (
								<div className="p-2 text-sm text-muted-foreground">
									{searchQuery
										? "Tidak ada unit yang cocok"
										: "Tidak ada unit tersedia"}
								</div>
							) : (
								<div className="max-h-48 overflow-y-auto">
									{filteredUnits.map((unit) => {
										const isSelected = selectedUnitIds.has(unit.id);
										return (
											<div
												key={unit.id}
												className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-accent rounded-sm"
												onClick={() => handleUnitToggle(unit)}
											>
												<div
													className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected
														? "bg-primary border-primary"
														: "border-muted-foreground"
														}`}
												>
													{isSelected && (
														<CheckIcon className="size-3 text-primary-foreground" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="text-sm font-medium truncate">
														{unit.nama_unit}
													</div>
													{unit.nama_pic && (
														<div className="text-xs text-muted-foreground truncate">
															PIC: {unit.nama_pic}
														</div>
													)}
												</div>
											</div>
										);
									})}
								</div>
							)}
						</SelectContent>
					</Select>

					{/* Save and Cancel buttons */}
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							onClick={handleSave}
							disabled={updating || !hasChanges}
							className="h-7 px-3"
						>
							{updating ? (
								<LoaderIcon className="size-3 animate-spin" />
							) : (
								<CheckIcon className="size-3" />
							)}
							Simpan
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleCancel}
							disabled={updating}
							className="h-7 px-3"
						>
							<XIcon className="size-3" />
							Batal
						</Button>
					</div>
				</div>
			) : (
				<button
					onClick={handleEdit}
					className="flex h-8 w-full items-center justify-between whitespace-nowrap rounded-md border border-transparent bg-transparent px-2 py-2 text-sm shadow-sm ring-offset-background transition-colors hover:bg-muted/30 focus:outline-none focus:border focus:bg-background focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					disabled={updating}
				>
					<div className="flex items-center gap-1 flex-shrink-0">
						<UserIcon className="size-3 text-muted-foreground" />
						<span className="text-sm normal-case">
							{currentUnits.length > 2
								? `+${currentUnits.length - 2} unit lainnya`
								: "Pilih Unit"}
						</span>
					</div>
					<ChevronDownIcon className="h-4 w-4 opacity-50 flex-shrink-0" />
				</button>
			)}
		</div>
	);
}

// Status color mapping
const getStatusColor = (status: string) => {
	switch (status) {
		case "done":
			return "text-green-600 bg-green-50 border-green-200";
		case "on process":
			return "text-blue-600 bg-blue-50 border-blue-200";
		case "new":
			return "text-gray-600 bg-gray-50 border-gray-200";
		case "konsultasi zoom":
			return "text-purple-600 bg-purple-50 border-purple-200";
		case "ready to send":
			return "text-orange-600 bg-orange-50 border-orange-200";
		case "cancel":
			return "text-red-600 bg-red-50 border-red-200";
		case "fu pertanyaan":
			return "text-yellow-600 bg-yellow-50 border-yellow-200";
		default:
			return "text-gray-600 bg-gray-50 border-gray-200";
	}
};

// Category color mapping
const getCategoryColor = (category: string) => {
	switch (category) {
		case "tata kelola":
			return "text-indigo-600 bg-indigo-50 border-indigo-200";
		case "infrastruktur":
			return "text-cyan-600 bg-cyan-50 border-cyan-200";
		case "aplikasi":
			return "text-emerald-600 bg-emerald-50 border-emerald-200";
		case "keamanan informasi":
			return "text-red-600 bg-red-50 border-red-200";
		case "SDM":
			return "text-pink-600 bg-pink-50 border-pink-200";
		default:
			return "text-gray-600 bg-gray-50 border-gray-200";
	}
};

const columns: ColumnDef<KonsultasiData>[] = [
	{
		id: "drag",
		header: () => null,
		size: 24,
		minSize: 24,
		maxSize: 24,
		cell: ({ row }) => <DragHandle id={row.original.id} />,
	},
	{
		id: "select",
		header: ({ table }) => (
			<div className="w-0 p-0">
				{/* <Checkbox
			checked={
				table.getIsAllPageRowsSelected() ||
				(table.getIsSomePageRowsSelected() && "indeterminate")
			}
			onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
			aria-label="Select all"
			/> */}
			</div>
		),
		size: 24,
		minSize: 24,
		maxSize: 24,
		cell: ({ row }) => (
			<div className="w-0 p-0">
				{/* <Checkbox
			checked={row.getIsSelected()}
			onCheckedChange={(value) => row.toggleSelected(!!value)}
			aria-label="Select row"
			/> */}
			</div>
		),
		enableSorting: false,
		enableHiding: false,
	},
	{
		accessorKey: "ticket",
		header: "Ticket",
		size: 140,
		minSize: 120,
		maxSize: 160,
		cell: ({ row }) => {
			const ticket = row.original.ticket;

			if (!ticket) return <span className="text-muted-foreground text-sm">-</span>;

			return (
				<button
					onClick={() => navigator.clipboard.writeText(ticket)}
					className="group flex items-center gap-2 pl-0 pr-2 py-1 rounded-md hover:bg-muted transition"
					title="Klik untuk copy"
				>
					<span className="font-mono text-sm font-semibold">{ticket}</span>
					<span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">
						copy
					</span>
				</button>
			);
		}


	},
	{
		accessorKey: "nama_lengkap",
		header: "Identitas",
		size: 280,
		minSize: 200,
		maxSize: 200,
		cell: ({ row }) => {
			return <TableCellViewer item={row.original} />;
		},
		enableHiding: false,
	},
	{
		accessorKey: "jabatan",
		header: "Jabatan",
		size: 100,
		cell: ({ row }) => {
			const jabatan = row.original.jabatan;
			return jabatan ? (
				<span className="text-sm">{jabatan}</span>
			) : (
				<span className="text-muted-foreground text-sm">-</span>
			);
		},
	},
	{
		accessorKey: "topics",
		header: "Topik",
		size: 200, // Set fixed width for topics column
		cell: ({ row }) => (
			<div className="max-w-[180px]">
				{row.original.topics && row.original.topics.length > 0 ? (
					<div className="space-y-1">
						{row.original.topics.slice(0, 2).map((topic, index) => (
							<Badge
								key={topic.topik_id}
								variant="default"
								className="text-xs px-2 py-1 block w-fit"
							>
								{topic.topik_name}
							</Badge>
						))}
						{row.original.topics.length > 2 && (
							<span className="text-xs text-muted-foreground">
								+{row.original.topics.length - 2} topik lainnya
							</span>
						)}
					</div>
				) : (
					<span className="text-muted-foreground text-sm flex items-center gap-1">
						Belum ada topik
					</span>
				)}
			</div>
		),
	},
	// {
	// 	accessorKey: "status",
	// 	header: "Status",
	// 	cell: ({ row }) => (
	// 		<Badge
	// 			variant="outline"
	// 			className={`flex gap-1 px-2 py-1 text-xs capitalize ${getStatusColor(
	// 				row.original.status
	// 			)}`}
	// 		>
	// 			{row.original.status === "done" ? (
	// 				<CheckCircle2Icon className="size-3" />
	// 			) : row.original.status === "on process" ? (
	// 				<LoaderIcon className="size-3 animate-spin" />
	// 			) : (
	// 				<ClockIcon className="size-3" />
	// 			)}
	// 			{row.original.status}
	// 		</Badge>
	// 	),
	// },
	{
		accessorKey: "skor_indeks_spbe",
		header: () => <div className="text-center">Skor SPBE</div>,
		cell: ({ row }) => (
			<div className="text-center">
				{row.original.skor_indeks_spbe != null ? (
					<Badge variant="outline" className="px-2 py-1">
						{row.original.skor_indeks_spbe}
					</Badge>
				) : (
					<span className="text-muted-foreground text-sm">-</span>
				)}
			</div>
		),
	},

	{
		accessorKey: "uraian_kebutuhan_konsultasi",
		header: "Uraian Kebutuhan",
		size: 240, // Set fixed width for uraian kebutuhan column
		cell: ({ row }) => {
			const [isExpanded, setIsExpanded] = React.useState(false);
			const uraianText = row.original.uraian_kebutuhan_konsultasi;
			const shouldTruncate = uraianText && uraianText.length > 100;

			return (
				<div className="max-w-[240px] w-full">
					{uraianText ? (
						<div className="flex flex-col items-start gap-2">
							<button
								onClick={() => setIsExpanded(!isExpanded)}
								className="text-left hover:bg-muted/30 rounded px-2 py-1 transition-colors w-full group"
							>
								<div
									className={`text-sm text-muted-foreground leading-relaxed transition-all duration-200 ${isExpanded
										? "whitespace-pre-wrap break-words"
										: "line-clamp-3"
										}`}
								>
									{uraianText}
								</div>
								{shouldTruncate && !isExpanded && (
									<div className="text-xs text-blue-600 group-hover:text-blue-800 mt-1 font-medium">
										Klik untuk lihat selengkapnya
									</div>
								)}
							</button>
						</div>
					) : (
						<span className="text-muted-foreground text-sm flex items-center gap-1">
							Belum ada uraian kebutuhan
						</span>
					)}
				</div>
			);
		},
	},
	{
		accessorKey: "units",
		header: "Unit",

		cell: ({ row }) => (
			<div className="max-w-sm">
				{row.original.units && row.original.units.length > 0 ? (
					<div className="space-y-1">
						{row.original.units.slice(0, 2).map((unit, index) => (
							<Badge
								key={unit.unit_id}
								variant="default"
								className="text-xs px-2 py-1 block w-fit"
							>
								{/* <Building2Icon className="size-3 mr-1" /> */}
								{unit.unit_name}
							</Badge>
						))}
						{row.original.units.length > 2 && (
							<span className="text-xs text-muted-foreground">
								+{row.original.units.length - 2} unit lainnya
							</span>
						)}
					</div>
				) : (
					<span className="text-muted-foreground text-sm flex items-center gap-1">
						{/* <Building2Icon className="size-3" /> */}
						Belum ada unit
					</span>
				)}
			</div>
		),
	},
	// PIC column will be defined inside the component where setData is available
];

// Create columns function that accepts setData
const createColumns = (
	setData: React.Dispatch<React.SetStateAction<KonsultasiData[]>>
): ColumnDef<KonsultasiData>[] => [
		...columns.slice(0, 5), // drag, select, ticket, nama_lengkap, jabatan
		{
			accessorKey: "topics",
			header: "Topik",
			cell: ({ row }) => (
				<div className="max-w-sm">
					{row.original.topics && row.original.topics.length > 0 ? (
						<div className="space-y-1">
							{row.original.topics.slice(0, 2).map((topic, index) => (
								<Badge
									key={topic.topik_id}
									variant="default"
									className="text-xs px-2 py-1 block w-fit"
								>
									{topic.topik_name}
								</Badge>
							))}
							{row.original.topics.length > 2 && (
								<span className="text-xs text-muted-foreground">
									+{row.original.topics.length - 2} topik lainnya
								</span>
							)}
						</div>
					) : (
						<span className="text-muted-foreground text-sm flex items-center gap-1">
							Belum ada topik
						</span>
					)}
				</div>
			),
		},
		{
			accessorKey: "kategori",
			header: "Kategori",
			cell: ({ row }) => (
				<CategorySelector
					konsultasiId={row.original.id}
					currentCategory={row.original.kategori}
					onUpdate={(newCategory) => {
						// Update local data state
						setData((prevData) =>
							prevData.map((item) =>
								item.id === row.original.id
									? {
										...item,
										kategori: newCategory as KonsultasiData["kategori"],
									}
									: item
							)
						);
					}}
				/>
			),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<StatusSelector
					konsultasiId={row.original.id}
					currentStatus={row.original.status}
					onUpdate={(newStatus) => {
						// Update local data state
						setData((prevData) =>
							prevData.map((item) =>
								item.id === row.original.id
									? { ...item, status: newStatus as KonsultasiData["status"] }
									: item
							)
						);
					}}
				/>
			),
		},
		...columns.slice(6, 7), // skor_indeks_spbe
		{
			accessorKey: "uraian_kebutuhan_konsultasi",
			header: "Uraian Kebutuhan",
			size: 240, // Set fixed width for uraian kebutuhan column
			cell: ({ row }) => (
				<UraianKebutuhanDisplay
					konsultasiId={row.original.id}
					uraianKebutuhan={row.original.uraian_kebutuhan_konsultasi}
					currentSolusi={row.original.solusi}
					onSolusiUpdate={(newSolusi) => {
						// Update local data state for solusi
						setData((prevData) =>
							prevData.map((item) =>
								item.id === row.original.id
									? { ...item, solusi: newSolusi }
									: item
							)
						);
					}}
				/>
			),
		},
		{
			accessorKey: "units",
			header: "Unit",
			// filterFn: unitsFilterFn,
			cell: ({ row }) => (
				<UnitSelector
					konsultasiId={row.original.id}
					currentUnits={row.original.units || []}
					onUpdate={(newUnits) => {
						// Update local data state
						setData((prevData) =>
							prevData.map((item) =>
								item.id === row.original.id ? { ...item, units: newUnits } : item
							)
						);
					}}
				/>
			),
		},
		{
			accessorKey: "pic_name",
			header: "PIC",
			cell: ({ row }) => (
				<PICSelector
					konsultasiId={row.original.id}
					currentPicName={row.original.pic_name}
					onUpdate={(newPicName) => {
						// Update local data state
						setData((prevData) =>
							prevData.map((item) =>
								item.id === row.original.id
									? { ...item, pic_name: newPicName }
									: item
							)
						);
					}}
				/>
			),
		},
		{
			accessorKey: "created_at",
			header: "Tanggal",
			cell: ({ row }) => (
				<div className="text-sm text-muted-foreground">
					{new Date(row.original.created_at).toLocaleDateString("id-ID", {
						day: "2-digit",
						month: "short",
						year: "numeric",
					})}
				</div>
			),
		},
		{
			id: "actions",
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
							size="icon"
						>
							<MoreVerticalIcon />
							<span className="sr-only">Open menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<Sheet>
							<SheetTrigger asChild>
								<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
									<FileTextIcon className="size-4 mr-2" />
									View Details
								</DropdownMenuItem>
							</SheetTrigger>
							<SheetContent side="right" className="flex flex-col w-full sm:max-w-lg">
								<SheetHeader className="gap-1">
									<SheetTitle>Detail Konsultasi</SheetTitle>
									<SheetDescription>Informasi lengkap konsultasi SPBE</SheetDescription>
								</SheetHeader>
								<div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4">
									{/* Basic Info */}
									<div className="space-y-4">
										<h4 className="font-semibold text-sm">Informasi Dasar</h4>
										<div className="grid gap-3">
											<div>
												<Label className="text-xs text-muted-foreground">ID</Label>
												<div className="font-mono text-sm">
													#{row.original.id.toString().padStart(4, "0")}
												</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">Ticket</Label>
												<div className="font-mono text-sm">
													{row.original.ticket || "-"}
												</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
												<div className="text-sm">{row.original.nama_lengkap || "-"}</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">Jabatan</Label>
												<div className="text-sm">{row.original.jabatan || "-"}</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">
													Instansi/Organisasi
												</Label>
												<div className="text-sm">
													{row.original.instansi_organisasi || "-"}
												</div>
											</div>
											{/* NOMOR TELEPON */}
											<div>
												<Label className="text-xs text-muted-foreground">
													Nomor Telepon
												</Label>
												<div className="text-sm">
													{row.original.nomor_telepon ? (
														<a
															href={`tel:${row.original.nomor_telepon}`}
															className="hover:underline"
														>
															{row.original.nomor_telepon}
														</a>
													) : (
														"-"
													)}
												</div>
											</div>

											<div>
												<Label className="text-xs text-muted-foreground">
													Asal Daerah
												</Label>
												<div className="text-sm">
													{row.original.asal_kota_kabupaten && row.original.asal_provinsi
														? `${row.original.asal_kota_kabupaten}, ${row.original.asal_provinsi}`
														: "-"}
												</div>
											</div>
										</div>
									</div>


									{/* Status & Category */}
									<div className="space-y-4">
										<h4 className="font-semibold text-sm">Status & Kategori</h4>
										<div className="grid gap-3">
											<div>
												<Label className="text-xs text-muted-foreground">Status</Label>
												<div className="mt-1">
													<Badge
														variant="outline"
														className={`capitalize ${getStatusColor(row.original.status)}`}
													>
														{row.original.status}
													</Badge>
												</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">
													Kategori
												</Label>
												<div className="mt-1">
													<Badge
														variant="outline"
														className={`capitalize ${getCategoryColor(row.original.kategori)}`}
													>
														{row.original.kategori}
													</Badge>
												</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">PIC</Label>
												<div className="text-sm">
													{row.original.pic_name || "Belum ditentukan"}
												</div>
											</div>
											<div>
												<Label className="text-xs text-muted-foreground">
													Skor Indeks SPBE
												</Label>
												<div className="text-sm font-medium">
													{row.original.skor_indeks_spbe != null ? row.original.skor_indeks_spbe : "-"}
												</div>
											</div>
										</div>
									</div>

									{/* Consultation Details */}
									{row.original.uraian_kebutuhan_konsultasi && (
										<div className="space-y-4">
											<h4 className="font-semibold text-sm">Uraian Kebutuhan</h4>
											<div className="text-sm text-muted-foreground bg-muted p-3 rounded">
												{row.original.uraian_kebutuhan_konsultasi}
											</div>
										</div>
									)}

									{/* Solusi Section */}
									<SolusiDetailEditor
										konsultasiId={row.original.id}
										currentSolusi={row.original.solusi}
										onUpdate={(newSolusi: string | null) => {
											// Use callback instead of mutating props
											// We'll handle the update in the parent component
											console.log("Solusi updated:", newSolusi);
										}}
									/>

									{/* Units */}
									{row.original.units && row.original.units.length > 0 && (
										<div className="space-y-4">
											<h4 className="font-semibold text-sm">Unit Penanggung Jawab</h4>
											<div className="space-y-2">
												{row.original.units.map((unit, index) => (
													<div key={index} className="text-sm bg-muted/50 p-2 rounded">
														<div className="font-medium">{unit.unit_name}</div>
														{unit.unit_pic_name && (
															<div className="text-xs text-muted-foreground">
																PIC: {unit.unit_pic_name}
															</div>
														)}
													</div>
												))}
											</div>
										</div>
									)}

									{/* Topics */}
									{row.original.topics && row.original.topics.length > 0 && (
										<div className="space-y-4">
											<h4 className="font-semibold text-sm">Topik Konsultasi</h4>
											<div className="flex flex-wrap gap-2">
												{row.original.topics.map((topic, index) => (
													<Badge key={index} variant="default" className="text-xs">
														{topic.topik_name}
													</Badge>
												))}
											</div>
										</div>
									)}

									{/* Timestamps */}
									<div className="space-y-4">
										<h4 className="font-semibold text-sm">Riwayat</h4>
										<div className="grid gap-2">
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground">Dibuat:</span>
												<span>{new Date(row.original.created_at).toLocaleString("id-ID")}</span>
											</div>
											<div className="flex justify-between text-xs">
												<span className="text-muted-foreground">Diperbarui:</span>
												<span>{new Date(row.original.updated_at).toLocaleString("id-ID")}</span>
											</div>
										</div>
									</div>
								</div>

								<SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
									<SheetClose asChild>
										<Button variant="outline" className="w-full">
											Tutup
										</Button>
									</SheetClose>
								</SheetFooter>
							</SheetContent>
						</Sheet>

						{/* <DropdownMenuSeparator /> */}
						{/* <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem> */}
					</DropdownMenuContent>
				</DropdownMenu>
			),
		},
	];

function DraggableRow({ row }: { row: Row<KonsultasiData> }) {
	const { transform, transition, setNodeRef, isDragging } = useSortable({
		id: row.original.id,
	});

	return (
		<TableRow
			// data-state={row.getIsSelected() && "selected"}
			// data-dragging={isDragging}
			ref={setNodeRef}
			className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition,
				height: 'auto',
			}}
		>
			{row.getVisibleCells().map((cell) => {
				const isDragOrSelect = cell.column.id === "drag" || cell.column.id === "select";
				const isIdentitas = cell.column.id === "nama_lengkap";
				const isTicket = cell.column.id === "ticket";
				return (
					<TableCell
						key={cell.id}
						className={`${isDragOrSelect ? "!w-6 !p-0" : ""} ${isIdentitas ? "align-top min-w-0 pr-2" : "align-top"} ${cell.column.id === "jabatan" ? "pl-2" : ""} ${isTicket ? "pl-2" : ""}`}
						style={
							isDragOrSelect
								? { width: '24px', minWidth: '24px', maxWidth: '24px', padding: '0' }
								: isIdentitas
									? {
										minWidth: '200px',
										maxWidth: '350px',
										width: 'auto',
										overflow: 'visible',
										whiteSpace: 'normal'
									}
									: undefined
						}
					>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				);
			})}
		</TableRow>
	);
}

export function DataTableAdminKonsultasi({
	data: initialData,
}: {
	data: KonsultasiData[];
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { userUnits, isAdmin, loading: userLoading } = useUser();

	const [data, setData] = React.useState(() => initialData);
	const [loading, setLoading] = React.useState(false);
	const [totalCount, setTotalCount] = React.useState(initialData.length);
	const [emptyMessage, setEmptyMessage] = React.useState<string | null>(null);

	// Get current parameters from URL
	const currentPage = parseInt(searchParams.get("page") || "1");
	const pageSizeParam = searchParams.get("pageSize") || "all";
	const currentPageSize =
		pageSizeParam === "all" ? Number.MAX_SAFE_INTEGER : parseInt(pageSizeParam);
	const currentSearch = searchParams.get("search") || "";
	const currentKategori =
		searchParams.get("kategori")?.split(",").filter(Boolean) || [];
	const currentStatus =
		searchParams.get("status")?.split(",").filter(Boolean) || [];
	const currentUnits =
		searchParams.get("units")?.split(",").filter(Boolean).map(Number) || [];

	const [rowSelection, setRowSelection] = React.useState({});
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});

	// Initialize state from URL parameters
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		() => {
			const filters: ColumnFiltersState = [];
			if (currentKategori.length > 0) {
				filters.push({ id: "kategori", value: currentKategori });
			}
			if (currentStatus.length > 0) {
				filters.push({ id: "status", value: currentStatus });
			}
			if (currentUnits.length > 0) {
				filters.push({ id: "units", value: currentUnits });
			}
			return filters;
		}
	);

	const [globalFilter, setGlobalFilter] = React.useState(currentSearch);
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [pagination, setPagination] = React.useState({
		pageIndex: currentPage - 1,
		pageSize: currentPageSize,
	});

	const sortableId = React.useId();
	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {})
	);

	const dataIds = React.useMemo<UniqueIdentifier[]>(
		() => data?.map(({ id }) => id) || [],
		[data]
	);

	// Track if this is the initial load
	const initialLoadRef = React.useRef(true);

	// Use useMemo for complex expressions
	const columnFiltersString = React.useMemo(
		() => JSON.stringify(columnFilters),
		[columnFilters]
	);

	const sortingString = React.useMemo(
		() => JSON.stringify(sorting),
		[sorting]
	);

	// Separate function to update URL parameters
	const updateURLParamsStable = React.useCallback(
		(params: Record<string, string | number | null>) => {
			const newSearchParams = new URLSearchParams(searchParams.toString());

			Object.entries(params).forEach(([key, value]) => {
				if (value !== null && value !== "" && value !== 0) {
					newSearchParams.set(key, value.toString());
				} else {
					newSearchParams.delete(key);
				}
			});

			router.push(`?${newSearchParams.toString()}`, { scroll: false });
		},
		[router, searchParams]
	);

	// Fetch data from API with filters and pagination
	const fetchKonsultasiData = React.useCallback(
		async (skipURLUpdate = false) => {
			setLoading(true);
			try {
				const params = new URLSearchParams();

				// Pagination
				const offset = pagination.pageIndex * pagination.pageSize;
				if (pagination.pageSize === Number.MAX_SAFE_INTEGER) {
					// For "all", don't set limit to get all records
					params.set("limit", "10000"); // Set a very large number instead of no limit
					params.set("offset", "0");
				} else {
					params.set("limit", pagination.pageSize.toString());
					params.set("offset", offset.toString());
				}

				// Sorting
				if (sorting.length > 0) {
					params.set("sortBy", sorting[0].id);
					params.set("sortOrder", sorting[0].desc ? "desc" : "asc");
				}

				// Filters
				if (globalFilter) {
					params.set("search", globalFilter);
				}

				const kategoriFilter = columnFilters.find((f) => f.id === "kategori")
					?.value as string[];
				if (kategoriFilter?.length > 0) {
					params.set("kategori", kategoriFilter.join(","));
				}

				const statusFilter = columnFilters.find((f) => f.id === "status")
					?.value as string[];
				if (statusFilter?.length > 0) {
					params.set("status", statusFilter.join(","));
				}

				const unitsFilter = columnFilters.find((f) => f.id === "units")
					?.value as number[];
				if (unitsFilter?.length > 0) {
					params.set("units", unitsFilter.join(","));
				}

				// Use different API endpoint based on user access level
				const apiEndpoint = isAdmin
					? `/api/v1/konsultasi/admin?${params.toString()}`
					: `/api/v1/konsultasi/unit-filtered?${params.toString()}`;

				const response = await fetch(apiEndpoint);

				if (!response.ok) {
					const errorText = await response.text();
					if (response.status !== 403) {
						console.error("API Error Response:", {
							status: response.status,
							statusText: response.statusText,
							errorText,
							endpoint: apiEndpoint,
						});
					}
					throw new Error(
						`API Error: ${response.status} - ${response.statusText}`
					);
				}

				const result = await response.json();
				if (result.success && result.data) {
					setData(result.data);
					setTotalCount(result.pagination?.total || 0);
					if (result.data.length === 0 && result.message) {
						setEmptyMessage(result.message);
					} else {
						setEmptyMessage(null);
					}

					// Update URL parameters only if not skipped and not initial load
					if (!skipURLUpdate && !initialLoadRef.current) {
						// updateURLParamsStable({
						// 	page: pagination.pageIndex + 1,
						// 	pageSize:
						// 		pagination.pageSize === Number.MAX_SAFE_INTEGER
						// 			? "all"
						// 			: pagination.pageSize,
						// 	search: globalFilter || null,
						// 	kategori:
						// 		kategoriFilter?.length > 0 ? kategoriFilter.join(",") : null,
						// 	status: statusFilter?.length > 0 ? statusFilter.join(",") : null,
						// 	units: unitsFilter?.length > 0 ? unitsFilter.join(",") : null,
						// });
					}
				} else {
					throw new Error(result.message || "Failed to fetch data");
				}
			} catch (error) {
				const msg = error instanceof Error ? error.message : "Unknown error";
				if (!msg.includes("403")) {
					console.error("Error fetching konsultasi data:", error);
				}
				toast.error("Gagal memuat data konsultasi", {
					description: msg,
				});
			} finally {
				setLoading(false);
				initialLoadRef.current = false;
			}
		},
		[pagination, sorting, columnFilters, globalFilter, isAdmin, userLoading, updateURLParamsStable]
	);

	// Initial load effect
	React.useEffect(() => {
		// Only fetch on initial mount if we have URL parameters that differ from defaults
		const hasNonDefaultParams =
			currentPage !== 1 ||
			currentPageSize !== 10 ||
			currentSearch !== "" ||
			currentKategori.length > 0 ||
			currentStatus.length > 0 ||
			currentUnits.length > 0;

		if (hasNonDefaultParams) {
			fetchKonsultasiData(true);
		}
	}, [
		currentPage,
		currentPageSize,
		currentSearch,
		currentKategori.length,
		currentStatus.length,
		currentUnits.length,
		fetchKonsultasiData,
	]);

	// Load data when user data has loaded
	React.useEffect(() => {
		// Only fetch data when user data has loaded
		if (!userLoading) {
			fetchKonsultasiData(true);
		}
	}, [userLoading, fetchKonsultasiData]);

	// Load data when internal state changes (filters, pagination, sorting)
	React.useEffect(() => {
		if (initialLoadRef.current) return; // Skip initial load

		// Debounce the fetch to avoid multiple rapid calls
		const timeoutId = setTimeout(() => {
			fetchKonsultasiData(false);
		}, 300); // 300ms debounce

		return () => clearTimeout(timeoutId);
	}, [
		pagination.pageIndex,
		pagination.pageSize,
		globalFilter,
		columnFiltersString,
		sortingString,
		fetchKonsultasiData,
	]);

	// Create columns with setData function
	const columnsWithData = React.useMemo(
		() => createColumns(setData),
		[setData]
	);

	const table = useReactTable({
		data,
		columns: columnsWithData,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			globalFilter,
			pagination,
		},
		pageCount:
			pagination.pageSize === Number.MAX_SAFE_INTEGER
				? 1
				: Math.ceil(totalCount / pagination.pageSize),
		getRowId: (row) => row.id.toString(),
		enableRowSelection: true,
		manualPagination: true,
		manualFiltering: true,
		manualSorting: true,
		columnResizeMode: "onChange",
		enableColumnResizing: false, // Disable manual resizing, use fixed sizes
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
	});

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (active && over && active.id !== over.id) {
			setData((data) => {
				const oldIndex = dataIds.indexOf(active.id);
				const newIndex = dataIds.indexOf(over.id);
				return arrayMove(data, oldIndex, newIndex);
			});
		}
	}

	return (
		<TooltipProvider>
			<div className="overflow-x-hidden w-full">
				<Tabs
					defaultValue="konsultasi"
					className="flex w-full flex-col justify-start gap-6"
				>
					<div className="flex items-center justify-between px-4 lg:px-6">
						<div className="flex items-center gap-4">
							<h2 className="text-2xl font-bold">Data Konsultasi SPBE</h2>
							<Badge variant="secondary" className="text-sm">
								{data.length} konsultasi
							</Badge>
							{!userLoading && (
								<div className="flex items-center gap-2">
									<Badge
										variant={isAdmin ? "default" : "outline"}
										className="text-xs"
									>
										{isAdmin ? "Super Admin (Full Access)" : `Unit Access`}
									</Badge>
									{/* Tampilkan nama unit user */}
									{userUnits.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{userUnits.map((unit, index) => (
												<Badge
													key={unit.unit_id}
													variant="secondary"
													className="text-xs"
												>
													{unit.unit_name}
												</Badge>
											))}
										</div>
									)}
								</div>
							)}
						</div>

						<div className="flex items-center gap-2">
							{!userLoading && isAdmin ? (
								<ImportModal onImportComplete={() => fetchKonsultasiData(true)} />
							) : null}

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm">
										<ColumnsIcon />
										<span className="hidden lg:inline">Kolom</span>
										<ChevronDownIcon />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									{table
										.getAllColumns()
										.filter(
											(column) =>
												typeof column.accessorFn !== "undefined" &&
												column.getCanHide()
										)
										.map((column) => {
											return (
												<DropdownMenuCheckboxItem
													key={column.id}
													className="capitalize"
													checked={column.getIsVisible()}
													onCheckedChange={(value) =>
														column.toggleVisibility(!!value)
													}
												>
													{column.id}
												</DropdownMenuCheckboxItem>
											);
										})}
								</DropdownMenuContent>
							</DropdownMenu>
							<Button
								variant="outline"
								size="sm"
								onClick={() => fetchKonsultasiData(true)}
								disabled={loading}
							>
								{loading ? (
									<LoaderIcon className="animate-spin" />
								) : (
									<RefreshCcw />
								)}
								{/* <span className="hidden lg:inline">
              {loading ? 'Loading...' : 'Refresh Data'}
            </span> */}
							</Button>
						</div>
					</div>

					<TabsContent
						value="konsultasi"
						className="relative flex flex-col gap-4 overflow-x-hidden overflow-y-auto px-4 lg:px-6"
					>
						{userLoading ? (
							<div className="flex items-center justify-center h-64">
								<div className="flex items-center gap-2">
									<LoaderIcon className="animate-spin" />
									<span>Memuat data user dan izin akses...</span>
								</div>
							</div>
						) : (
							<>
								<FilterBar
									table={table}
									globalFilter={globalFilter}
									setGlobalFilter={setGlobalFilter}
									totalCount={totalCount}
									loading={loading}
								/>
								<FilterSummary
									table={table}
									globalFilter={globalFilter}
									setGlobalFilter={setGlobalFilter}
								/>
								<div className="overflow-hidden rounded-lg border">
									<div className="overflow-x-auto">
										<DndContext
											collisionDetection={closestCenter}
											modifiers={[restrictToVerticalAxis]}
											onDragEnd={handleDragEnd}
											sensors={sensors}
											id={sortableId}
										>
											<Table>
												<TableHeader className="sticky top-0 z-10 bg-muted">
													{table.getHeaderGroups().map((headerGroup) => (
														<TableRow key={headerGroup.id}>
															{headerGroup.headers.map((header) => {
																const isDragOrSelect = header.id === "drag" || header.id === "select";
																const isIdentitas = header.id === "nama_lengkap";
																const isTicket = header.id === "ticket";
																return (
																	<TableHead
																		key={header.id}
																		colSpan={header.colSpan}
																		className={`${isDragOrSelect ? "!w-6 !p-0" : ""} ${isIdentitas ? "pr-2" : header.id === "jabatan" ? "pl-2" : ""} ${isTicket ? "pl-2" : ""}`}
																		style={
																			isDragOrSelect
																				? { width: '24px', minWidth: '24px', maxWidth: '24px', padding: '0' }
																				: isIdentitas
																					? {
																						width: header.getSize() ? `${header.getSize()}px` : undefined,
																						minWidth: header.column.columnDef.minSize ? `${header.column.columnDef.minSize}px` : '200px',
																						maxWidth: header.column.columnDef.maxSize ? `${header.column.columnDef.maxSize}px` : '350px',
																					}
																					: {
																						width: header.getSize() !== 150 ? header.getSize() : undefined,
																						minWidth: header.getSize() !== 150 ? header.getSize() : undefined,
																						maxWidth: header.getSize() !== 150 ? header.getSize() : undefined,
																					}
																		}
																	>
																		{header.isPlaceholder
																			? null
																			: flexRender(
																				header.column.columnDef.header,
																				header.getContext()
																			)}
																	</TableHead>
																);
															})}
														</TableRow>
													))}
												</TableHeader>
												<TableBody className="**:data-[slot=table-cell]:first:w-8">
													{loading ? (
														<TableRow>
															<TableCell
																colSpan={columnsWithData.length}
																className="h-24 text-center"
															>
																<div className="flex items-center justify-center gap-2">
																	<LoaderIcon className="animate-spin" />
																	Memuat data konsultasi...
																</div>
															</TableCell>
														</TableRow>
													) : table.getRowModel().rows?.length ? (
														<SortableContext
															items={dataIds}
															strategy={verticalListSortingStrategy}
														>
															{table.getRowModel().rows.map((row) => (
																<DraggableRow key={row.id} row={row} />
															))}
														</SortableContext>
													) : (
														<TableRow>
															<TableCell
																colSpan={columnsWithData.length}
																className="h-24 text-center"
															>
																<div className="flex flex-col gap-1">
																	<span>
																		{emptyMessage || "Tidak ada data konsultasi."}
																	</span>
																	{emptyMessage?.includes("unit yang ditugaskan") && (
																		<span className="text-sm text-muted-foreground">
																			Hubungi admin untuk assign unit ke akun Anda.
																		</span>
																	)}
																</div>
															</TableCell>
														</TableRow>
													)}
												</TableBody>
											</Table>
										</DndContext>
									</div>
								</div>
								<div className="flex items-center justify-between px-4">
									<div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
										{pagination.pageSize === Number.MAX_SAFE_INTEGER
											? `Menampilkan semua ${totalCount} hasil`
											: `Menampilkan ${pagination.pageIndex * pagination.pageSize + 1
											} - ${Math.min(
												(pagination.pageIndex + 1) * pagination.pageSize,
												totalCount
											)} dari ${totalCount} hasil`}
									</div>
									<div className="flex w-full items-center gap-8 lg:w-fit">
										<div className="hidden items-center gap-2 lg:flex">
											<Label
												htmlFor="rows-per-page"
												className="text-sm font-medium"
											>
												Baris per halaman
											</Label>
											<Select
												value={
													table.getState().pagination.pageSize ===
														Number.MAX_SAFE_INTEGER
														? "all"
														: `${table.getState().pagination.pageSize}`
												}
												onValueChange={(value) => {
													if (value === "all") {
														table.setPageSize(Number.MAX_SAFE_INTEGER);
													} else {
														table.setPageSize(Number(value));
													}
												}}
											>
												<SelectTrigger className="w-24" id="rows-per-page">
													<SelectValue
														placeholder={
															table.getState().pagination.pageSize ===
																Number.MAX_SAFE_INTEGER
																? "All"
																: table.getState().pagination.pageSize
														}
													/>
												</SelectTrigger>
												<SelectContent side="top">
													<SelectItem value="all">All</SelectItem>
													{[10, 20, 30, 40, 50].map((pageSize) => (
														<SelectItem key={pageSize} value={`${pageSize}`}>
															{pageSize}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="flex w-fit items-center justify-center text-sm font-medium">
											Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
											{table.getState().pagination.pageSize ===
												Number.MAX_SAFE_INTEGER
												? 1
												: Math.ceil(totalCount / pagination.pageSize)}
										</div>
										<div className="ml-auto flex items-center gap-2 lg:ml-0">
											<Button
												variant="outline"
												className="hidden h-8 w-8 p-0 lg:flex"
												onClick={() => table.setPageIndex(0)}
												disabled={
													!table.getCanPreviousPage() ||
													pagination.pageSize === Number.MAX_SAFE_INTEGER
												}
											>
												<span className="sr-only">Go to first page</span>
												<ChevronsLeftIcon />
											</Button>
											<Button
												variant="outline"
												className="size-8"
												size="icon"
												onClick={() => table.previousPage()}
												disabled={
													!table.getCanPreviousPage() ||
													pagination.pageSize === Number.MAX_SAFE_INTEGER
												}
											>
												<span className="sr-only">Go to previous page</span>
												<ChevronLeftIcon />
											</Button>
											<Button
												variant="outline"
												className="size-8"
												size="icon"
												onClick={() => table.nextPage()}
												disabled={
													!table.getCanNextPage() ||
													pagination.pageSize === Number.MAX_SAFE_INTEGER
												}
											>
												<span className="sr-only">Go to next page</span>
												<ChevronRightIcon />
											</Button>
											<Button
												variant="outline"
												className="hidden size-8 lg:flex"
												size="icon"
												onClick={() =>
													table.setPageIndex(table.getPageCount() - 1)
												}
												disabled={
													!table.getCanNextPage() ||
													pagination.pageSize === Number.MAX_SAFE_INTEGER
												}
											>
												<span className="sr-only">Go to last page</span>
												<ChevronsRightIcon />
											</Button>
										</div>
									</div>
								</div>
							</>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</TooltipProvider>
	);
}

// Solusi Detail Editor Component for Detail View
interface SolusiDetailEditorProps {
	konsultasiId: number;
	currentSolusi: string | null;
	onUpdate: (newSolusi: string | null) => void;
}

function SolusiDetailEditor({
	konsultasiId,
	currentSolusi,
	onUpdate,
}: SolusiDetailEditorProps) {
	const [isEditing, setIsEditing] = React.useState(false);
	const [editValue, setEditValue] = React.useState(currentSolusi || "");
	const [updating, setUpdating] = React.useState(false);

	const handleSave = async () => {
		if (editValue === currentSolusi) {
			setIsEditing(false);
			return;
		}

		setUpdating(true);
		const loadingToast = toast.loading("Menyimpan solusi...");

		try {
			const response = await fetch("/api/v1/konsultasi", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					id: konsultasiId,
					solusi: editValue || null,
				}),
			});

			if (!response.ok) throw new Error("Failed to update solusi");

			const result = await response.json();
			if (result.success) {
				onUpdate(editValue || null);
				setIsEditing(false);

				toast.dismiss(loadingToast);
				toast.success("Solusi berhasil disimpan!", {
					description: `Konsultasi #${konsultasiId} telah diperbarui`,
					duration: 4000,
				});
			} else {
				throw new Error(result.message || "Update failed");
			}
		} catch (error) {
			console.error("Error updating solusi:", error);

			toast.dismiss(loadingToast);
			toast.error("Gagal menyimpan solusi", {
				description:
					error instanceof Error
						? error.message
						: "Terjadi kesalahan saat menyimpan solusi",
				duration: 4000,
			});
		} finally {
			setUpdating(false);
		}
	};

	const handleCancel = () => {
		setEditValue(currentSolusi || "");
		setIsEditing(false);
	};

	if (isEditing) {
		return (
			<div className="space-y-4">
				<div className="flex items-center justify-between ">
					<h4 className="font-semibold text-sm">Solusi</h4>
				</div>
				<div className="space-y-3 p-4">
					<Textarea
						value={editValue}
						onChange={(e) => setEditValue(e.target.value)}
						placeholder="Masukkan solusi konsultasi..."
						className="min-h-[150px] text-sm resize-none"
						disabled={updating}
					/>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							onClick={handleSave}
							disabled={updating}
							className="h-8 px-4"
						>
							{updating ? (
								<LoaderIcon className="size-3 animate-spin mr-1" />
							) : (
								<CheckIcon className="size-3 mr-1" />
							)}
							Simpan
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={handleCancel}
							disabled={updating}
							className="h-8 px-4"
						>
							<XIcon className="size-3 mr-1" />
							Batal
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h4 className="font-semibold text-sm">Solusi</h4>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => setIsEditing(true)}
					className="h-8 px-3 text-muted-foreground hover:text-foreground"
				>
					<FileTextIcon className="size-3 mr-1" />
					Edit
				</Button>
			</div>
			{currentSolusi ? (
				<div className="text-sm text-muted-foreground bg-muted p-3 rounded leading-relaxed whitespace-pre-wrap">
					{currentSolusi}
				</div>
			) : (
				<div className="text-sm text-muted-foreground bg-muted p-3 rounded italic">
					Belum ada solusi untuk konsultasi ini.
				</div>
			)}
		</div>
	);
}

interface TableCellViewerProps {
	item: KonsultasiData;
	onSolusiUpdate?: (konsultasiId: number, newSolusi: string | null) => void;
}

function TableCellViewer({ item, onSolusiUpdate }: TableCellViewerProps) {
	const handleSolusiUpdate = React.useCallback((newSolusi: string | null) => {
		if (onSolusiUpdate) {
			onSolusiUpdate(item.id, newSolusi);
		}
	}, [item.id, onSolusiUpdate]);

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button
					variant="link"
					className="w-full px-0 text-left text-foreground h-auto justify-start py-1"
				>
					<div className="flex flex-col items-start text-left w-full gap-1 min-w-0">
						<span className="font-medium text-sm w-full break-words leading-tight" title={item.nama_lengkap || "Nama tidak tersedia"}>
							{item.nama_lengkap || "Nama tidak tersedia"}
						</span>
						<div className="w-full min-w-0">
							<span
								className="text-xs text-muted-foreground block break-words whitespace-normal leading-relaxed"
								title={item.instansi_organisasi || "Instansi tidak tersedia"}
							>
								{item.instansi_organisasi || "Instansi tidak tersedia"}
							</span>
						</div>
						{item.asal_kota_kabupaten && (
							<span className="text-xs text-muted-foreground break-words w-full leading-tight">
								{item.asal_kota_kabupaten}, {item.asal_provinsi}
							</span>
						)}
						{item.nomor_telepon && (
							<span
								className="text-xs text-muted-foreground break-words w-full leading-tight"
								title={item.nomor_telepon}
							>
								{item.nomor_telepon}
							</span>
						)}
					</div>
				</Button>
			</SheetTrigger>
			<SheetContent side="right" className="flex flex-col w-full sm:max-w-lg">
				<SheetHeader className="gap-1">
					<SheetTitle>Detail Konsultasi</SheetTitle>
					<SheetDescription>Informasi lengkap konsultasi SPBE</SheetDescription>
				</SheetHeader>
				<div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4">
					{/* Basic Info */}
					<div className="space-y-4">
						<h4 className="font-semibold text-sm">Informasi Dasar</h4>
						<div className="grid gap-3">
							<div>
								<Label className="text-xs text-muted-foreground">ID</Label>
								<div className="font-mono text-sm">
									#{item.id.toString().padStart(4, "0")}
								</div>
							</div>

							<div>
								<Label className="text-xs text-muted-foreground">Ticket</Label>
								<div className="font-mono text-sm">
									{item.ticket || "-"}
								</div>
							</div>

							<div>
								<Label className="text-xs text-muted-foreground">Nama Lengkap</Label>
								<div className="text-sm">{item.nama_lengkap || "-"}</div>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">Jabatan</Label>
								<div className="text-sm">{item.jabatan || "-"}</div>
							</div>
							{/* NOMOR TELEPON */}
							<div>
								<Label className="text-xs text-muted-foreground">
									Nomor Telepon
								</Label>
								<div className="text-sm">
									{item.nomor_telepon ? (
										<a href={`tel:${item.nomor_telepon}`} className="hover:underline">
											{item.nomor_telepon}
										</a>
									) : (
										"-"
									)}
								</div>
							</div>

							<div>
								<Label className="text-xs text-muted-foreground">
									Instansi/Organisasi
								</Label>
								<div className="text-sm">{item.instansi_organisasi || "-"}</div>
							</div>



							<div>
								<Label className="text-xs text-muted-foreground">Asal Daerah</Label>
								<div className="text-sm">
									{item.asal_kota_kabupaten && item.asal_provinsi
										? `${item.asal_kota_kabupaten}, ${item.asal_provinsi}`
										: "-"}
								</div>
							</div>
						</div>
					</div>


					{/* Status & Category */}
					<div className="space-y-4">
						<h4 className="font-semibold text-sm">Status & Kategori</h4>
						<div className="grid gap-3">
							<div>
								<Label className="text-xs text-muted-foreground">Status</Label>
								<div className="mt-1">
									<Badge
										variant="outline"
										className={`capitalize ${getStatusColor(item.status)}`}
									>
										{item.status}
									</Badge>
								</div>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">
									Kategori
								</Label>
								<div className="mt-1">
									<Badge
										variant="outline"
										className={`capitalize ${getCategoryColor(item.kategori)}`}
									>
										{item.kategori}
									</Badge>
								</div>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">PIC</Label>
								<div className="text-sm">
									{item.pic_name || "Belum ditentukan"}
								</div>
							</div>
							<div>
								<Label className="text-xs text-muted-foreground">
									Skor Indeks SPBE
								</Label>
								<div className="text-sm font-medium">
									{item.skor_indeks_spbe != null ? item.skor_indeks_spbe : "-"}
								</div>
							</div>
						</div>
					</div>

					{/* Consultation Details */}
					{item.uraian_kebutuhan_konsultasi && (
						<div className="space-y-4">
							<h4 className="font-semibold text-sm">Uraian Kebutuhan</h4>
							<div className="text-sm text-muted-foreground bg-muted p-3 rounded">
								{item.uraian_kebutuhan_konsultasi}
							</div>
						</div>
					)}

					{/* Solusi Section */}
					<SolusiDetailEditor
						konsultasiId={item.id}
						currentSolusi={item.solusi}
						onUpdate={handleSolusiUpdate}
					/>

					{/* Units */}
					{item.units && item.units.length > 0 && (
						<div className="space-y-4">
							<h4 className="font-semibold text-sm">Unit Penanggung Jawab</h4>
							<div className="space-y-2">
								{item.units.map((unit, index) => (
									<div key={index} className="text-sm bg-muted/50 p-2 rounded">
										<div className="font-medium">{unit.unit_name}</div>
										{unit.unit_pic_name && (
											<div className="text-xs text-muted-foreground">
												PIC: {unit.unit_pic_name}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					)}

					{/* Topics */}
					{item.topics && item.topics.length > 0 && (
						<div className="space-y-4">
							<h4 className="font-semibold text-sm">Topik Konsultasi</h4>
							<div className="flex flex-wrap gap-2">
								{item.topics.map((topic, index) => (
									<Badge key={index} variant="default" className="text-xs">
										{topic.topik_name}
									</Badge>
								))}
							</div>
						</div>
					)}

					{/* Timestamps */}
					<div className="space-y-4">
						<h4 className="font-semibold text-sm">Riwayat</h4>
						<div className="grid gap-2">
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Dibuat:</span>
								<span>{new Date(item.created_at).toLocaleString("id-ID")}</span>
							</div>
							<div className="flex justify-between text-xs">
								<span className="text-muted-foreground">Diperbarui:</span>
								<span>{new Date(item.updated_at).toLocaleString("id-ID")}</span>
							</div>
						</div>
					</div>
				</div>

				<SheetFooter className="mt-auto flex gap-2 sm:flex-col sm:space-x-0">
					<SheetClose asChild>
						<Button variant="outline" className="w-full">
							Tutup
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
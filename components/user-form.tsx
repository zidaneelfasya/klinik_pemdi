"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { User, CreateUserData, UpdateUserData, UserRole } from "@/lib/users-api";
import { Unit, getUnits } from "@/lib/units-api";
import { Loader2, Building2 } from "lucide-react";

interface UserFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	user?: User | null;
	onSubmit: (
		data: CreateUserData | UpdateUserData
	) => Promise<{ success: boolean; error?: string }>;
	mode: "create" | "edit";
}

export function UserForm({
	open,
	onOpenChange,
	user,
	onSubmit,
	mode,
}: UserFormProps) {
	const [formData, setFormData] = useState<CreateUserData | UpdateUserData>(
		() => {
			if (mode === "edit" && user) {
				return {
					full_name: user.full_name || "",
					phone: user.phone || "",
					email: user.email || "",
					nip: user.nip || "",
					jabatan: user.jabatan || "",
					satuan_kerja: user.satuan_kerja || "",
					instansi: user.instansi || "",
					role: (user.role as UserRole) || "user",
					unit_id: user.unit_id || undefined,
				};
			}
			return {
				email: "",
				password: "",
				role: "user" as UserRole,
				full_name: "",
				phone: "",
				nip: "",
				jabatan: "",
				satuan_kerja: "",
				instansi: "",
				unit_id: undefined,
			};
		}
	);

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [units, setUnits] = useState<Unit[]>([]);
	const [unitsLoading, setUnitsLoading] = useState(false);

	useEffect(() => {
		if (open) {
			loadUnits();
		}
	}, [open]);

	useEffect(() => {
		if (open && mode === "edit" && user) {
			setFormData({
				full_name: user.full_name || "",
				phone: user.phone || "",
				email: user.email || "",
				password: "",
				nip: user.nip || "",
				jabatan: user.jabatan || "",
				satuan_kerja: user.satuan_kerja || "",
				instansi: user.instansi || "",
				role: (user.role as UserRole) || "user",
				unit_id: user.unit_id ?? undefined,
			});
		}
		if (open && mode === "create") {
			setFormData({
				email: "",
				password: "",
				role: "user" as UserRole,
				full_name: "",
				phone: "",
				nip: "",
				jabatan: "",
				satuan_kerja: "",
				instansi: "",
				unit_id: undefined,
			});
		}
	}, [open, mode, user]);

	const loadUnits = async () => {
		setUnitsLoading(true);
		try {
			const unitsData = await getUnits();
			setUnits(unitsData);
		} catch (error) {
			console.error("Error loading units:", error);
			setErrors((prev) => ({ ...prev, units: "Failed to load units" }));
		} finally {
			setUnitsLoading(false);
		}
	};

	const handleChange = (field: string, value: string | number | undefined) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.email) {
			newErrors.email = "Email is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Email is invalid";
		}

		if (mode === "create" && !("password" in formData && formData.password)) {
			newErrors.password = "Password is required";
		}

		if (
			mode === "create" &&
			"password" in formData &&
			formData.password &&
			formData.password.length < 6
		) {
			newErrors.password = "Password must be at least 6 characters";
		}

		// Edit mode: jika isi password, minimal 6 karakter
		if (
			mode === "edit" &&
			"password" in formData &&
			formData.password &&
			formData.password.length > 0 &&
			formData.password.length < 6
		) {
			newErrors.password = "Password must be at least 6 characters";
		}

		if (formData.nip && !/^\d+$/.test(formData.nip)) {
			newErrors.nip = "NIP hanya boleh berisi angka";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		try {
			const result = await onSubmit(formData);
			if (result.success) {
				onOpenChange(false);
				setFormData(
					mode === "create"
						? {
								email: "",
								password: "",
								role: "user" as UserRole,
								full_name: "",
								phone: "",
								nip: "",
								jabatan: "",
								satuan_kerja: "",
								instansi: "",
								unit_id: undefined,
						  }
						: formData
				);
				setErrors({});
			} else {
				setErrors({ general: result.error || "An error occurred" });
			}
		} catch (error) {
			setErrors({ general: "An unexpected error occurred" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Create New User" : "Edit User"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Add a new user to the system. All fields are optional except email and password."
							: "Perbarui informasi pengguna. Kosongkan password jika tidak ingin mengubah."}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{errors.general && (
						<div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
							{errors.general}
						</div>
					)}

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email *</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) => handleChange("email", e.target.value)}
								disabled={loading}
								className={errors.email ? "border-red-500" : ""}
							/>
							{errors.email && (
								<p className="text-sm text-red-600">{errors.email}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">
								{mode === "create" ? "Password *" : "Password baru (opsional)"}
							</Label>
							<Input
								id="password"
								type="password"
								placeholder={mode === "edit" ? "Kosongkan jika tidak ingin mengubah" : undefined}
								value={"password" in formData ? formData.password : ""}
								onChange={(e) => handleChange("password", e.target.value)}
								disabled={loading}
								className={errors.password ? "border-red-500" : ""}
							/>
							{errors.password && (
								<p className="text-sm text-red-600">{errors.password}</p>
							)}
						</div>
					</div>


					<div className="space-y-2">
						<Label htmlFor="role">Role</Label>
						<Select
							value={"role" in formData ? (formData.role || "user") : "user"}
							onValueChange={(value) => handleChange("role", value as UserRole)}
							disabled={loading}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih role" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="user">User</SelectItem>
								<SelectItem value="pic">PIC</SelectItem>
								<SelectItem value="admin">Admin</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="full_name">Full Name</Label>
							<Input
								id="full_name"
								value={formData.full_name || ""}
								onChange={(e) => handleChange("full_name", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">No. Telepon</Label>
							<Input
								id="phone"
								type="tel"
								inputMode="tel"
								value={formData.phone || ""}
								onChange={(e) => {
									const v = e.target.value.replace(/[^\d+-]/g, "");
									handleChange("phone", v);
								}}
								disabled={loading}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="nip">NIP</Label>
							<Input
								id="nip"
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								value={formData.nip || ""}
								onChange={(e) => {
									const val = e.target.value.replace(/\D/g, "");
									handleChange("nip", val);
								}}
								disabled={loading}
								className={errors.nip ? "border-red-500" : ""}
							/>
							{errors.nip && (
								<p className="text-sm text-red-600">{errors.nip}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="jabatan">Position</Label>
							<Input
								id="jabatan"
								value={formData.jabatan || ""}
								onChange={(e) => handleChange("jabatan", e.target.value)}
								disabled={loading}
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="satuan_kerja">Work Unit</Label>
							<Input
								id="satuan_kerja"
								value={formData.satuan_kerja || ""}
								onChange={(e) => handleChange("satuan_kerja", e.target.value)}
								disabled={loading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="instansi">Institution</Label>
							<Input
								id="instansi"
								value={formData.instansi || ""}
								onChange={(e) => handleChange("instansi", e.target.value)}
								disabled={loading}
							/>
						</div>
					</div>

					{/* Unit Assignment */}
					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<Building2 className="h-4 w-4" />
							Assigned Unit
						</Label>
						{unitsLoading ? (
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin" />
								<span className="text-sm text-muted-foreground">
									Loading units...
								</span>
							</div>
						) : errors.units ? (
							<p className="text-sm text-red-600">{errors.units}</p>
						) : (
							<Select
								value={formData.unit_id?.toString() || "no-unit"}
								onValueChange={(value) =>
									handleChange(
										"unit_id",
										value && value !== "no-unit" ? parseInt(value) : undefined
									)
								}
								disabled={loading}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a unit (optional)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="no-unit">No unit assigned</SelectItem>
									{units.map((unit) => (
										<SelectItem key={unit.id} value={unit.id.toString()}>
											<div>
												<div className="font-medium">{unit.nama_unit}</div>
												{unit.nama_pic && (
													<div className="text-xs text-muted-foreground">
														PIC: {unit.nama_pic}
													</div>
												)}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						)}
						<p className="text-xs text-muted-foreground">
							Pilih unit yang menjadi tanggung jawab pengguna ini.
						</p>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || unitsLoading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{mode === "create" ? "Create User" : "Update User"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

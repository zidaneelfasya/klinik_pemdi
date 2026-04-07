"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUser } from "@/app/context/user-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
	ChevronsUpDown,
	LogOut,
	Settings,
	User,
	BuildingIcon,
	ShieldIcon,
	UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

export function NavUser() {
	const { isMobile } = useSidebar();
	const { userUnits, isAdmin, isSuperAdmin, loading, userRole } = useUser();
	const router = useRouter();
	const supabase = createClient();

	// Get user info from Supabase
	const [userInfo, setUserInfo] = useState<{
		email: string | null;
		name: string | null;
		avatar_url: string | null;
	} | null>(null);

	useEffect(() => {
		const getUserInfo = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (user) {
				setUserInfo({
					email: user.email || null,
					name: user.user_metadata?.full_name || user.email || null,
					avatar_url: user.user_metadata?.avatar_url || null,
				});
			}
		};
		getUserInfo();
	}, [supabase.auth]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/auth/login");
	};

	if (loading) {
		return (
			<SidebarMenu>
				<SidebarMenuItem>
					<SidebarMenuButton size="lg" className="animate-pulse">
						<Avatar className="h-8 w-8">
							<AvatarFallback>...</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-semibold">Loading...</span>
							<span className="truncate text-xs">Loading...</span>
						</div>
						<ChevronsUpDown className="ml-auto size-4" />
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		);
	}

	const displayName = userInfo?.name || userInfo?.email || "Unknown User";
	const initials = displayName
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage
									src={userInfo?.avatar_url || ""}
									alt={displayName}
								/>
								<AvatarFallback className="rounded-lg">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-semibold">{displayName}</span>
								<span className="truncate text-xs flex items-center gap-1">
									{isSuperAdmin ? (
										<>
											<ShieldIcon className="size-3" />
											Super Admin
										</>
									) : (
										<>
											<UserIcon className="size-3" />
											Unit User
										</>
									)}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={userInfo?.avatar_url || ""}
										alt={displayName}
									/>
									<AvatarFallback className="rounded-lg">
										{initials}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-semibold">{displayName}</span>
									<span className="truncate text-xs text-muted-foreground">
										{userInfo?.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>

						<DropdownMenuSeparator />

						{/* User Role & Units Info */}
						<DropdownMenuGroup>
							<div className="px-2 py-1.5">
								<div className="flex items-center gap-2 mb-2">
									<Badge
										variant={isSuperAdmin ? "default" : "secondary"}
										className="text-xs"
									>
										{isSuperAdmin ? "Super Admin" : "Unit Access"}
									</Badge>
									{userUnits.length > 0 && (
										<Badge variant="outline" className="text-xs">
											{userUnits.length} unit{userUnits.length !== 1 ? "s" : ""}
										</Badge>
									)}
								</div>

								{userUnits.length > 0 && (
									<div className="space-y-1 max-h-32 overflow-y-auto">
										<div className="text-xs font-medium text-muted-foreground">
											Assigned Units:
										</div>
										{userUnits.map((unit) => (
											<div
												key={unit.unit_id}
												className="flex items-center gap-2 text-xs"
											>
												<BuildingIcon className="size-3 text-muted-foreground" />
												<span className="truncate">{unit.unit_name}</span>
											</div>
										))}
									</div>
								)}
							</div>
						</DropdownMenuGroup>

						<DropdownMenuSeparator />

						<DropdownMenuGroup>
							<Link href={"/admin/profile-page"}>
								<DropdownMenuItem>
									<User className="mr-2 h-4 w-4" />
									<span>Profile</span>
								</DropdownMenuItem>
							</Link>
							{/* <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem> */}
						</DropdownMenuGroup>

						<DropdownMenuSeparator />

						<DropdownMenuItem onClick={handleSignOut} className="text-red-600">
							<LogOut className="mr-2 h-4 w-4" />
							<span>Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}

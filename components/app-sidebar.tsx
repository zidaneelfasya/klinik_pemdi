"use client";

import * as React from "react";
import {
	ArrowUpCircleIcon,
	BarChartIcon,
	CameraIcon,
	ClipboardListIcon,
	DatabaseIcon,
	FileCodeIcon,
	FileIcon,
	FileTextIcon,
	FolderIcon,
	HelpCircleIcon,
	LayoutDashboardIcon,
	ListIcon,
	MessageSquareIcon,
	SearchIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useUser } from "@/app/context/user-context";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const data = {
	navMain: [
		{
			title: "Konsultasi SPBE",
			url: "/admin/konsultasi",
			icon: LayoutDashboardIcon,
		},
		{
			title: "User Management",
			url: "/admin/users",
			icon: UsersIcon,
		},
		// {
		// 	title: "Analytics",
		// 	url: "#",
		// 	icon: BarChartIcon,
		// },
		{
			title: "Context Management",
			url: "/admin/contexts",
			icon: FolderIcon,
		},
		{
			title: "Summary",
			url: "/admin/summary",
			icon: ClipboardListIcon,
		},
		{
			title: "WhatsApp Services",
			url: "/admin/whatsapp-services",
			icon: MessageSquareIcon,
		},
	],
	navClouds: [
		{
			title: "Capture",
			icon: CameraIcon,
			isActive: true,
			url: "#",
			items: [
				{
					title: "Active Proposals",
					url: "#",
				},
				{
					title: "Archived",
					url: "#",
				},
			],
		},
		{
			title: "Proposal",
			icon: FileTextIcon,
			url: "#",
			items: [
				{
					title: "Active Proposals",
					url: "#",
				},
				{
					title: "Archived",
					url: "#",
				},
			],
		},
		{
			title: "Prompts",
			icon: FileCodeIcon,
			url: "#",
			items: [
				{
					title: "Active Proposals",
					url: "#",
				},
				{
					title: "Archived",
					url: "#",
				},
			],
		},
	],
	navSecondary: [
		{
			title: "Settings",
			url: "#",
			icon: SettingsIcon,
		},
		{
			title: "Get Help",
			url: "#",
			icon: HelpCircleIcon,
		},
		{
			title: "Search",
			url: "#",
			icon: SearchIcon,
		},
	],
	documents: [
		{
			name: "Data Library",
			url: "#",
			icon: DatabaseIcon,
		},
		{
			name: "Reports",
			url: "#",
			icon: ClipboardListIcon,
		},
		{
			name: "Word Assistant",
			url: "#",
			icon: FileIcon,
		},
	],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { isSuperAdmin } = useUser();

	const filteredNavMain = data.navMain.filter((item) => {
		// Items that only superadmins can see
		const restrictedItems = [
			"User Management",
			"Context Management",
			"WhatsApp Services",
		];

		if (restrictedItems.includes(item.title)) {
			return isSuperAdmin;
		}
		return true;
	});

	return (

		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltip="Admin Panel"
							asChild
							className="flex justify-center data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<Link href="/admin">
								<ArrowUpCircleIcon className="h-5 w-5" />
								<span className="text-base font-semibold">Admin Panel</span>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={filteredNavMain} />

				{/* <NavDocuments items={data.documents} /> */}
				{/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}

import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import data from "./data.json";
import { UserProvider } from "../context/user-context";

export default function AdminLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<UserProvider>
			<SidebarProvider>
				<AppSidebar variant="inset" />
				<SidebarInset className="overflow-x-hidden">
					<SiteHeader />
					<div className="flex flex-1 flex-col overflow-x-hidden">
						<div className="@container/main flex flex-1 flex-col gap-2 overflow-x-hidden">
							<div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 overflow-x-hidden w-full max-w-full">
								{/* <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div> */}
								{children}
							</div>
						</div>
					</div>
				</SidebarInset>
			</SidebarProvider>
		</UserProvider>
	);
}

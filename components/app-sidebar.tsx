"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useState } from "react";
import { navGroups } from "@/components/app-shared";
import { NavGroup } from "@/components/nav-group";
import { LogOut } from "lucide-react";
import { AdminSignOutDialog } from "@/components/admin/AdminSignOutDialog";

export function AppSidebar() {
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);

	return (
		<Sidebar
			className={cn(
				"*:data-[slot=sidebar-inner]:bg-background",
				"*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]"
			)}
			collapsible="icon"
			variant="sidebar"
		>
			<SidebarHeader className="h-14 justify-center border-b border-border px-4">
				<SidebarMenuButton
					size="lg"
					render={<Link href="/admin" />}
					className="hover:bg-transparent h-auto py-0 px-1 flex items-center justify-start group-data-[collapsible=icon]:justify-center"
				>
					<div className="relative h-8 w-36 group-data-[collapsible=icon]:w-8 flex items-center">
						<Image
							src="/images/logo-black.png"
							alt="AR Boutique"
							width={140}
							height={32}
							className="h-7 w-auto object-contain object-left group-data-[collapsible=icon]:object-center"
							priority
							unoptimized
						/>
					</div>
				</SidebarMenuButton>
			</SidebarHeader>
			<SidebarContent className="py-2">
				{navGroups.map((group, index) => (
					<NavGroup key={`sidebar-group-${index}`} {...group} />
				))}
			</SidebarContent>
			<SidebarFooter className="gap-0 p-0 border-t border-sidebar-border/70">
				<SidebarMenu className="p-2">
					<SidebarMenuItem>
						<SidebarMenuButton
							className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs font-sans rounded-none h-9 px-3 transition-colors cursor-pointer group-data-[collapsible=icon]:justify-center"
							size="sm"
							onClick={() => setIsSignOutOpen(true)}
							title="Sign out of Admin Console"
						>
							<LogOut className="size-4 shrink-0" />
							<span>Sign out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
				<div className="px-4 py-3 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0 border-t border-sidebar-border/40">
					<p className="text-nowrap text-[10px] font-sans text-muted-foreground/70">
						© {new Date().getFullYear()} The AR Boutique
					</p>
				</div>
				<AdminSignOutDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
			</SidebarFooter>
		</Sidebar>
	);
}

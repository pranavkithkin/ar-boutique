"use client";

import { usePathname } from "next/navigation";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function NavGroup({ label, items }: SidebarNavGroup) {
	const pathname = usePathname();

	function isItemActive(path?: string) {
		if (!path) return false;
		// Exact match for /admin (dashboard root), prefix match for everything else
		if (path === "/admin") return pathname === "/admin";
		return pathname.startsWith(path);
	}

	return (
		<SidebarGroup className="py-2">
			{label && (
				<SidebarGroupLabel className="text-[10px] font-mono font-medium uppercase tracking-[0.2em] text-muted-foreground/70 px-3 py-1.5 h-auto">
					{label}
				</SidebarGroupLabel>
			)}
			<SidebarMenu className="gap-1 px-1.5">
				{items.map((item) => {
					const active = isItemActive(item.path);
					return (
						<Collapsible
							className="group/collapsible"
							defaultOpen={
								active || item.subItems?.some((i) => isItemActive(i.path))
							}
							key={item.title}
							render={<SidebarMenuItem />}
						>
							{item.subItems?.length ? (
								<>
									<CollapsibleTrigger
										render={
											<SidebarMenuButton
												isActive={active}
												className={cn(
													"h-9 px-3 text-[13px] font-sans tracking-tight transition-all rounded-xs",
													active
														? "!bg-foreground !text-background font-medium shadow-2xs hover:!bg-foreground hover:!text-background"
														: "text-muted-foreground hover:text-foreground hover:!bg-accent/60"
												)}
											/>
										}
									>
										<span className={cn(
											"[&>svg]:size-4 [&>svg]:stroke-[1.5] shrink-0",
											active ? "!text-background [&>svg]:!stroke-background" : "text-muted-foreground group-hover:text-foreground"
										)}>
											{item.icon}
										</span>
										<span className={cn(active && "!text-background")}>{item.title}</span>
										<ChevronRightIcon className={cn(
											"ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90",
											active ? "!text-background opacity-80" : "opacity-60"
										)} />
									</CollapsibleTrigger>
									<CollapsibleContent>
										<SidebarMenuSub className="ml-3.5 pl-3 border-l border-border/60 my-1 space-y-0.5">
											{item.subItems?.map((subItem) => {
												const subActive = isItemActive(subItem.path);
												return (
													<SidebarMenuSubItem key={subItem.title}>
														<SidebarMenuSubButton
															isActive={subActive}
															className={cn(
																"h-8 text-xs font-sans tracking-tight rounded-xs transition-colors",
																subActive
																	? "!bg-foreground !text-background font-medium"
																	: "text-muted-foreground hover:text-foreground hover:!bg-accent/60"
															)}
															render={<a href={subItem.path} />}
														>
															<span className={cn(
																"[&>svg]:size-3.5 [&>svg]:stroke-[1.5] shrink-0",
																subActive ? "!text-background [&>svg]:!stroke-background" : ""
															)}>
																{subItem.icon}
															</span>
															<span className={cn(subActive && "!text-background")}>{subItem.title}</span>
														</SidebarMenuSubButton>
													</SidebarMenuSubItem>
												);
											})}
										</SidebarMenuSub>
									</CollapsibleContent>
								</>
							) : (
								<SidebarMenuButton
									isActive={active}
									className={cn(
										"h-9 px-3 text-[13px] font-sans tracking-tight transition-all rounded-xs group/btn",
										active
											? "!bg-foreground !text-background font-medium shadow-2xs hover:!bg-foreground hover:!text-background"
											: "text-muted-foreground hover:text-foreground hover:!bg-accent/60"
									)}
									render={<a href={item.path} />}
								>
									<span className={cn(
										"[&>svg]:size-4 [&>svg]:stroke-[1.5] shrink-0 transition-colors",
										active ? "!text-background [&>svg]:!stroke-background" : "text-muted-foreground group-hover/btn:text-foreground"
									)}>
										{item.icon}
									</span>
									<span className={cn("truncate", active ? "!text-background" : "group-hover/btn:text-foreground")}>
										{item.title}
									</span>
								</SidebarMenuButton>
							)}
						</Collapsible>
					);
				})}
			</SidebarMenu>
		</SidebarGroup>
	);
}


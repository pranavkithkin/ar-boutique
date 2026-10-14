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

export function NavGroup({ label, items }: SidebarNavGroup) {
	return (
		<SidebarGroup>
			{label && (
				<SidebarGroupLabel className="text-[10px] font-sans font-semibold uppercase tracking-[0.16em] text-muted-foreground/80 px-2.5 py-1">
					{label}
				</SidebarGroupLabel>
			)}
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						className="group/collapsible"
						defaultOpen={
							!!item.isActive || item.subItems?.some((i) => !!i.isActive)
						}
						key={item.title}
						render={<SidebarMenuItem />}
					>
						{item.subItems?.length ? (
							<>
								<CollapsibleTrigger
									render={
										<SidebarMenuButton
											isActive={item.isActive}
											className="text-xs font-sans tracking-wide font-normal"
										/>
									}
								>
									{item.icon}
									<span>{item.title}</span>
									<ChevronRightIcon className="ml-auto size-3.5 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.subItems?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													isActive={subItem.isActive}
													className="text-xs font-sans tracking-wide"
													render={<a href={subItem.path} />}
												>
													{subItem.icon}
													<span>{subItem.title}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</>
						) : (
							<SidebarMenuButton
								isActive={item.isActive}
								className="text-xs font-sans tracking-wide font-normal data-active:font-medium"
								render={<a href={item.path} />}
							>
								{item.icon}
								<span>{item.title}</span>
							</SidebarMenuButton>
						)}
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

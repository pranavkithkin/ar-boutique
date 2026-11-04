"use client";

import { useRouter } from "next/navigation";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { UserIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { AdminSignOutDialog } from "@/components/admin/AdminSignOutDialog";

const user = {
	name: "AR Concierge",
	email: "concierge@arboutique.ae",
	avatar: "/images/logo-black.png",
};

export function NavUser() {
	const [isSignOutOpen, setIsSignOutOpen] = useState(false);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger nativeButton={false} render={<Avatar className="size-8 cursor-pointer" />}><AvatarImage src={user.avatar} className="object-contain p-1" /><AvatarFallback className="font-sans text-xs font-semibold">AR</AvatarFallback></DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-60">
					<DropdownMenuGroup>
						<DropdownMenuLabel className="pointer-events-none px-2 py-1.5 space-y-0.5">
							<div className="font-semibold text-foreground text-xs font-sans">{user.name}</div>
							<div className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground text-[11px] font-sans">
								{user.email}
							</div>
						</DropdownMenuLabel>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem>
							<UserIcon />
							Profile & Role
						</DropdownMenuItem>
						<DropdownMenuItem>
							<SettingsIcon />
							Boutique Settings
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup>
						<DropdownMenuItem variant="destructive" onClick={() => setIsSignOutOpen(true)} className="cursor-pointer">
							<LogOutIcon />
							Sign out
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<AdminSignOutDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
		</>
	);
}

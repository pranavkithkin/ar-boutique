import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard-card";
import { CreditCardIcon, PackageCheckIcon, ShoppingBagIcon, RefreshCwIcon } from "lucide-react";

const items = [
	{
		title: "Order AR-1045 paid via Stripe (AED 2,400)",
		time: "2 hours ago",
		icon: <CreditCardIcon className="text-emerald-600 size-4" />,
	},
	{
		title: "S & L variant stock seeded across 21 styles",
		time: "This morning",
		icon: <PackageCheckIcon className="text-foreground size-4" />,
	},
	{
		title: "COD delivery AR-1044 placed (Dubai Marina)",
		time: "Yesterday",
		icon: <ShoppingBagIcon className="text-foreground size-4" />,
	},
	{
		title: "Daily inventory ledger synchronized",
		time: "2 days ago",
		icon: <RefreshCwIcon className="text-muted-foreground size-4" />,
	},
] as const;

export function DashboardActivity() {
	return (
		<DashboardCard className="gap-0 bg-card">
			<CardHeader className="border-b gap-1.5 pb-4">
				<CardTitle className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
					Boutique Activity
				</CardTitle>
				<CardDescription className="text-xs text-muted-foreground font-sans">
					Latest order fulfillments, stock adjustments, and administrative events.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				<ul className="flex flex-col divide-y divide-border">
					{items.map((item) => (
						<li className="flex h-16 items-center gap-3 px-6" key={item.title}>
							<span
								aria-hidden="true"
								className="flex size-9 shrink-0 items-center justify-center bg-muted/60 border border-border/60"
							>
								{item.icon}
							</span>
							<div className="min-w-0 flex-1 space-y-0.5">
								<p className="line-clamp-1 text-pretty text-foreground text-xs sm:text-sm font-sans font-medium">
									{item.title}
								</p>
								<p className="text-muted-foreground text-[11px] font-sans">{item.time}</p>
							</div>
						</li>
					))}
				</ul>
			</CardContent>
		</DashboardCard>
	);
}

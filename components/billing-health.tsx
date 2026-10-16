import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { DashboardCard } from "@/components/dashboard-card";
import { CircleCheckIcon, ArrowRightIcon } from "lucide-react";

export function BillingHealth() {
	return (
		<DashboardCard className="gap-0 bg-card">
			<CardHeader className="border-b gap-1.5 pb-4">
				<CardTitle className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
					Boutique Settlement
				</CardTitle>
				<CardDescription className="text-xs text-muted-foreground font-sans">
					Stripe card payouts, VAT calculations & courier COD cash.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex h-full items-center px-0 py-8">
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<CircleCheckIcon className="text-emerald-600 size-6" aria-hidden="true" />
						</EmptyMedia>
						<EmptyTitle className="font-sans text-sm font-semibold text-foreground">
							Accounts Reconciled
						</EmptyTitle>
						<EmptyDescription className="text-xs text-muted-foreground font-sans max-w-xs">
							All Stripe payouts and Cash on Delivery courier collections are up to date.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button variant="ghost" className="font-sans text-xs uppercase tracking-wider h-8 rounded-none gap-1.5" render={<a href="/admin/reports/cod" />} nativeButton={false}>
							Review Settlements
							<ArrowRightIcon className="size-3.5" aria-hidden="true" />
						</Button>
					</EmptyContent>
				</Empty>
			</CardContent>
		</DashboardCard>
	);
}

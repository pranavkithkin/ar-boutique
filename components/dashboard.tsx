import { BillingHealth } from "@/components/billing-health";
import { ChannelSalesChart } from "@/components/channel-sales-chart";
import { DashboardActivity } from "@/components/dashboard-activity";
import { DashboardInvoices } from "@/components/dashboard-invoices";
import { NetRevenueChart } from "@/components/net-revenue-chart";
import { DashboardStats } from "@/components/stats";

export function Dashboard() {
	return (
		<div className="space-y-6">
			{/* Executive Editorial Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
				<div>
					<span className="text-[10px] font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						Executive Overview
					</span>
					<h1 className="font-sans text-2xl sm:text-3xl text-foreground font-semibold tracking-tight mt-0.5">
						Store Performance & Analytics
					</h1>
					<p className="mt-1 text-xs text-muted-foreground font-sans">
						Real-time metrics across catalogue inventory, Stripe card transactions, and courier Cash on Delivery.
					</p>
				</div>
				<div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 bg-muted/40 border border-border text-xs text-muted-foreground font-mono">
					<span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
					<span>Live Boutique Operations</span>
				</div>
			</div>

			{/* Widget Grid */}
			<div className="grid grid-cols-1 gap-px bg-border p-px md:grid-cols-2 lg:grid-cols-4 border border-border">
				<DashboardStats />
				<NetRevenueChart />
				<ChannelSalesChart />
				<DashboardInvoices />
				<BillingHealth />
				<DashboardActivity />
			</div>
		</div>
	);
}

"use client";

import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DashboardCard } from "@/components/dashboard-card";
import { ArrowRightIcon } from "lucide-react";

const invoices = [
	{
		id: "AR-1045",
		customer: "Fatima Al Hashimi",
		amount: "AED 2,400.00",
		status: "Paid",
		method: "Card",
	},
	{
		id: "AR-1044",
		customer: "Mariam Al Maktoum",
		amount: "AED 890.00",
		status: "Pending",
		method: "COD",
	},
	{
		id: "AR-1043",
		customer: "Noura Al Mansoori",
		amount: "AED 5,120.00",
		status: "Paid",
		method: "Card",
	},
	{
		id: "AR-1042",
		customer: "Sarah Jenkins",
		amount: "AED 310.00",
		status: "Delivered",
		method: "COD",
	},
] as const;

export function DashboardInvoices() {
	return (
		<DashboardCard className="relative gap-0 md:col-span-2 bg-card">
			<CardHeader className="border-b gap-1.5 pb-4">
				<CardTitle className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
					Recent Orders & Invoices
				</CardTitle>
				<CardDescription className="text-xs text-muted-foreground font-sans">
					Latest store transactions, fulfillment channels, and payment statuses.
				</CardDescription>
			</CardHeader>
			<CardContent className="mask-b-from-50% mask-b-to-100% px-0">
				<Table>
					<TableCaption className="sr-only">
						Recent invoices with customer, amount, and status.
					</TableCaption>
					<TableHeader>
						<TableRow className="border-border">
							<TableHead className="ps-6 text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">Customer</TableHead>
							<TableHead className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">Order ID</TableHead>
							<TableHead className="text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">Method</TableHead>
							<TableHead className="pe-6 text-right text-[10px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
								Total
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invoices.map((inv) => (
							<TableRow className="h-12 border-border" key={inv.id}>
								<TableCell className="max-w-40 truncate ps-6 font-medium text-xs text-foreground font-sans">
									{inv.customer}
								</TableCell>
								<TableCell className="text-muted-foreground font-mono text-xs">
									{inv.id}
								</TableCell>
								<TableCell className="text-xs font-sans text-muted-foreground">
									<span className="inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-muted rounded-none border border-border">
										{inv.method}
									</span>
								</TableCell>
								<TableCell className="pe-6 text-right font-medium text-xs text-foreground font-mono tabular-nums">
									{inv.amount}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
			<div className="mask-t-from-30% absolute inset-x-0 bottom-0 flex h-1/5 items-center justify-center bg-card/90 backdrop-blur-xs">
				<Button className="relative font-sans text-xs uppercase tracking-wider h-8 rounded-none" variant="ghost" render={<a href="/admin/orders" />} nativeButton={false}>
					View All Orders
					<ArrowRightIcon className="size-3.5 ml-1.5" aria-hidden="true" />
				</Button>
			</div>
		</DashboardCard>
	);
}

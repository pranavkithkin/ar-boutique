import {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { DashboardCard } from "@/components/dashboard-card";

type Stat = {
	label: string;
	value: string;
	delta: number;
};

const stats: Stat[] = [
	{
		label: "Catalogue SKUs",
		value: "42",
		delta: 12.5,
	},
	{
		label: "Gross Revenue",
		value: "AED 18,290",
		delta: 12.4,
	},
	{
		label: "Cart Conversion",
		value: "3.28%",
		delta: -0.4,
	},
	{
		label: "Active Orders",
		value: "38",
		delta: 8.7,
	},
] as const;

export function DashboardStats() {
	return (
		<>
			{stats.map((s) => (
				<DashboardCard className="bg-card border-none" key={s.label}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-[11px] font-sans font-medium uppercase tracking-[0.1em] text-muted-foreground">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-row items-baseline gap-2 py-1">
						<p className="font-sans text-2xl sm:text-3xl font-semibold text-foreground tracking-tight tabular-nums">
							{s.value}
						</p>
					</CardContent>
					<CardFooter className="gap-1.5 rounded-none pt-2 text-xs font-sans">
						<Delta value={s.delta}>
							<DeltaIcon />
							<DeltaValue />
						</Delta>
						<span className="text-muted-foreground/80 font-normal">vs last week</span>
					</CardFooter>
				</DashboardCard>
			))}
		</>
	);
}

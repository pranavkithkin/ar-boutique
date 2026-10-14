import type { ReactNode } from "react";
import {
	LayoutGridIcon,
	PackageIcon,
	BoxesIcon,
	ShoppingBagIcon,
	RotateCcwIcon,
	ReceiptIcon,
	UsersIcon,
	SettingsIcon,
	ShieldCheckIcon,
	HelpCircleIcon,
	BookOpenIcon,
} from "lucide-react";

export type SidebarNavItem = {
	title: string;
	path?: string;
	icon?: ReactNode;
	isActive?: boolean;
	subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
	label?: string;
	items: SidebarNavItem[];
};

export const navGroups: SidebarNavGroup[] = [
	{
		label: "Boutique",
		items: [
			{
				title: "Overview",
				path: "/admin",
				icon: <LayoutGridIcon />,
				isActive: true,
			},
			{
				title: "Products",
				path: "/admin/products",
				icon: <PackageIcon />,
			},
			{
				title: "Inventory & Stock",
				path: "/admin/stock",
				icon: <BoxesIcon />,
			},
			{
				title: "Customer Orders",
				path: "/admin/orders",
				icon: <ShoppingBagIcon />,
			},
		],
	},
	{
		label: "Fulfilment & Care",
		items: [
			{
				title: "Returns & Exchanges",
				path: "/admin/returns",
				icon: <RotateCcwIcon />,
			},
			{
				title: "COD Reconciliation",
				path: "/admin/reports/cod",
				icon: <ReceiptIcon />,
			},
		],
	},
	{
		label: "Administration",
		items: [
			{
				title: "Staff & Access",
				path: "/admin/staff",
				icon: <UsersIcon />,
			},
			{
				title: "Store Settings",
				path: "/admin/settings",
				icon: <SettingsIcon />,
			},
			{
				title: "Security & Audit",
				path: "/admin/audit",
				icon: <ShieldCheckIcon />,
			},
		],
	},
];

export const footerNavLinks: SidebarNavItem[] = [
	{
		title: "Storefront",
		path: "/",
		icon: <BookOpenIcon />,
	},
	{
		title: "Concierge Help",
		path: "/contact",
		icon: <HelpCircleIcon />,
	},
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
];

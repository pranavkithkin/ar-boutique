import type { ReactNode } from "react";
import {
	LayoutGridIcon,
	PackageIcon,
	TagIcon,
	BoxesIcon,
	ShoppingBagIcon,
	RotateCcwIcon,
	SettingsIcon,
	BookOpenIcon,
	PaletteIcon,
	UsersIcon,
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
			},
			{
				title: "Products Management",
				path: "/admin/products",
				icon: <PackageIcon />,
			},
			{
				title: "Categories",
				path: "/admin/categories",
				icon: <TagIcon />,
			},
			{
				title: "Colours & Sizes",
				path: "/admin/attributes",
				icon: <PaletteIcon />,
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
			{
				title: "Customers",
				path: "/admin/customers",
				icon: <UsersIcon />,
			},
			{
				title: "Returns & Exchanges",
				path: "/admin/returns",
				icon: <RotateCcwIcon />,
			},
			{
				title: "Store Settings",
				path: "/admin/settings",
				icon: <SettingsIcon />,
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
];

export const navLinks: SidebarNavItem[] = [
	...navGroups.flatMap((group) =>
		group.items.flatMap((item) =>
			item.subItems?.length ? [item, ...item.subItems] : [item]
		)
	),
	...footerNavLinks,
];

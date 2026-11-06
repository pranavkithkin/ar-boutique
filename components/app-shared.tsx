import type { ReactNode } from "react";
import {
	LayoutGridIcon,
	PackageIcon,
	TagIcon,
	BoxesIcon,
	ShoppingBagIcon,
	RotateCcwIcon,
	CreditCardIcon,
	ImageIcon,
	SettingsIcon,
	BookOpenIcon,
	PaletteIcon,
	UsersIcon,
	TicketPercentIcon,
	StarIcon,
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
		label: "Main",
		items: [
			{
				title: "Overview",
				path: "/admin",
				icon: <LayoutGridIcon />,
			},
			{
				title: "Customer Orders",
				path: "/admin/orders",
				icon: <ShoppingBagIcon />,
			},
			{
				title: "Returns & Exchanges",
				path: "/admin/returns",
				icon: <RotateCcwIcon />,
			},
			{
				title: "Customers",
				path: "/admin/customers",
				icon: <UsersIcon />,
			},
			{
				title: "Product Reviews",
				path: "/admin/reviews",
				icon: <StarIcon />,
			},
		],
	},
	{
		label: "Catalogue",
		items: [
			{
				title: "Products",
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
		],
	},
	{
		label: "Store Configuration",
		items: [
			{
				title: "Banners & Promos",
				path: "/admin/banners",
				icon: <ImageIcon />,
			},
			{
				title: "Editorial Journal",
				path: "/admin/blog",
				icon: <BookOpenIcon />,
			},
			{
				title: "Promo Codes & Discounts",
				path: "/admin/coupons",
				icon: <TicketPercentIcon />,
			},
			{
				title: "Payment Methods",
				path: "/admin/payments",
				icon: <CreditCardIcon />,
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

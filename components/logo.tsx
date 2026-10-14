import type React from "react";
import Image from "next/image";

export const LogoIcon = ({ className, ...props }: React.ComponentProps<"div">) => (
	<div
		className={`relative inline-flex items-center justify-center shrink-0 ${className || "size-6"}`}
		{...props}
	>
		<Image
			src="/images/logo-black.png"
			alt="AR Boutique"
			width={32}
			height={32}
			className="size-full object-contain"
			unoptimized
		/>
	</div>
);

export const Logo = ({ className, ...props }: React.ComponentProps<"div">) => (
	<div
		className={`relative inline-flex items-center justify-center shrink-0 ${className || "h-8 w-auto"}`}
		{...props}
	>
		<Image
			src="/images/logo-black.png"
			alt="AR Boutique"
			width={120}
			height={48}
			className="h-full w-auto object-contain"
			unoptimized
		/>
	</div>
);

import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { fontSans, fontHeading, fontMono } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "AR Boutique",
  description: "Explore The AR Boutique's catalogue preview. Product and store information is awaiting confirmation; purchases are not available.",
  robots: { index: false, follow: false },
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en"
      className={cn("h-full scroll-smooth", "antialiased", "font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

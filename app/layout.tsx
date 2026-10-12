import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { fontSans, fontHeading, fontMono } from "@/lib/fonts";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: "AR Boutique",
  description: "Timeless style meets modern elegance. Designed for the way you live.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn("h-full scroll-smooth", "antialiased", "font-sans", fontSans.variable, fontHeading.variable, fontMono.variable)}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
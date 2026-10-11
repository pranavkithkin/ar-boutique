import Link from "next/link";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreButton } from "@/components/store/StoreButton";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <StoreHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <p className="mb-4 text-sm text-muted-foreground">404</p>
        <h1 className="font-heading text-4xl md:text-5xl">Page Not Found</h1>
        <p className="mt-5 max-w-md text-base text-muted-foreground">
          This page is not available. Explore the collection or return to the homepage.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <StoreButton nativeButton={false} render={<Link href="/collections" />} className="px-6">Browse the collection</StoreButton>
          <StoreButton nativeButton={false} render={<Link href="/" />} variant="outline" className="border-input px-6">Return to Home</StoreButton>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}

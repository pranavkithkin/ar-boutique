import Link from "next/link"
import { AnnouncementBar } from "@/components/store/AnnouncementBar"
import { StoreHeader } from "@/components/store/StoreHeader"
import { HeroSlider } from "@/components/store/HeroSlider"
import { SectionHeading } from "@/components/store/SectionHeading"
import { CategoryCircle } from "@/features/categories/components/CategoryCircle"
import { ProductCard } from "@/components/store/ProductCard"
import { StoreButton } from "@/components/store/StoreButton"
import { PromoBanner } from "@/components/store/PromoBanner"
import { BlogCard } from "@/features/blog/components/BlogCard"
import { StoreFooter } from "@/components/store/StoreFooter"
import { getProductsPage } from "@/lib/products"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const CATEGORIES = [
  {
    name: "Co-ord Set",
    slug: "co-ord-set",
    imageSrc:
      "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_600/ar-dev/products/8a7f570c-eb0e-4395-b076-dceea35f2591/0d318751-ff56-4a96-a2f8-bcb885c1cf20/jab24cd00489",
  },
  {
    name: "Dress",
    slug: "dress",
    imageSrc:
      "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_600/ar-dev/products/e541ddf1-53c2-417a-877e-b06763d2199d/baa031ac-462d-45d4-9bd5-024f59e11943/j0395-dr",
  },
  {
    name: "Kurta",
    slug: "kurta",
    imageSrc:
      "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_600/ar-dev/products/5395c50a-43aa-47ca-be0a-9f1fc97a1c4d/b493c266-03b4-4d34-9bbf-53adf82a460e/jne4124-kr",
  },
  {
    name: "Set",
    slug: "set",
    imageSrc:
      "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_600/ar-dev/products/c8dd1b6b-4f84-4c50-a5be-dbfc783e2d0b/e6c009b4-87b8-4cb0-985a-4c39fe825fc8/jab24st00577",
  },
  {
    name: "Top",
    slug: "top",
    imageSrc:
      "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_600/ar-dev/products/be7da261-1489-4137-92e9-8bd95750eeb2/efbe2b76-7185-4a58-bef8-4c2c3ddafc11/jne4207-tp",
  },
]

export default async function Home() {
  // Fetch real latest products for New Arrivals (limit 8, sorted newest)
  const { products: newArrivals } = await getProductsPage({
    limit: 8,
    sort: "newest",
  })

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AnnouncementBar text="FREE SHIPPING ON ORDERS OVER 150 AED | EASY RETURNS WITHIN 14 DAYS" />
      <StoreHeader />

      <main className="flex-1 -mt-20">
        <HeroSlider />

        {/* Shop by Category Section */}
        <section className="pt-8 md:pt-12 pb-6 md:pb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading className="mb-8 md:mb-12">Shop by Category</SectionHeading>
          <div
            className="flex gap-6 sm:gap-8 md:gap-10 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar justify-start md:justify-center"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CATEGORIES.map((cat, i) => (
              <CategoryCircle
                key={i}
                name={cat.name}
                imageSrc={cat.imageSrc}
                href={`/collections?category=${cat.slug}`}
              />
            ))}
          </div>
        </section>

        {/* New Arrivals Section */}
        <section className="py-6 md:py-8 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <SectionHeading className="mb-8 md:mb-12">New Arrivals</SectionHeading>
          
          {newArrivals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Check back soon for new arrivals.</p>
            </div>
          ) : (
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full relative mb-8 md:mb-12"
            >
              <CarouselContent className="-ml-2 md:-ml-3">
                {newArrivals.map((prod) => (
                  <CarouselItem key={prod.id} className="pl-2 md:pl-3 basis-[60%] sm:basis-[45%] md:basis-1/3 xl:basis-1/4">
                    <ProductCard
                      brand={prod.brand}
                      name={prod.name}
                      price={prod.price}
                      imageSrc={prod.imageSrc}
                      href={`/collections/${prod.slug}`}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-4 lg:-left-12 bg-background/90 hover:bg-background border-border" />
                <CarouselNext className="-right-4 lg:-right-12 bg-background/90 hover:bg-background border-border" />
              </div>
            </Carousel>
          )}

          <div className="flex justify-center">
            <Link href="/collections">
              <StoreButton variant="outline" className="px-8 border-input text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer">
                View All New Arrivals
              </StoreButton>
            </Link>
          </div>
        </section>

        {/* Promo Banner Section */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 mb-6 md:mt-10 md:mb-8">
          <div className="flex flex-col w-full gap-4 md:gap-6">
            <PromoBanner
              imageSrc="/images/promo_banner_new.jpg"
              eyebrow="LIMITED TIME ONLY"
              title="Summer Refresh"
              description="Enjoy up to 30% off selected styles."
              buttonText="SHOP THE SALE"
            />
          </div>
        </section>

        {/* Journal Section */}
        <section className="pt-6 pb-10 md:pt-8 md:pb-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading className="mb-2">From the Journal</SectionHeading>
          <p className="text-[13px] text-muted-foreground mb-8 md:mb-12">Discover the latest trends, styling tips, and brand news.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
             {[
               { title: "How to transition your wardrobe for the new season", category: "Style Guide", img: "/images/journal_style.jpg" },
               { title: "Behind the scenes: The making of our latest collection", category: "Brand News", img: "/images/journal_bts_2.jpg" },
               { title: "5 effortless looks for your next summer getaway", category: "Inspiration", img: "/images/journal_inspiration.jpg" }
             ].map((post, i) => (
                <BlogCard
                  key={i}
                  title={post.title}
                  category={post.category}
                  imageSrc={post.img}
                  href="/journal"
                />
             ))}
          </div>
        </section>
      </main>

      <StoreFooter />
    </div>
  );
}

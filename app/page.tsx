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
  AnimatedSection,
  AnimatedDiv,
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/store/AnimatedSection"

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
  // Fetch real latest products for New Arrivals (limit 10, sorted newest)
  const { products: newArrivals } = await getProductsPage({
    limit: 10,
    sort: "newest",
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 -mt-20">
        <FadeIn delay={0.05}>
          <HeroSlider />
        </FadeIn>

        {/* Shop by Category Section */}
        <AnimatedSection className="pt-8 md:pt-12 pb-6 md:pb-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading className="mb-8 md:mb-12">Shop by Category</SectionHeading>
          <StaggerContainer
            staggerDelay={0.07}
            className="flex gap-6 sm:gap-8 md:gap-10 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar justify-start md:justify-center"
          >
            {CATEGORIES.map((cat, i) => (
              <StaggerItem key={i}>
                <CategoryCircle
                  name={cat.name}
                  imageSrc={cat.imageSrc}
                  href={`/collections?category=${cat.slug}`}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </AnimatedSection>

        {/* New Arrivals Section */}
        <AnimatedSection delay={0.05} className="py-6 md:py-8 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <SectionHeading className="mb-8 md:mb-12">New Arrivals</SectionHeading>
          
          {newArrivals.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Check back soon for new arrivals.</p>
            </div>
          ) : (
            <AnimatedDiv delay={0.08}>
              <Carousel
                opts={{
                  align: "start",
                }}
                className="w-full relative mb-8 md:mb-12"
              >
                <CarouselContent className="-ml-2 md:-ml-3">
                  {newArrivals.map((prod) => (
                    <CarouselItem key={prod.id} className="pl-2 md:pl-3 basis-[60%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                      <ProductCard
                        brand={prod.brand}
                        name={prod.name}
                        price={prod.price}
                        imageSrc={prod.imageSrc}
                        href={`/collections/${prod.slug}`}
                        sizes={prod.sizes}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="-left-4 lg:-left-12 bg-background/90 hover:bg-background border-border" />
                  <CarouselNext className="-right-4 lg:-right-12 bg-background/90 hover:bg-background border-border" />
                </div>
              </Carousel>
            </AnimatedDiv>
          )}

          <AnimatedDiv delay={0.12} className="flex justify-center">
            <Link href="/collections">
              <StoreButton variant="outline" className="px-8 border-input text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                View All New Arrivals
              </StoreButton>
            </Link>
          </AnimatedDiv>
        </AnimatedSection>

        {/* Promo Banner Section: reuse the client's existing collection photo. */}
        <AnimatedSection delay={0.08} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 mb-6 md:mt-10 md:mb-8">
          <div className="flex flex-col w-full gap-4 md:gap-6">
            <PromoBanner
              imageSrc="/images/promo_banner_summer.png"
              imageAlt="Sunlit Garden Bouquet - Summer Refresh"
              imageFit="cover"
              eyebrow="LIMITED TIME ONLY"
              title="Summer Refresh"
              description="Enjoy up to 30% off selected styles."
              buttonText="SHOP THE SALE"
              buttonHref="/collections"
            />
          </div>
        </AnimatedSection>

        {/* Journal Section */}
        <AnimatedSection delay={0.1} className="pt-6 pb-10 md:pt-8 md:pb-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading className="mb-2">From the Journal</SectionHeading>
          <p className="text-[13px] text-muted-foreground mb-8 md:mb-12">Discover the latest trends, styling tips, and brand news.</p>
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left mb-10">
             {[
               {
                 title: "How to transition your wardrobe for the new season",
                 category: "Style Guide",
                 img: "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_640/ar-dev/products/55b382e9-331d-490e-88c1-e02bc891a4b9/85a48544-58c4-46d8-aba0-98ad9bcd54fe/jaa25dr01202",
                 imageAlt: "Dress JAA25DR01202 - View 1",
                 slug: "how-to-transition-your-wardrobe-for-the-new-season",
               },
               {
                 title: "Behind the scenes: The making of our latest collection",
                 category: "Brand Story",
                 img: "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_640/ar-dev/products/8c3a236f-6172-47fe-a9cd-45b18ff9a7f9/37b3c5e3-63c4-4920-b372-57c10adb0afd/jaa25cd01945",
                 imageAlt: "Co-ord set JAA25CD01945 - View 1",
                 slug: "the-making-of-our-latest-collection",
               },
               {
                 title: "5 effortless looks for your next festive getaway",
                 category: "Inspiration",
                 img: "https://res.cloudinary.com/q8qdyl3f/image/upload/f_auto,q_auto,c_limit,w_640/ar-dev/products/c8dd1b6b-4f84-4c50-a5be-dbfc783e2d0b/e6c009b4-87b8-4cb0-985a-4c39fe825fc8/jab24st00577",
                 imageAlt: "Set JAB24ST00577 - View 1",
                 slug: "effortless-looks-for-your-festive-getaway",
               },
             ].map((post, i) => (
                <StaggerItem key={i}>
                  <BlogCard
                    title={post.title}
                    category={post.category}
                    imageSrc={post.img}
                    imageAlt={post.imageAlt}
                    imageFit="cover"
                    href={`/journal/${post.slug}`}
                  />
                </StaggerItem>
             ))}
          </StaggerContainer>

          <AnimatedDiv delay={0.15} className="flex justify-center">
            <Link href="/journal">
              <StoreButton variant="outline" className="px-8 border-input text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]">
                View All Journal Stories
              </StoreButton>
            </Link>
          </AnimatedDiv>
        </AnimatedSection>
      </main>

      <StoreFooter />
    </div>
  );
}

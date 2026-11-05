import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function JournalPageHeader() {
  return (
    <div className="bg-muted/50 py-8 md:py-12 border-b border-border/40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb className="mb-4 md:mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="hover:text-foreground">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>The Journal</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
    
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-heading font-normal text-foreground tracking-tight mb-3">
            The Journal
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Reflections on heritage crafts, modern silhouette styling, and the unhurried artistry behind our signature collections.
          </p>
        </div>
      </div>
    </div>
  )
}

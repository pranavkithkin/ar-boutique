import { NextResponse, type NextRequest } from "next/server"
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { isClerkConfigured } from "@/lib/clerk"

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/collections(.*)",
  "/products(.*)",
  "/cart",
  "/checkout(.*)",
  "/about",
  "/contact",
  "/journal(.*)",
  "/policies(.*)",
  "/size-guide",
  "/api(.*)",
  "/admin(.*)", // Admin routes handle their own Supabase Auth
])

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    const { userId } = await auth()
    const sessionCookie = request.cookies.get("ar_customer_session")?.value
    if (!userId && !sessionCookie) {
      const signInUrl = new URL("/sign-in", request.url)
      signInUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function proxy(request: NextRequest, event: any) {
  if (!isClerkConfigured()) {
    return NextResponse.next()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (clerkHandler as any)(request, event)
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}

import { NextResponse } from "next/server"
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

export default clerkMiddleware(async (auth, request) => {
  if (!isClerkConfigured()) {
    return NextResponse.next()
  }

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

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}

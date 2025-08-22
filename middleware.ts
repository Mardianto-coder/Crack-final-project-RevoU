import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const session = await auth();
  const url = req.nextUrl;

  const protectedPrefixes = ["/dashboard"];
  const needsAuth = protectedPrefixes.some(prefix => url.pathname.startsWith(prefix));

  if (needsAuth && !session?.user) {
    const signInUrl = new URL("/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", url.toString());
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};

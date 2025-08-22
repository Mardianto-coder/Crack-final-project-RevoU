import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mini LMS",
  description: "A Next.js + Prisma LMS starter"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
          <div className="container flex items-center gap-4 py-3">
            <Link href="/" className="font-semibold">Mini LMS</Link>
            <nav className="ml-auto flex items-center gap-3">
              <Link href="/" className="hover:underline">Catalog</Link>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              {session?.user ? (
                <form action={async () => { "use server"; await signOut(); }}>
                  <button className="px-3 py-1 rounded bg-gray-900 text-white">Sign out</button>
                </form>
              ) : (
                <Link href="/signin" className="px-3 py-1 rounded bg-gray-900 text-white">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  );
}

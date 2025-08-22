import Link from "next/link";
import { prisma } from "@/lib/prisma";

function minutesToNice(m: number) {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h}h ${r}m` : `${r}m`;
}

export const revalidate = 60;

export default async function CatalogPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { lessons: true }
  });

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Course Catalog</h1>
      <div className="grid md:grid-cols-2 gap-3">
        {courses.map(c => (
          <Link key={c.id} href={`/course/${c.slug}`} className="block border rounded-xl bg-white p-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{c.title}</h2>
              <span className="text-xs rounded-full bg-gray-100 px-2 py-1">{c.level}</span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{c.description}</p>
            <div className="text-xs text-gray-500 mt-2">{c.category} • {minutesToNice(c.durationMins)} • {c.lessons.length} lessons</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

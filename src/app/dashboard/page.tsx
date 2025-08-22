import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) {
    return <p>Please sign in.</p>;
  }

  const [enrollments, progress] = await Promise.all([
    prisma.enrollment.findMany({ where: { userId: (session.user as any).id }, include: { course: true } }),
    prisma.progress.findMany({ where: { userId: (session.user as any).id }, include: { course: true } })
  ]);

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-3">
        {enrollments.map(e => {
          const p = progress.find(pr => pr.courseId === e.courseId);
          return (
            <div key={e.id} className="border rounded-xl bg-white p-4">
              <div className="flex items-center justify-between">
                <Link href={`/course/${e.course.slug}`} className="font-medium hover:underline">{e.course.title}</Link>
                <span className="text-xs text-gray-500">{p?.quizScore ? `Quiz: ${p.quizScore}%` : "No quiz yet"}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">{e.course.category} • {e.course.level}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

export const revalidate = 60;

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { lessons: { orderBy: { order: "asc" } }, quiz: true }
  });
  if (!course) return notFound();

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <aside className="md:col-span-1 space-y-2">
        {course.lessons.map(lesson => (
          <a key={lesson.id} href={`#${lesson.id}`} className="block border rounded-xl p-3 bg-white">
            <div className="text-sm font-medium">{lesson.title}</div>
            <div className="text-xs text-gray-500 line-clamp-2">{lesson.content}</div>
          </a>
        ))}
        {course.quiz ? (
          <a href="#quiz" className="block text-center bg-gray-900 text-white p-2 rounded-xl">Take Quiz</a>
        ) : null}
      </aside>
      <article className="md:col-span-2 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          <p className="text-gray-600 mt-1">{course.description}</p>
        </header>
        {course.lessons.map(lesson => (
          <section key={lesson.id} id={lesson.id} className="bg-white border rounded-xl p-4">
            <h2 className="text-lg font-semibold">{lesson.title}</h2>
            <p className="text-sm leading-6 mt-1 whitespace-pre-wrap">{lesson.content}</p>
          </section>
        ))}
        {course.quiz ? (
          <section id="quiz" className="bg-white border rounded-xl p-4">
            <h2 className="text-lg font-semibold">{course.quiz.title}</h2>
            {!session?.user ? (
              <p className="text-sm text-gray-600">Sign in to take the quiz.</p>
            ) : (
              <QuizClient courseId={course.id} quiz={course.quiz} />
            )}
          </section>
        ) : null}
      </article>
    </div>
  );
}

function QuizClient({ courseId, quiz }: { courseId: string, quiz: any }) {
  // Client component shim without separate file
  return (
    <form action={async (formData) => {
      "use server";
      const answers = JSON.parse(String(formData.get("answers") || "[]")) as number[];
      const correct = (quiz.questions as any[]).reduce((acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0), 0);
      const score = Math.round((correct / (quiz.questions as any[]).length) * 100);
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/progress`, {
        method: "POST",
        body: JSON.stringify({ courseId, score }),
        headers: { "content-type": "application/json" }
      });
    }}>
      <input name="answers" className="hidden" defaultValue="[]" />
      <p className="text-sm text-gray-600">This demo shows a server action shape; wire up a client component or JS to set answers.</p>
      <button className="mt-2 px-3 py-2 rounded bg-gray-900 text-white">Submit (demo)</button>
    </form>
  );
}

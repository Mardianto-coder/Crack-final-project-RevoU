import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { courseId, completedLessonId, score } = await req.json();

  const prev = await prisma.progress.findFirst({ where: { userId: (session.user as any).id, courseId } });
  const completed = prev?.completedLessonIds || [];
  const nextCompleted = completedLessonId && !completed.includes(completedLessonId)
    ? [...completed, completedLessonId] : completed;

  const up = await prisma.progress.upsert({
    where: { userId_courseId: { userId: (session.user as any).id, courseId } } as any,
    update: { completedLessonIds: nextCompleted, quizScore: score ?? prev?.quizScore ?? null },
    create: { userId: (session.user as any).id, courseId, completedLessonIds: nextCompleted, quizScore: score ?? null }
  });
  return NextResponse.json(up, { status: 201 });
}

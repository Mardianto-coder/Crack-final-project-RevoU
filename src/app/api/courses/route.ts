import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { courseMetaSchema } from "@/lib/validators";

export async function GET() {
  const data = await prisma.course.findMany({ include: { lessons: true, quiz: true } });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || !["INSTRUCTOR","ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const body = await req.json();
  const parsed = courseMetaSchema.safeParse({
    ...body,
    durationMins: Number(body.durationMins)
  });
  if (!parsed.success) return NextResponse.json(parsed.error.format(), { status: 400 });

  const { slug, title, description, category, level, durationMins } = parsed.data;
  const course = await prisma.course.create({ data: { slug, title, description, category, level, durationMins } });
  return NextResponse.json(course, { status: 201 });
}

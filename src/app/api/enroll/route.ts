import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { courseId } = await req.json();
  const enr = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: (session.user as any).id, courseId } },
    update: {},
    create: { userId: (session.user as any).id, courseId }
  });
  return NextResponse.json(enr, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const data = await prisma.course.findUnique({ where: { id: params.id }, include: { lessons: true, quiz: true } });
  if (!data) return new NextResponse("Not Found", { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !["INSTRUCTOR","ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const body = await req.json();
  const course = await prisma.course.update({ where: { id: params.id }, data: body });
  return NextResponse.json(course);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || !["INSTRUCTOR","ADMIN"].includes((session.user as any).role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  await prisma.course.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const { path } = await req.json();
  if (!path) return new NextResponse("path is required", { status: 400 });
  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}

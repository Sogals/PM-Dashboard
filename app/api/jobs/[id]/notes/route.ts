import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const notes = await prisma.jobNote.findMany({
      where: { jobId: id },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error("GET /api/jobs/[id]/notes error:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const note = await prisma.jobNote.create({
      data: {
        jobId: id,
        content: body.content,
        date: body.date ? new Date(body.date) : new Date(),
        author: body.author ?? null,
        isHighlighted: body.isHighlighted ?? false,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs/[id]/notes error:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        machineType: true,
        options: true,
        milestones: { orderBy: [{ category: "asc" }, { order: "asc" }] },
        notes: { orderBy: { date: "desc" } },
        lateParts: true,
        checklistItems: { orderBy: [{ category: "asc" }, { order: "asc" }] },
        risks: { orderBy: { createdAt: "desc" } },
        changeHistory: { orderBy: { changedAt: "desc" } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get current job to track changes
    const currentJob = await prisma.job.findUnique({ where: { id } });
    if (!currentJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Build change history entries
    const changedFields: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
    const trackFields = ["projectStatus", "salesStatus", "shipDate", "assemblyDate", "testDate", "slipDays", "priority"];

    for (const field of trackFields) {
      const oldVal = currentJob[field as keyof typeof currentJob];
      const newVal = body[field];
      if (newVal !== undefined && String(oldVal) !== String(newVal)) {
        changedFields.push({
          field,
          oldValue: oldVal != null ? String(oldVal) : null,
          newValue: newVal != null ? String(newVal) : null,
        });
      }
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "projectStatus", "salesStatus", "moduleNumber", "assemblyDate", "testDate", "shipDate",
      "pastAssemblyDate", "pastTestDate", "pastShipDate", "slipDays", "shippingType",
      "arrangedBy", "powerSpec", "salesRep", "planner", "assemblyTech", "testTech",
      "priority", "tags",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (["assemblyDate", "testDate", "shipDate", "pastAssemblyDate", "pastTestDate", "pastShipDate"].includes(field)) {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...updateData,
        ...(changedFields.length > 0 ? {
          changeHistory: {
            create: changedFields.map((c) => ({
              field: c.field,
              oldValue: c.oldValue,
              newValue: c.newValue,
              changedBy: body.changedBy ?? "System",
            })),
          },
        } : {}),
      },
      include: { customer: true, machineType: true },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("PUT /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}

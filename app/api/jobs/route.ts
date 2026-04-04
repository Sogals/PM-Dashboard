import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const salesStatus = searchParams.get("salesStatus");
    const machineTypeId = searchParams.get("machineTypeId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.projectStatus = status;
    if (salesStatus) where.salesStatus = salesStatus;
    if (machineTypeId) where.machineTypeId = machineTypeId;
    if (search) {
      where.OR = [
        { projectNG: { contains: search } },
        { moduleNumber: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      include: { customer: true, machineType: true },
      orderBy: { shipDate: "asc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const job = await prisma.job.create({
      data: {
        projectNG: body.projectNG,
        moduleNumber: body.moduleNumber,
        salesStatus: body.salesStatus,
        projectStatus: body.projectStatus,
        customerId: body.customerId,
        machineTypeId: body.machineTypeId,
        assemblyDate: body.assemblyDate ? new Date(body.assemblyDate) : undefined,
        testDate: body.testDate ? new Date(body.testDate) : undefined,
        shipDate: body.shipDate ? new Date(body.shipDate) : undefined,
        slipDays: body.slipDays ?? 0,
        salesRep: body.salesRep,
        planner: body.planner,
        priority: body.priority ?? "Normal",
      },
      include: { customer: true, machineType: true },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}

import prisma from "@/lib/db";
import GanttClient from "./GanttClient";

export const dynamic = "force-dynamic";

export default async function GanttPage() {
  const [jobs, machineTypes] = await Promise.all([
    prisma.job.findMany({
      include: { customer: true, machineType: true },
      orderBy: { shipDate: "asc" },
    }),
    prisma.machineType.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serializedJobs = jobs.map((job) => ({
    ...job,
    assemblyDate: job.assemblyDate?.toISOString() ?? null,
    testDate: job.testDate?.toISOString() ?? null,
    shipDate: job.shipDate?.toISOString() ?? null,
    pastAssemblyDate: job.pastAssemblyDate?.toISOString() ?? null,
    pastTestDate: job.pastTestDate?.toISOString() ?? null,
    pastShipDate: job.pastShipDate?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    customer: job.customer,
    machineType: job.machineType,
  }));

  return <GanttClient jobs={serializedJobs} machineTypes={machineTypes} />;
}

import prisma from "@/lib/db";
import { formatDate, getProjectStatusColor, getSalesStatusColor, getSlipBadgeColor } from "@/lib/utils";
import Link from "next/link";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [jobs, machineTypes] = await Promise.all([
    prisma.job.findMany({
      include: { customer: true, machineType: true },
      orderBy: [{ projectStatus: "asc" }, { shipDate: "asc" }],
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

  return (
    <OrdersClient
      jobs={serializedJobs}
      machineTypes={machineTypes}
    />
  );
}

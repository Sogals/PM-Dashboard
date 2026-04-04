import prisma from "@/lib/db";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [statuses, machineTypes, milestoneTemplates] = await Promise.all([
    prisma.statusConfig.findMany({ orderBy: [{ type: "asc" }, { order: "asc" }] }),
    prisma.machineType.findMany({ orderBy: { name: "asc" } }),
    prisma.milestoneTemplate.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
  ]);

  return (
    <AdminClient
      statuses={statuses}
      machineTypes={machineTypes}
      milestoneTemplates={milestoneTemplates}
    />
  );
}

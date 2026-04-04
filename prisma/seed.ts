import { PrismaClient } from "../app/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Seeding database...");

  // Clean up
  await prisma.changeHistory.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.latePart.deleteMany();
  await prisma.jobNote.deleteMany();
  await prisma.jobMilestone.deleteMany();
  await prisma.jobOption.deleteMany();
  await prisma.job.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.machineType.deleteMany();
  await prisma.statusConfig.deleteMany();
  await prisma.milestoneTemplate.deleteMany();

  // Machine Types
  const machineTypes = await Promise.all([
    prisma.machineType.create({ data: { name: "Gen 6 2500", description: "Generation 6 - 2500 series" } }),
    prisma.machineType.create({ data: { name: "Gen 6 1700", description: "Generation 6 - 1700 series" } }),
    prisma.machineType.create({ data: { name: "Gen 5 1700", description: "Generation 5 - 1700 series" } }),
    prisma.machineType.create({ data: { name: "Gen 5 1200", description: "Generation 5 - 1200 series" } }),
    prisma.machineType.create({ data: { name: "Gen 5 2500", description: "Generation 5 - 2500 series" } }),
  ]);

  const mtMap: Record<string, string> = {};
  machineTypes.forEach((mt) => { mtMap[mt.name] = mt.id; });

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "Amcor Osh. South", region: "Southeast" } }),
    prisma.customer.create({ data: { name: "Print Pro - Wrightstown", region: "Midwest" } }),
    prisma.customer.create({ data: { name: "Clear Film", region: "West" } }),
    prisma.customer.create({ data: { name: "CNG Legacy", region: "Central" } }),
    prisma.customer.create({ data: { name: "PPC", region: "Northeast" } }),
    prisma.customer.create({ data: { name: "ProAmpac - Quebec", region: "Canada" } }),
    prisma.customer.create({ data: { name: "Print - Stock (GP Bowling Green)", region: "South" } }),
    prisma.customer.create({ data: { name: "Meridian on the Move", region: "Midwest" } }),
    prisma.customer.create({ data: { name: "Print - Stock (Mark B)", region: "West" } }),
    prisma.customer.create({ data: { name: "Japs-Olson", region: "Midwest" } }),
    prisma.customer.create({ data: { name: "Crosslink", region: "Southeast" } }),
    prisma.customer.create({ data: { name: "Georgia-Pacific", region: "South" } }),
    prisma.customer.create({ data: { name: "Portco", region: "West" } }),
    prisma.customer.create({ data: { name: "K Fair - Transcend Pkg UK", region: "International" } }),
    prisma.customer.create({ data: { name: "Goelzer", region: "Midwest" } }),
  ]);

  const custMap: Record<string, string> = {};
  customers.forEach((c) => { custMap[c.name] = c.id; });

  // Status Configs
  await prisma.statusConfig.createMany({
    data: [
      { type: "projectStatus", value: "IN PROCUREMENT", color: "#3B82F6", order: 1 },
      { type: "projectStatus", value: "IN ENGINEERING", color: "#F59E0B", order: 2 },
      { type: "projectStatus", value: "ASSEMBLY", color: "#8B5CF6", order: 3 },
      { type: "projectStatus", value: "TESTING", color: "#F97316", order: 4 },
      { type: "projectStatus", value: "SHIPPED (SOLD)", color: "#10B981", order: 5 },
      { type: "projectStatus", value: "SHIPPED (NOT SOLD)", color: "#6B7280", order: 6 },
      { type: "salesStatus", value: "SOLD", color: "#10B981", order: 1 },
      { type: "salesStatus", value: "FORECAST", color: "#F59E0B", order: 2 },
      { type: "salesStatus", value: "DEMO", color: "#8B5CF6", order: 3 },
      { type: "salesStatus", value: "CLAIMED", color: "#F97316", order: 4 },
    ],
  });

  // Milestone Templates
  await prisma.milestoneTemplate.createMany({
    data: [
      { name: "BOM Released", category: "engineering", order: 1 },
      { name: "Drawings Approved", category: "engineering", order: 2 },
      { name: "Parts Ordered", category: "engineering", order: 3 },
      { name: "Parts Received", category: "engineering", order: 4 },
      { name: "Assembly Start", category: "operations", order: 1 },
      { name: "Assembly Complete", category: "operations", order: 2 },
      { name: "Testing Start", category: "operations", order: 3 },
      { name: "Testing Complete", category: "operations", order: 4 },
      { name: "FAT Scheduled", category: "commercial", order: 1 },
      { name: "FAT Complete", category: "commercial", order: 2 },
      { name: "Invoice Sent", category: "commercial", order: 3 },
      { name: "Payment Received", category: "commercial", order: 4 },
    ],
  });

  // Jobs
  const jobsData = [
    {
      projectNG: "NG4477341",
      moduleNumber: "RC02-00010",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "Amcor Osh. South",
      machineTypeName: "Gen 6 2500",
      assemblyDate: new Date("2026-04-14"),
      testDate: new Date("2026-04-28"),
      shipDate: new Date("2026-05-09"),
      pastAssemblyDate: new Date("2026-03-31"),
      pastTestDate: new Date("2026-04-14"),
      pastShipDate: new Date("2026-04-25"),
      slipDays: 14,
      salesRep: "J. Martinez",
      planner: "B. Thompson",
      assemblyTech: "K. Williams",
      testTech: "D. Johnson",
      priority: "High",
      powerSpec: "480V/60Hz/3Ph",
    },
    {
      projectNG: "NG4480194",
      moduleNumber: "RC02-00011",
      salesStatus: "SOLD",
      projectStatus: "IN PROCUREMENT",
      customerName: "Print Pro - Wrightstown",
      machineTypeName: "Gen 6 1700",
      assemblyDate: new Date("2026-05-05"),
      testDate: new Date("2026-05-19"),
      shipDate: new Date("2026-05-30"),
      slipDays: 0,
      salesRep: "A. Chen",
      planner: "B. Thompson",
      priority: "Normal",
      powerSpec: "208V/60Hz/3Ph",
    },
    {
      projectNG: "NG4480190",
      moduleNumber: "RC02-00012",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "Clear Film",
      machineTypeName: "Gen 5 1700",
      assemblyDate: new Date("2026-04-21"),
      testDate: new Date("2026-05-05"),
      shipDate: new Date("2026-05-16"),
      pastAssemblyDate: new Date("2026-04-14"),
      pastTestDate: new Date("2026-04-28"),
      pastShipDate: new Date("2026-05-09"),
      slipDays: 7,
      salesRep: "J. Martinez",
      planner: "S. Garcia",
      assemblyTech: "R. Davis",
      priority: "High",
      powerSpec: "480V/60Hz/3Ph",
    },
    {
      projectNG: "NG4484160",
      moduleNumber: "RC02-00013",
      salesStatus: "FORECAST",
      projectStatus: "IN PROCUREMENT",
      customerName: "CNG Legacy",
      machineTypeName: "Gen 6 2500",
      assemblyDate: new Date("2026-06-02"),
      testDate: new Date("2026-06-16"),
      shipDate: new Date("2026-06-27"),
      slipDays: 0,
      salesRep: "T. Wilson",
      planner: "B. Thompson",
      priority: "Normal",
    },
    {
      projectNG: "NG4480192",
      moduleNumber: "RC02-00014",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "PPC",
      machineTypeName: "Gen 5 2500",
      assemblyDate: new Date("2026-04-28"),
      testDate: new Date("2026-05-12"),
      shipDate: new Date("2026-05-23"),
      pastAssemblyDate: new Date("2026-04-21"),
      pastTestDate: new Date("2026-05-05"),
      pastShipDate: new Date("2026-05-16"),
      slipDays: 7,
      salesRep: "A. Chen",
      planner: "S. Garcia",
      priority: "Normal",
      powerSpec: "480V/60Hz/3Ph",
    },
    {
      projectNG: "NG4493593",
      moduleNumber: "RC02-00015",
      salesStatus: "SOLD",
      projectStatus: "IN PROCUREMENT",
      customerName: "ProAmpac - Quebec",
      machineTypeName: "Gen 6 1700",
      assemblyDate: new Date("2026-06-09"),
      testDate: new Date("2026-06-23"),
      shipDate: new Date("2026-07-04"),
      slipDays: 0,
      salesRep: "T. Wilson",
      planner: "B. Thompson",
      priority: "Normal",
      shippingType: "Export",
      arrangedBy: "Factory",
    },
    {
      projectNG: "NG4493599",
      moduleNumber: "RC02-00016",
      salesStatus: "DEMO",
      projectStatus: "IN ENGINEERING",
      customerName: "Print - Stock (GP Bowling Green)",
      machineTypeName: "Gen 6 2500",
      assemblyDate: new Date("2026-05-12"),
      testDate: new Date("2026-05-26"),
      shipDate: new Date("2026-06-06"),
      slipDays: 0,
      salesRep: "J. Martinez",
      planner: "S. Garcia",
      priority: "Low",
    },
    {
      projectNG: "NG4480193",
      moduleNumber: "RC02-00017",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "Meridian on the Move",
      machineTypeName: "Gen 5 1200",
      assemblyDate: new Date("2026-05-19"),
      testDate: new Date("2026-06-02"),
      shipDate: new Date("2026-06-13"),
      pastShipDate: new Date("2026-06-06"),
      slipDays: 7,
      salesRep: "A. Chen",
      planner: "B. Thompson",
      assemblyTech: "K. Williams",
      priority: "High",
      powerSpec: "240V/60Hz/1Ph",
    },
    {
      projectNG: "NG4480188",
      moduleNumber: "RC02-00018",
      salesStatus: "CLAIMED",
      projectStatus: "IN PROCUREMENT",
      customerName: "Print - Stock (Mark B)",
      machineTypeName: "Gen 5 1700",
      assemblyDate: new Date("2026-06-16"),
      testDate: new Date("2026-06-30"),
      shipDate: new Date("2026-07-11"),
      slipDays: 0,
      salesRep: "T. Wilson",
      planner: "S. Garcia",
      priority: "Normal",
    },
    {
      projectNG: "NG4493600",
      moduleNumber: "RC02-00019",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "Japs-Olson",
      machineTypeName: "Gen 6 2500",
      assemblyDate: new Date("2026-05-26"),
      testDate: new Date("2026-06-09"),
      shipDate: new Date("2026-06-20"),
      slipDays: 0,
      salesRep: "J. Martinez",
      planner: "B. Thompson",
      priority: "Normal",
      powerSpec: "480V/60Hz/3Ph",
    },
    {
      projectNG: "NG4480196",
      moduleNumber: "RC02-00020",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "Crosslink",
      machineTypeName: "Gen 6 1700",
      assemblyDate: new Date("2026-06-02"),
      testDate: new Date("2026-06-16"),
      shipDate: new Date("2026-06-27"),
      pastAssemblyDate: new Date("2026-05-26"),
      slipDays: 7,
      salesRep: "A. Chen",
      planner: "S. Garcia",
      priority: "Normal",
    },
    {
      projectNG: "NG4460122",
      moduleNumber: "RC01-00098",
      salesStatus: "SOLD",
      projectStatus: "SHIPPED (SOLD)",
      customerName: "Georgia-Pacific",
      machineTypeName: "Gen 5 2500",
      assemblyDate: new Date("2025-11-10"),
      testDate: new Date("2025-11-24"),
      shipDate: new Date("2025-12-05"),
      slipDays: 0,
      salesRep: "J. Martinez",
      planner: "B. Thompson",
      priority: "Normal",
    },
    {
      projectNG: "NG4460120",
      moduleNumber: "RC01-00097",
      salesStatus: "SOLD",
      projectStatus: "SHIPPED (SOLD)",
      customerName: "Portco",
      machineTypeName: "Gen 5 1200",
      assemblyDate: new Date("2025-10-06"),
      testDate: new Date("2025-10-20"),
      shipDate: new Date("2025-10-31"),
      slipDays: 0,
      salesRep: "T. Wilson",
      planner: "S. Garcia",
      priority: "Normal",
    },
    {
      projectNG: "NG4472009",
      moduleNumber: "RC02-00005",
      salesStatus: "FORECAST",
      projectStatus: "IN PROCUREMENT",
      customerName: "K Fair - Transcend Pkg UK",
      machineTypeName: "Gen 6 2500",
      assemblyDate: new Date("2026-07-07"),
      testDate: new Date("2026-07-21"),
      shipDate: new Date("2026-08-01"),
      slipDays: 0,
      salesRep: "T. Wilson",
      planner: "B. Thompson",
      priority: "Normal",
      shippingType: "Export",
      arrangedBy: "Customer",
      powerSpec: "400V/50Hz/3Ph",
    },
    {
      projectNG: "NG4478850",
      moduleNumber: "RC02-00008",
      salesStatus: "SOLD",
      projectStatus: "IN ENGINEERING",
      customerName: "Goelzer",
      machineTypeName: "Gen 5 1700",
      assemblyDate: new Date("2026-05-05"),
      testDate: new Date("2026-05-19"),
      shipDate: new Date("2026-05-30"),
      pastAssemblyDate: new Date("2026-04-28"),
      pastTestDate: new Date("2026-05-12"),
      pastShipDate: new Date("2026-05-23"),
      slipDays: 7,
      salesRep: "A. Chen",
      planner: "B. Thompson",
      assemblyTech: "R. Davis",
      testTech: "D. Johnson",
      priority: "Normal",
      powerSpec: "480V/60Hz/3Ph",
    },
  ];

  for (const jobData of jobsData) {
    const { customerName, machineTypeName, ...rest } = jobData;
    const job = await prisma.job.create({
      data: {
        ...rest,
        customerId: custMap[customerName],
        machineTypeId: mtMap[machineTypeName],
      },
    });

    const isShipped = job.projectStatus === "SHIPPED (SOLD)" || job.projectStatus === "SHIPPED (NOT SOLD)";
    const isEngineering = job.projectStatus === "IN ENGINEERING";

    // Add milestones
    await prisma.jobMilestone.createMany({
      data: [
        { jobId: job.id, name: "BOM Released", category: "engineering", isComplete: isEngineering || isShipped, order: 1 },
        { jobId: job.id, name: "Drawings Approved", category: "engineering", isComplete: isEngineering || isShipped, order: 2 },
        { jobId: job.id, name: "Parts Ordered", category: "engineering", isComplete: true, order: 3 },
        { jobId: job.id, name: "Parts Received", category: "engineering", isComplete: job.slipDays === 0 && isShipped, order: 4 },
        { jobId: job.id, name: "Assembly Start", category: "operations", isComplete: isShipped, order: 1 },
        { jobId: job.id, name: "Assembly Complete", category: "operations", isComplete: isShipped, order: 2 },
        { jobId: job.id, name: "Testing Complete", category: "operations", isComplete: isShipped, order: 3 },
        { jobId: job.id, name: "FAT Scheduled", category: "commercial", isComplete: isEngineering || isShipped, order: 1 },
        { jobId: job.id, name: "Invoice Sent", category: "commercial", isComplete: isShipped, order: 2 },
        { jobId: job.id, name: "Payment Received", category: "commercial", isComplete: false, order: 3 },
      ],
    });

    // Add checklist items
    await prisma.checklistItem.createMany({
      data: [
        { jobId: job.id, category: "engineering", name: "BOM finalized", isComplete: isEngineering || isShipped, order: 1 },
        { jobId: job.id, category: "engineering", name: "Electrical drawings complete", isComplete: isEngineering || isShipped, order: 2 },
        { jobId: job.id, category: "engineering", name: "Software config documented", isComplete: false, order: 3 },
        { jobId: job.id, category: "operations", name: "Work order created", isComplete: true, order: 1 },
        { jobId: job.id, category: "operations", name: "Material kitted", isComplete: isEngineering || isShipped, order: 2 },
        { jobId: job.id, category: "operations", name: "Assembly sign-off", isComplete: isShipped, order: 3 },
        { jobId: job.id, category: "commercial", name: "PO received", isComplete: job.salesStatus === "SOLD", order: 1 },
        { jobId: job.id, category: "commercial", name: "Shipping docs prepared", isComplete: isShipped, order: 2 },
        { jobId: job.id, category: "commercial", name: "Final invoice sent", isComplete: isShipped && job.salesStatus === "SOLD", order: 3 },
      ],
    });

    // Add options
    await prisma.jobOption.createMany({
      data: [
        { jobId: job.id, count: 1, description: "Automatic Film Splice", isHighlighted: false },
        { jobId: job.id, count: 2, description: "Core Cutter", isHighlighted: false },
        { jobId: job.id, count: 1, description: "Tension Control Upgrade", isHighlighted: job.slipDays > 0 },
      ],
    });

    // Add notes
    const noteDate1 = new Date();
    noteDate1.setDate(noteDate1.getDate() - 7);
    const noteDate2 = new Date();
    noteDate2.setDate(noteDate2.getDate() - 3);

    await prisma.jobNote.createMany({
      data: [
        {
          jobId: job.id,
          date: noteDate1,
          content: job.slipDays > 0
            ? `Ship date pushed ${job.slipDays} days due to late parts from supplier. Following up with procurement team.`
            : "Initial planning complete. All parts on order and expected on time.",
          author: job.planner ?? "System",
          isHighlighted: job.slipDays > 14,
        },
        {
          jobId: job.id,
          date: noteDate2,
          content: isEngineering
            ? "Engineering review complete. BOM released to procurement."
            : job.projectStatus === "IN PROCUREMENT"
            ? "Waiting on long-lead items. ETA confirmed with supplier."
            : "Unit shipped and customer notified. Closing out paperwork.",
          author: job.salesRep ?? "System",
          isHighlighted: false,
        },
      ],
    });

    // Add late parts for slipping jobs
    if (job.slipDays > 0) {
      const dockDate = new Date();
      dockDate.setDate(dockDate.getDate() + 5);
      await prisma.latePart.create({
        data: {
          jobId: job.id,
          description: "Main drive controller board",
          dockDate,
          resolved: isShipped,
        },
      });
    }

    // Add risks for high slip jobs
    if (job.slipDays >= 14) {
      await prisma.risk.create({
        data: {
          jobId: job.id,
          description: "Extended slip may impact customer production schedule",
          severity: "High",
          status: "Open",
        },
      });
    }
  }

  console.log("Database seeded successfully!");
  console.log(`Created ${jobsData.length} jobs, ${customers.length} customers, ${machineTypes.length} machine types`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

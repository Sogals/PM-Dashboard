import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatDateLong, getProjectStatusColor, getSalesStatusColor, getSlipBadgeColor } from "@/lib/utils";
import JobDetailClient from "./JobDetailClient";
import {
  ChevronRight,
  Calendar,
  User,
  Zap,
  Truck,
  Tag,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      machineType: true,
      options: { orderBy: { description: "asc" } },
      milestones: { orderBy: [{ category: "asc" }, { order: "asc" }] },
      notes: { orderBy: { date: "desc" } },
      lateParts: { orderBy: { dockDate: "asc" } },
      checklistItems: { orderBy: [{ category: "asc" }, { order: "asc" }] },
      risks: { orderBy: { createdAt: "desc" } },
      changeHistory: { orderBy: { changedAt: "desc" }, take: 20 },
    },
  });

  if (!job) notFound();

  // Serialize dates for client component
  const serializedJob = {
    ...job,
    assemblyDate: job.assemblyDate?.toISOString() ?? null,
    testDate: job.testDate?.toISOString() ?? null,
    shipDate: job.shipDate?.toISOString() ?? null,
    pastAssemblyDate: job.pastAssemblyDate?.toISOString() ?? null,
    pastTestDate: job.pastTestDate?.toISOString() ?? null,
    pastShipDate: job.pastShipDate?.toISOString() ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    milestones: job.milestones.map((m) => ({
      ...m,
      completedAt: m.completedAt?.toISOString() ?? null,
      dueDate: m.dueDate?.toISOString() ?? null,
    })),
    notes: job.notes.map((n) => ({
      ...n,
      date: n.date.toISOString(),
      createdAt: n.createdAt.toISOString(),
    })),
    lateParts: job.lateParts.map((lp) => ({
      ...lp,
      dockDate: lp.dockDate?.toISOString() ?? null,
    })),
    risks: job.risks.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    changeHistory: job.changeHistory.map((c) => ({
      ...c,
      changedAt: c.changedAt.toISOString(),
    })),
  };

  const isShipped = job.projectStatus === "SHIPPED (SOLD)" || job.projectStatus === "SHIPPED (NOT SOLD)";

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/orders" className="hover:text-blue-600 hover:underline">Orders</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{job.projectNG}</span>
      </div>

      {/* Baseball Card Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1.5 w-full ${
          job.projectStatus === "IN PROCUREMENT" ? "bg-blue-500" :
          job.projectStatus === "IN ENGINEERING" ? "bg-amber-500" :
          job.projectStatus === "SHIPPED (SOLD)" ? "bg-green-500" :
          "bg-gray-400"
        }`} />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 font-mono">{job.projectNG}</h1>
                {job.slipDays > 0 && (
                  <span className={`inline-flex items-center rounded-full text-sm px-2.5 py-1 font-medium ${getSlipBadgeColor(job.slipDays)}`}>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    +{job.slipDays}d slip
                  </span>
                )}
              </div>
              <div className="text-gray-500 text-sm mb-4">
                {job.moduleNumber && <span className="font-mono">{job.moduleNumber}</span>}
                {job.moduleNumber && " · "}
                <span className="font-medium text-gray-700">{job.customer.name}</span>
                {" · "}
                <span>{job.machineType.name}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center rounded-full border text-sm px-2.5 py-1 font-medium ${getSalesStatusColor(job.salesStatus)}`}>
                  {job.salesStatus}
                </span>
                <span className={`inline-flex items-center rounded-full border text-sm px-2.5 py-1 font-medium ${getProjectStatusColor(job.projectStatus)}`}>
                  {job.projectStatus}
                </span>
                {job.priority !== "Normal" && (
                  <span className={`inline-flex items-center rounded-full border text-sm px-2.5 py-1 font-medium ${
                    job.priority === "High" ? "bg-red-100 text-red-800 border-red-200" : "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                    {job.priority} Priority
                  </span>
                )}
                {job.tags && job.tags.split(",").map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 text-xs px-2 py-0.5">
                    <Tag className="w-3 h-3" />
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Date triplet */}
            <div className="grid grid-cols-3 gap-4 shrink-0">
              {[
                { label: "Assembly", current: job.assemblyDate, past: job.pastAssemblyDate },
                { label: "Test", current: job.testDate, past: job.pastTestDate },
                { label: "Ship", current: job.shipDate, past: job.pastShipDate },
              ].map((d) => (
                <div key={d.label} className="text-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mx-auto mb-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{d.label}</div>
                  <div className="font-semibold text-gray-900 text-sm">{formatDate(d.current)}</div>
                  {d.past && d.past !== d.current && (
                    <div className="text-xs text-red-500 line-through">{formatDate(d.past)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team / shipping row */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4 text-sm">
            {[
              { label: "Sales Rep", value: job.salesRep, icon: User },
              { label: "Planner", value: job.planner, icon: User },
              { label: "Power Spec", value: job.powerSpec, icon: Zap },
              { label: "Shipping", value: job.shippingType && job.arrangedBy ? `${job.shippingType} · ${job.arrangedBy}` : job.shippingType, icon: Truck },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400">{item.label}</div>
                    <div className="font-medium text-gray-700">{item.value ?? "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Client Tabs Section */}
      <JobDetailClient job={serializedJob} />
    </div>
  );
}

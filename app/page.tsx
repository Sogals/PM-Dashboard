import prisma from "@/lib/db";
import { formatDate, getProjectStatusColor, getSalesStatusColor, getSlipBadgeColor } from "@/lib/utils";
import { differenceInDays } from "date-fns";
import Link from "next/link";
import {
  Package,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Truck,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [allJobs, recentNotes, upcomingMilestones] = await Promise.all([
    prisma.job.findMany({
      include: { customer: true, machineType: true },
      orderBy: { shipDate: "asc" },
    }),
    prisma.jobNote.findMany({
      include: { job: { include: { customer: true } } },
      orderBy: { date: "desc" },
      take: 8,
    }),
    prisma.jobMilestone.findMany({
      where: {
        isComplete: false,
        dueDate: { not: null, lte: thirtyDaysFromNow },
      },
      include: { job: { include: { customer: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const activeJobs = allJobs.filter(
    (j) => j.projectStatus !== "SHIPPED (SOLD)" && j.projectStatus !== "SHIPPED (NOT SOLD)"
  );
  const inProcurement = activeJobs.filter((j) => j.projectStatus === "IN PROCUREMENT");
  const inEngineering = activeJobs.filter((j) => j.projectStatus === "IN ENGINEERING");
  const avgSlip =
    activeJobs.length > 0
      ? Math.round(activeJobs.reduce((sum, j) => sum + j.slipDays, 0) / activeJobs.length)
      : 0;
  const shippingThisMonth = allJobs.filter(
    (j) => j.shipDate && j.shipDate >= startOfMonth && j.shipDate <= endOfMonth
  );
  const atRiskJobs = activeJobs.filter((j) => {
    if (j.slipDays > 0) return true;
    if (j.shipDate) {
      const days = differenceInDays(j.shipDate, today);
      return days <= 30 && days >= 0;
    }
    return false;
  });

  const kpis = [
    {
      label: "Total Active Jobs",
      value: activeJobs.length,
      icon: Package,
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "In Procurement",
      value: inProcurement.length,
      icon: TrendingUp,
      color: "bg-indigo-50 text-indigo-600",
      border: "border-indigo-100",
    },
    {
      label: "In Engineering",
      value: inEngineering.length,
      icon: Wrench,
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
    {
      label: "Avg Slip Days",
      value: avgSlip,
      icon: Clock,
      color: avgSlip === 0 ? "bg-green-50 text-green-600" : avgSlip <= 7 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600",
      border: avgSlip === 0 ? "border-green-100" : avgSlip <= 7 ? "border-amber-100" : "border-red-100",
    },
    {
      label: "Shipping This Month",
      value: shippingThisMonth.length,
      icon: Truck,
      color: "bg-green-50 text-green-600",
      border: "border-green-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`bg-white rounded-xl border ${kpi.border} p-4 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* At-Risk Jobs */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900">At-Risk Jobs</h2>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                {atRiskJobs.length}
              </span>
            </div>
            <Link href="/orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project NG</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ship Date</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Slip</th>
                </tr>
              </thead>
              <tbody>
                {atRiskJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      No at-risk jobs
                    </td>
                  </tr>
                ) : (
                  atRiskJobs.slice(0, 8).map((job) => {
                    const daysLeft = job.shipDate ? differenceInDays(job.shipDate, today) : null;
                    return (
                      <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <Link href={`/orders/${job.id}`} className="font-medium text-blue-600 hover:underline">
                            {job.projectNG}
                          </Link>
                          <div className="text-xs text-gray-400">{job.moduleNumber}</div>
                        </td>
                        <td className="px-3 py-3 text-gray-700">{job.customer.name}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full border text-xs px-2 py-0.5 font-medium ${getProjectStatusColor(job.projectStatus)}`}>
                            {job.projectStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-600">
                          {formatDate(job.shipDate)}
                          {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && (
                            <div className="text-xs text-amber-600">{daysLeft}d remaining</div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {job.slipDays > 0 ? (
                            <span className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${getSlipBadgeColor(job.slipDays)}`}>
                              +{job.slipDays}d
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Status Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Status Summary</h2>
            <div className="space-y-2">
              {[
                { label: "In Procurement", count: inProcurement.length, color: "bg-blue-400" },
                { label: "In Engineering", count: inEngineering.length, color: "bg-amber-400" },
                { label: "Shipping This Month", count: shippingThisMonth.length, color: "bg-green-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 text-sm">Recent Notes</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {recentNotes.slice(0, 5).map((note) => (
                <div key={note.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/orders/${note.job.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                        {note.job.projectNG}
                      </Link>
                      <span className="text-xs text-gray-400 ml-1">— {note.job.customer.name}</span>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{note.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-gray-400">{formatDate(note.date)}</span>
                    {note.author && (
                      <span className="text-xs text-gray-400">· {note.author}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Ship Dates */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900">Upcoming Ship Dates (30 Days)</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Project NG</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Machine Type</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Sales Status</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Assembly</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Test</th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Ship</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Days Out</th>
              </tr>
            </thead>
            <tbody>
              {activeJobs
                .filter((j) => j.shipDate && differenceInDays(j.shipDate, today) <= 60 && differenceInDays(j.shipDate, today) >= -7)
                .slice(0, 8)
                .map((job) => {
                  const daysLeft = job.shipDate ? differenceInDays(job.shipDate, today) : null;
                  return (
                    <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/orders/${job.id}`} className="font-medium text-blue-600 hover:underline">
                          {job.projectNG}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-gray-700">{job.customer.name}</td>
                      <td className="px-3 py-3 text-gray-600">{job.machineType.name}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border text-xs px-2 py-0.5 font-medium ${getSalesStatusColor(job.salesStatus)}`}>
                          {job.salesStatus}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{formatDate(job.assemblyDate)}</td>
                      <td className="px-3 py-3 text-gray-600">{formatDate(job.testDate)}</td>
                      <td className="px-3 py-3 font-medium text-gray-800">{formatDate(job.shipDate)}</td>
                      <td className="px-5 py-3 text-right">
                        {daysLeft !== null ? (
                          <span className={`text-sm font-medium ${daysLeft <= 14 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-gray-600"}`}>
                            {daysLeft}d
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              {activeJobs.filter((j) => j.shipDate && differenceInDays(j.shipDate, today) <= 60 && differenceInDays(j.shipDate, today) >= -7).length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-6 text-center text-gray-400 text-sm">No shipments in the next 60 days</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

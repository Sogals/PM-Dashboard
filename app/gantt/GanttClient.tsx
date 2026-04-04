"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { getProjectStatusColor, getGanttBarColor } from "@/lib/utils";
import { addDays, differenceInDays, format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";

type Job = {
  id: string;
  projectNG: string;
  projectStatus: string;
  assemblyDate: string | null;
  testDate: string | null;
  shipDate: string | null;
  slipDays: number;
  customer: { id: string; name: string };
  machineType: { id: string; name: string };
};

type MachineType = { id: string; name: string };

const PROJECT_STATUSES = [
  "IN PROCUREMENT",
  "IN ENGINEERING",
  "ASSEMBLY",
  "TESTING",
  "SHIPPED (SOLD)",
  "SHIPPED (NOT SOLD)",
];

const ROW_HEIGHT = 44;
const LABEL_WIDTH = 220;
const DAY_WIDTH = 20;

export default function GanttClient({ jobs, machineTypes }: { jobs: Job[]; machineTypes: MachineType[] }) {
  const today = new Date();
  const [viewStart, setViewStart] = useState(() => {
    const d = new Date(today);
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMachine, setFilterMachine] = useState("");

  const viewDays = 90;
  const viewEnd = addDays(viewStart, viewDays);

  const filteredJobs = useMemo(() => {
    let result = jobs.filter((j) => {
      if (!j.assemblyDate && !j.shipDate) return false;
      const start = j.assemblyDate ? new Date(j.assemblyDate) : new Date(j.shipDate!);
      const end = j.shipDate ? new Date(j.shipDate) : start;
      // Include if overlaps with view window
      return start <= viewEnd && end >= viewStart;
    });
    if (filterStatus) result = result.filter((j) => j.projectStatus === filterStatus);
    if (filterMachine) result = result.filter((j) => j.machineType.id === filterMachine);
    return result.sort((a, b) => {
      const aDate = a.assemblyDate ?? a.shipDate ?? "";
      const bDate = b.assemblyDate ?? b.shipDate ?? "";
      return aDate.localeCompare(bDate);
    });
  }, [jobs, viewStart, viewEnd, filterStatus, filterMachine]);

  // Generate month headers
  const months: { label: string; startDay: number; days: number }[] = [];
  let cursor = new Date(viewStart);
  while (cursor < viewEnd) {
    const monthEnd = endOfMonth(cursor);
    const effectiveEnd = monthEnd < viewEnd ? monthEnd : viewEnd;
    const startDay = differenceInDays(cursor, viewStart);
    const daysInView = differenceInDays(effectiveEnd, cursor) + 1;
    months.push({
      label: format(cursor, "MMM yyyy"),
      startDay,
      days: daysInView,
    });
    cursor = addMonths(startOfMonth(cursor), 1);
  }

  // Today marker
  const todayOffset = differenceInDays(today, viewStart);
  const todayVisible = todayOffset >= 0 && todayOffset <= viewDays;

  const getBarStyle = (job: Job) => {
    if (!job.assemblyDate && !job.shipDate) return null;
    const startDate = job.assemblyDate ? new Date(job.assemblyDate) : new Date(job.shipDate!);
    const endDate = job.shipDate ? new Date(job.shipDate) : addDays(startDate, 1);

    const startOffset = Math.max(0, differenceInDays(startDate, viewStart));
    const endOffset = Math.min(viewDays, differenceInDays(endDate, viewStart));

    if (endOffset < 0 || startOffset > viewDays) return null;

    return {
      left: startOffset * DAY_WIDTH,
      width: Math.max(4, (endOffset - startOffset) * DAY_WIDTH),
    };
  };

  const chartWidth = viewDays * DAY_WIDTH;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gantt Chart</h1>
          <p className="text-sm text-gray-500">{filteredJobs.length} jobs · 90-day view</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() - 30); return nd; })}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 font-medium px-2">
            {format(viewStart, "MMM d")} — {format(viewEnd, "MMM d, yyyy")}
          </span>
          <button
            onClick={() => setViewStart((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + 30); return nd; })}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date(today);
              d.setDate(1);
              d.setMonth(d.getMonth() - 1);
              setViewStart(d);
            }}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
        >
          <option value="">All Project Statuses</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterMachine}
          onChange={(e) => setFilterMachine(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
        >
          <option value="">All Machine Types</option>
          {machineTypes.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto">
          {[
            { label: "Procurement", color: "bg-blue-400" },
            { label: "Engineering", color: "bg-amber-400" },
            { label: "Shipped", color: "bg-green-400" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-3 h-3 rounded-sm ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: LABEL_WIDTH + chartWidth + 40 }}>
            {/* Month headers */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }} className="shrink-0 px-4 py-2 border-r border-gray-200">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Job</span>
              </div>
              <div className="relative flex-1" style={{ height: 32 }}>
                {months.map((month, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-center border-r border-gray-200"
                    style={{ left: month.startDay * DAY_WIDTH, width: month.days * DAY_WIDTH }}
                  >
                    <span className="text-xs font-medium text-gray-600 px-2 truncate">{month.label}</span>
                  </div>
                ))}
                {todayVisible && (
                  <div
                    className="absolute top-0 h-full flex items-center justify-center"
                    style={{ left: todayOffset * DAY_WIDTH - 10, width: 20 }}
                  >
                    <span className="text-xs font-bold text-blue-600">↓</span>
                  </div>
                )}
              </div>
            </div>

            {/* Jobs */}
            {filteredJobs.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <BarChart2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No jobs in this time range</p>
              </div>
            ) : (
              filteredJobs.map((job, idx) => {
                const barStyle = getBarStyle(job);
                const barColor = getGanttBarColor(job.projectStatus);
                return (
                  <div
                    key={job.id}
                    className={`flex border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/50 transition-colors`}
                    style={{ height: ROW_HEIGHT }}
                  >
                    {/* Label */}
                    <div
                      style={{ width: LABEL_WIDTH, minWidth: LABEL_WIDTH }}
                      className="shrink-0 px-4 flex items-center gap-2 border-r border-gray-200"
                    >
                      <div className="min-w-0">
                        <Link href={`/orders/${job.id}`} className="text-xs font-semibold text-blue-600 hover:underline block truncate">
                          {job.projectNG}
                        </Link>
                        <div className="text-xs text-gray-400 truncate">{job.customer.name}</div>
                      </div>
                    </div>

                    {/* Bar area */}
                    <div className="relative flex-1" style={{ height: ROW_HEIGHT }}>
                      {/* Today line */}
                      {todayVisible && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-blue-400 z-10"
                          style={{ left: todayOffset * DAY_WIDTH }}
                        />
                      )}

                      {/* Gantt bar */}
                      {barStyle && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 ${barColor} rounded-md flex items-center px-2`}
                          style={{
                            left: barStyle.left,
                            width: barStyle.width,
                            height: ROW_HEIGHT - 16,
                          }}
                        >
                          <span className="text-white text-xs font-medium truncate" style={{ fontSize: 10 }}>
                            {job.machineType.name}
                          </span>
                          {job.slipDays > 0 && (
                            <span className="ml-1 bg-white/30 text-white text-xs px-1 rounded" style={{ fontSize: 9 }}>
                              +{job.slipDays}d
                            </span>
                          )}
                        </div>
                      )}

                      {/* Phase markers for assembly, test, ship */}
                      {["assemblyDate", "testDate", "shipDate"].map((key, i) => {
                        const dateStr = job[key as keyof Job] as string | null;
                        if (!dateStr) return null;
                        const date = new Date(dateStr);
                        const offset = differenceInDays(date, viewStart);
                        if (offset < 0 || offset > viewDays) return null;
                        return (
                          <div
                            key={key}
                            className="absolute top-1/2 -translate-y-1/2 z-20"
                            style={{ left: offset * DAY_WIDTH - 3 }}
                          >
                            <div
                              className={`w-2 h-2 rounded-full border-2 border-white ${
                                i === 0 ? "bg-blue-600" : i === 1 ? "bg-amber-500" : "bg-green-600"
                              }`}
                              title={`${key === "assemblyDate" ? "Assembly" : key === "testDate" ? "Test" : "Ship"}: ${format(date, "MM/dd/yy")}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatDate, getProjectStatusColor, getSalesStatusColor, getSlipBadgeColor } from "@/lib/utils";
import { Search, ChevronUp, ChevronDown, SlidersHorizontal } from "lucide-react";

type Job = {
  id: string;
  projectNG: string;
  moduleNumber: string | null;
  salesStatus: string;
  projectStatus: string;
  assemblyDate: string | null;
  testDate: string | null;
  shipDate: string | null;
  slipDays: number;
  priority: string;
  customer: { id: string; name: string };
  machineType: { id: string; name: string };
};

type MachineType = { id: string; name: string };

type SortKey = keyof Job | "customer" | "machineType";
type SortDir = "asc" | "desc";

const PROJECT_STATUSES = [
  "IN PROCUREMENT",
  "IN ENGINEERING",
  "ASSEMBLY",
  "TESTING",
  "SHIPPED (SOLD)",
  "SHIPPED (NOT SOLD)",
];

const SALES_STATUSES = ["SOLD", "FORECAST", "DEMO", "CLAIMED"];

export default function OrdersClient({ jobs, machineTypes }: { jobs: Job[]; machineTypes: MachineType[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSales, setFilterSales] = useState("");
  const [filterMachine, setFilterMachine] = useState("");
  const [sortKey, setSortKey] = useState<string>("shipDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = [...jobs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.projectNG.toLowerCase().includes(q) ||
          (j.moduleNumber ?? "").toLowerCase().includes(q) ||
          j.customer.name.toLowerCase().includes(q) ||
          j.machineType.name.toLowerCase().includes(q)
      );
    }

    if (filterStatus) result = result.filter((j) => j.projectStatus === filterStatus);
    if (filterSales) result = result.filter((j) => j.salesStatus === filterSales);
    if (filterMachine) result = result.filter((j) => j.machineType.id === filterMachine);

    result.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sortKey === "customer") { aVal = a.customer.name; bVal = b.customer.name; }
      else if (sortKey === "machineType") { aVal = a.machineType.name; bVal = b.machineType.name; }
      else if (sortKey === "slipDays") { aVal = a.slipDays; bVal = b.slipDays; }
      else if (sortKey === "shipDate" || sortKey === "assemblyDate" || sortKey === "testDate") {
        aVal = (a[sortKey as keyof Job] as string) ?? "9999";
        bVal = (b[sortKey as keyof Job] as string) ?? "9999";
      } else {
        aVal = (a[sortKey as keyof Job] as string) ?? "";
        bVal = (b[sortKey as keyof Job] as string) ?? "";
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [jobs, search, filterStatus, filterSales, filterMachine, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 text-blue-500" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-500" />
    );
  };

  // Group by project status for the summary row
  const groupCounts = PROJECT_STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter((j) => j.projectStatus === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {jobs.length} jobs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search NG, customer, module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
            value={filterSales}
            onChange={(e) => setFilterSales(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">All Sales Statuses</option>
            {SALES_STATUSES.map((s) => (
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
          {(search || filterStatus || filterSales || filterMachine) && (
            <button
              onClick={() => { setSearch(""); setFilterStatus(""); setFilterSales(""); setFilterMachine(""); }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Status pill summary */}
      <div className="flex gap-2 flex-wrap">
        {PROJECT_STATUSES.filter((s) => groupCounts[s] > 0).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              filterStatus === s
                ? getProjectStatusColor(s) + " ring-2 ring-offset-1 ring-blue-500"
                : getProjectStatusColor(s) + " opacity-70 hover:opacity-100"
            }`}
          >
            {s} ({groupCounts[s]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {[
                  { key: "projectNG", label: "Project NG" },
                  { key: "moduleNumber", label: "Module #" },
                  { key: "customer", label: "Customer" },
                  { key: "machineType", label: "Machine Type" },
                  { key: "salesStatus", label: "Sales Status" },
                  { key: "projectStatus", label: "Project Status" },
                  { key: "assemblyDate", label: "Assembly" },
                  { key: "testDate", label: "Test" },
                  { key: "shipDate", label: "Ship Date" },
                  { key: "slipDays", label: "Slip" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                    No jobs match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((job) => (
                  <tr key={job.id} className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/orders/${job.id}`} className="font-semibold text-blue-600 hover:underline">
                        {job.projectNG}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{job.moduleNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium max-w-36 truncate">{job.customer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{job.machineType.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border text-xs px-2 py-0.5 font-medium ${getSalesStatusColor(job.salesStatus)}`}>
                        {job.salesStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border text-xs px-2 py-0.5 font-medium whitespace-nowrap ${getProjectStatusColor(job.projectStatus)}`}>
                        {job.projectStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{formatDate(job.assemblyDate)}</td>
                    <td className="px-4 py-3 text-gray-600 tabular-nums">{formatDate(job.testDate)}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium tabular-nums">{formatDate(job.shipDate)}</td>
                    <td className="px-4 py-3">
                      {job.slipDays > 0 ? (
                        <span className={`inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium ${getSlipBadgeColor(job.slipDays)}`}>
                          +{job.slipDays}d
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

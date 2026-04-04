import { format, parseISO, differenceInDays } from "date-fns";

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MM/dd/yy");
}

export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function getProjectStatusColor(status: string): string {
  switch (status) {
    case "IN PROCUREMENT":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "IN ENGINEERING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "SHIPPED (SOLD)":
      return "bg-green-100 text-green-800 border-green-200";
    case "SHIPPED (NOT SOLD)":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "ASSEMBLY":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "TESTING":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function getSalesStatusColor(status: string): string {
  switch (status) {
    case "SOLD":
      return "bg-green-100 text-green-800 border-green-200";
    case "FORECAST":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "DEMO":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "CLAIMED":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function getSlipColor(slipDays: number): string {
  if (slipDays === 0) return "text-gray-500";
  if (slipDays <= 14) return "text-amber-600 font-medium";
  return "text-red-600 font-bold";
}

export function getSlipBadgeColor(slipDays: number): string {
  if (slipDays === 0) return "bg-gray-100 text-gray-500";
  if (slipDays <= 14) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "High":
      return "text-red-600";
    case "Critical":
      return "text-red-700 font-bold";
    case "Low":
      return "text-gray-400";
    default:
      return "text-gray-600";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "High":
      return "bg-red-100 text-red-800";
    case "Medium":
      return "bg-amber-100 text-amber-800";
    case "Low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function isAtRisk(job: {
  slipDays: number;
  shipDate: Date | null;
}): boolean {
  const today = new Date();
  if (job.slipDays > 0) return true;
  if (job.shipDate) {
    const daysUntilShip = differenceInDays(job.shipDate, today);
    if (daysUntilShip <= 30 && daysUntilShip >= 0) return true;
  }
  return false;
}

export function daysUntil(date: Date | null | undefined): number | null {
  if (!date) return null;
  return differenceInDays(date, new Date());
}

export function getGanttBarColor(projectStatus: string): string {
  switch (projectStatus) {
    case "IN PROCUREMENT":
      return "bg-blue-400";
    case "IN ENGINEERING":
      return "bg-amber-400";
    case "SHIPPED (SOLD)":
      return "bg-green-400";
    case "SHIPPED (NOT SOLD)":
      return "bg-gray-400";
    case "ASSEMBLY":
      return "bg-purple-400";
    case "TESTING":
      return "bg-orange-400";
    default:
      return "bg-gray-300";
  }
}

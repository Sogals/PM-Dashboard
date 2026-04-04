import { getProjectStatusColor, getSalesStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  type: "project" | "sales";
  size?: "sm" | "md";
}

export default function StatusBadge({ status, type, size = "sm" }: StatusBadgeProps) {
  const colorClass = type === "project" ? getProjectStatusColor(status) : getSalesStatusColor(status);
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClass}`}>
      {status}
    </span>
  );
}

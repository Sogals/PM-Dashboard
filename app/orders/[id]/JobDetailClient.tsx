"use client";

import { useState } from "react";
import { formatDate, formatDateLong, getSeverityColor, getSlipBadgeColor } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  List,
  History,
  ChevronDown,
  ChevronUp,
  Package,
  Wrench,
  DollarSign,
  Clock,
} from "lucide-react";

type Milestone = {
  id: string;
  name: string;
  category: string;
  isComplete: boolean;
  completedAt: string | null;
  dueDate: string | null;
  order: number;
};

type Note = {
  id: string;
  date: string;
  content: string;
  isHighlighted: boolean;
  author: string | null;
};

type LatePart = {
  id: string;
  description: string;
  dockDate: string | null;
  resolved: boolean;
};

type ChecklistItem = {
  id: string;
  category: string;
  name: string;
  isComplete: boolean;
  order: number;
};

type Risk = {
  id: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string;
};

type ChangeEntry = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
};

type Option = {
  id: string;
  count: number;
  description: string;
  isHighlighted: boolean;
};

type Job = {
  id: string;
  projectNG: string;
  moduleNumber: string | null;
  salesStatus: string;
  projectStatus: string;
  assemblyDate: string | null;
  testDate: string | null;
  shipDate: string | null;
  pastAssemblyDate: string | null;
  pastTestDate: string | null;
  pastShipDate: string | null;
  slipDays: number;
  assemblyTech: string | null;
  testTech: string | null;
  options: Option[];
  milestones: Milestone[];
  notes: Note[];
  lateParts: LatePart[];
  checklistItems: ChecklistItem[];
  risks: Risk[];
  changeHistory: ChangeEntry[];
  customer: { id: string; name: string };
  machineType: { id: string; name: string };
};

const TABS = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "milestones", label: "Milestones", icon: List },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "history", label: "History", icon: History },
];

export default function JobDetailClient({ job }: { job: Job }) {
  const [activeTab, setActiveTab] = useState("overview");

  const engineeringMilestones = job.milestones.filter((m) => m.category === "engineering");
  const operationsMilestones = job.milestones.filter((m) => m.category === "operations");
  const commercialMilestones = job.milestones.filter((m) => m.category === "commercial");

  const engineeringChecklist = job.checklistItems.filter((c) => c.category === "engineering");
  const operationsChecklist = job.checklistItems.filter((c) => c.category === "operations");
  const commercialChecklist = job.checklistItems.filter((c) => c.category === "commercial");

  const completedMilestones = job.milestones.filter((m) => m.isComplete).length;
  const totalMilestones = job.milestones.length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 bg-white rounded-t-xl px-4">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "risks" && job.risks.filter((r) => r.status === "Open").length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
                  {job.risks.filter((r) => r.status === "Open").length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="p-6 grid grid-cols-2 gap-6">
            {/* Options */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-gray-400" />
                Machine Options
              </h3>
              {job.options.length === 0 ? (
                <p className="text-sm text-gray-400">No options recorded.</p>
              ) : (
                <div className="space-y-1.5">
                  {job.options.map((opt) => (
                    <div key={opt.id} className={`flex items-center justify-between py-2 px-3 rounded-lg ${opt.isHighlighted ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                      <span className="text-sm text-gray-700">{opt.description}</span>
                      <span className="text-sm font-semibold text-gray-900 ml-2">×{opt.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Team */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Team</h3>
              <div className="space-y-2">
                {[
                  { label: "Assembly Tech", value: job.assemblyTech },
                  { label: "Test Tech", value: job.testTech },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className="text-sm font-medium text-gray-800">{item.value ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Late Parts */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Late Parts
                {job.lateParts.filter((lp) => !lp.resolved).length > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded-full">
                    {job.lateParts.filter((lp) => !lp.resolved).length} open
                  </span>
                )}
              </h3>
              {job.lateParts.length === 0 ? (
                <p className="text-sm text-gray-400">No late parts recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">Description</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">Expected Dock</th>
                      <th className="text-left py-2 text-xs text-gray-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.lateParts.map((lp) => (
                      <tr key={lp.id} className="border-b border-gray-50">
                        <td className="py-2 text-gray-700">{lp.description}</td>
                        <td className="py-2 text-gray-600">{formatDate(lp.dockDate)}</td>
                        <td className="py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lp.resolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {lp.resolved ? "Resolved" : "Open"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Checklists */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Checklists</h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "Engineering", icon: Wrench, items: engineeringChecklist },
                  { label: "Operations", icon: Package, items: operationsChecklist },
                  { label: "Commercial", icon: DollarSign, items: commercialChecklist },
                ].map((section) => {
                  const Icon = section.icon;
                  const completed = section.items.filter((i) => i.isComplete).length;
                  return (
                    <div key={section.label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">{section.label}</span>
                        </div>
                        <span className="text-xs text-gray-400">{completed}/{section.items.length}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: section.items.length ? `${(completed / section.items.length) * 100}%` : "0%" }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {section.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                            )}
                            <span className={`text-sm ${item.isComplete ? "text-gray-400 line-through" : "text-gray-700"}`}>
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === "milestones" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Project Milestones</h3>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: totalMilestones ? `${(completedMilestones / totalMilestones) * 100}%` : "0%" }}
                  />
                </div>
                <span className="text-xs text-gray-500">{completedMilestones}/{totalMilestones} complete</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {[
                { label: "Engineering", items: engineeringMilestones, icon: Wrench, color: "text-blue-600" },
                { label: "Operations", items: operationsMilestones, icon: Package, color: "text-amber-600" },
                { label: "Commercial", items: commercialMilestones, icon: DollarSign, color: "text-green-600" },
              ].map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.label}>
                    <div className={`flex items-center gap-2 mb-4 ${section.color}`}>
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-semibold">{section.label}</span>
                    </div>
                    <div className="space-y-3">
                      {section.items.map((milestone) => (
                        <div key={milestone.id} className="flex items-start gap-3">
                          {milestone.isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className={`text-sm ${milestone.isComplete ? "line-through text-gray-400" : "text-gray-800"}`}>
                              {milestone.name}
                            </div>
                            {milestone.completedAt && (
                              <div className="text-xs text-green-600">{formatDate(milestone.completedAt)}</div>
                            )}
                            {milestone.dueDate && !milestone.isComplete && (
                              <div className="text-xs text-amber-600">Due {formatDate(milestone.dueDate)}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">Notes & Updates</h3>
              <span className="text-xs text-gray-400">{job.notes.length} notes</span>
            </div>
            {job.notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes recorded.</p>
            ) : (
              <div className="space-y-4">
                {job.notes.map((note) => (
                  <div key={note.id} className={`relative pl-4 border-l-2 ${note.isHighlighted ? "border-amber-400" : "border-gray-200"}`}>
                    {note.isHighlighted && (
                      <div className="absolute -left-1 top-0 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">{formatDateLong(note.date)}</span>
                      {note.author && (
                        <span className="text-xs text-gray-400">· {note.author}</span>
                      )}
                      {note.isHighlighted && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Important</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RISKS TAB */}
        {activeTab === "risks" && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Risk Register</h3>
            {job.risks.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No risks recorded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {job.risks.map((risk) => (
                  <div key={risk.id} className={`p-4 rounded-lg border ${risk.status === "Closed" ? "opacity-60 bg-gray-50 border-gray-200" : "bg-white border-gray-200"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-gray-800">{risk.description}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSeverityColor(risk.severity)}`}>
                          {risk.severity}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          risk.status === "Open" ? "bg-red-100 text-red-700" :
                          risk.status === "Mitigated" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {risk.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">{formatDateLong(risk.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-5">Change History</h3>
            {job.changeHistory.length === 0 ? (
              <p className="text-sm text-gray-400">No changes recorded.</p>
            ) : (
              <div className="space-y-2">
                {job.changeHistory.map((change) => (
                  <div key={change.id} className="flex items-start gap-3 py-2 border-b border-gray-50">
                    <Clock className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium text-gray-700">{change.field}</span>
                      {" changed from "}
                      <span className="text-red-600">{change.oldValue ?? "—"}</span>
                      {" to "}
                      <span className="text-green-600">{change.newValue ?? "—"}</span>
                      {change.changedBy && <span className="text-gray-400"> by {change.changedBy}</span>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDateLong(change.changedAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

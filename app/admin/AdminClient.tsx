"use client";

import { useState } from "react";
import { Settings, Tag, List, ChevronUp, ChevronDown, Trash2, Plus, Check } from "lucide-react";

type StatusConfig = {
  id: string;
  type: string;
  value: string;
  color: string;
  order: number;
};

type MachineType = {
  id: string;
  name: string;
  description: string | null;
};

type MilestoneTemplate = {
  id: string;
  name: string;
  category: string;
  order: number;
};

const TABS = [
  { id: "statuses", label: "Statuses", icon: Tag },
  { id: "machinetypes", label: "Machine Types", icon: Settings },
  { id: "milestones", label: "Milestone Templates", icon: List },
];

export default function AdminClient({
  statuses,
  machineTypes,
  milestoneTemplates,
}: {
  statuses: StatusConfig[];
  machineTypes: MachineType[];
  milestoneTemplates: MilestoneTemplate[];
}) {
  const [activeTab, setActiveTab] = useState("statuses");
  const [saved, setSaved] = useState<string | null>(null);

  // Local state for editing
  const [localStatuses, setLocalStatuses] = useState(statuses);
  const [localMachineTypes, setLocalMachineTypes] = useState(machineTypes);
  const [localMilestones, setLocalMilestones] = useState(milestoneTemplates);

  // New item forms
  const [newStatus, setNewStatus] = useState({ type: "projectStatus", value: "", color: "#6B7280" });
  const [newMachineType, setNewMachineType] = useState({ name: "", description: "" });
  const [newMilestone, setNewMilestone] = useState({ name: "", category: "engineering" });

  const showSaved = (key: string) => {
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  const projectStatuses = localStatuses.filter((s) => s.type === "projectStatus");
  const salesStatuses = localStatuses.filter((s) => s.type === "salesStatus");

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Configuration</h1>
        <p className="text-sm text-gray-500">Manage statuses, machine types, and milestone templates</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* STATUSES TAB */}
      {activeTab === "statuses" && (
        <div className="space-y-6">
          {[
            { label: "Project Statuses", type: "projectStatus", items: projectStatuses },
            { label: "Sales Statuses", type: "salesStatus", items: salesStatuses },
          ].map((section) => (
            <div key={section.type} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{section.label}</h2>
                <span className="text-xs text-gray-400">{section.items.length} items</span>
              </div>
              <div className="divide-y divide-gray-50">
                {section.items.map((status) => (
                  <div key={status.id} className="px-5 py-3 flex items-center gap-3">
                    <input
                      type="color"
                      value={status.color}
                      onChange={(e) => {
                        setLocalStatuses((prev) =>
                          prev.map((s) => s.id === status.id ? { ...s, color: e.target.value } : s)
                        );
                      }}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <div
                      className="text-xs px-2 py-1 rounded-full font-medium border"
                      style={{
                        backgroundColor: status.color + "20",
                        color: status.color,
                        borderColor: status.color + "40",
                      }}
                    >
                      {status.value}
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setLocalStatuses((prev) => {
                            const idx = prev.findIndex((s) => s.id === status.id);
                            if (idx === 0) return prev;
                            const arr = [...prev];
                            [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                            return arr;
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setLocalStatuses((prev) => {
                            const idx = prev.findIndex((s) => s.id === status.id);
                            if (idx === prev.length - 1) return prev;
                            const arr = [...prev];
                            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                            return arr;
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setLocalStatuses((prev) => prev.filter((s) => s.id !== status.id))}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add new */}
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newStatus.color}
                    onChange={(e) => setNewStatus((p) => ({ ...p, color: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  />
                  <input
                    type="text"
                    placeholder="New status value..."
                    value={newStatus.type === section.type ? newStatus.value : ""}
                    onChange={(e) => setNewStatus({ type: section.type, value: e.target.value, color: newStatus.color })}
                    onFocus={() => setNewStatus((p) => ({ ...p, type: section.type }))}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (!newStatus.value.trim() || newStatus.type !== section.type) return;
                      setLocalStatuses((prev) => [
                        ...prev,
                        {
                          id: `temp-${Date.now()}`,
                          type: section.type,
                          value: newStatus.value.trim().toUpperCase(),
                          color: newStatus.color,
                          order: prev.filter((s) => s.type === section.type).length + 1,
                        },
                      ]);
                      setNewStatus({ type: section.type, value: "", color: "#6B7280" });
                    }}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={() => showSaved("statuses")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {saved === "statuses" ? <Check className="w-4 h-4" /> : null}
              {saved === "statuses" ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* MACHINE TYPES TAB */}
      {activeTab === "machinetypes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Machine Types</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {localMachineTypes.map((mt) => (
                  <tr key={mt.id} className="border-b border-gray-50">
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={mt.name}
                        onChange={(e) => setLocalMachineTypes((prev) =>
                          prev.map((m) => m.id === mt.id ? { ...m, name: e.target.value } : m)
                        )}
                        className="w-full text-sm border border-transparent rounded px-2 py-1 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent hover:bg-gray-50"
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={mt.description ?? ""}
                        onChange={(e) => setLocalMachineTypes((prev) =>
                          prev.map((m) => m.id === mt.id ? { ...m, description: e.target.value } : m)
                        )}
                        className="w-full text-sm border border-transparent rounded px-2 py-1 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent hover:bg-gray-50 text-gray-500"
                        placeholder="Description..."
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setLocalMachineTypes((prev) => prev.filter((m) => m.id !== mt.id))}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add row */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Machine type name..."
                  value={newMachineType.name}
                  onChange={(e) => setNewMachineType((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description (optional)..."
                  value={newMachineType.description}
                  onChange={(e) => setNewMachineType((p) => ({ ...p, description: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (!newMachineType.name.trim()) return;
                    setLocalMachineTypes((prev) => [
                      ...prev,
                      { id: `temp-${Date.now()}`, name: newMachineType.name.trim(), description: newMachineType.description || null },
                    ]);
                    setNewMachineType({ name: "", description: "" });
                  }}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => showSaved("machinetypes")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {saved === "machinetypes" ? <Check className="w-4 h-4" /> : null}
              {saved === "machinetypes" ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* MILESTONE TEMPLATES TAB */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Milestone Templates</h2>
              <p className="text-xs text-gray-400 mt-0.5">Default milestones applied to new jobs</p>
            </div>

            {["engineering", "operations", "commercial"].map((category) => {
              const items = localMilestones.filter((m) => m.category === category);
              return (
                <div key={category}>
                  <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{category}</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((milestone) => (
                      <div key={milestone.id} className="px-5 py-2.5 flex items-center gap-3">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs font-medium">
                          {milestone.order}
                        </span>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => setLocalMilestones((prev) =>
                            prev.map((m) => m.id === milestone.id ? { ...m, name: e.target.value } : m)
                          )}
                          className="flex-1 text-sm border border-transparent rounded px-2 py-1 focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-transparent hover:bg-gray-50"
                        />
                        <button
                          onClick={() => setLocalMilestones((prev) => prev.filter((m) => m.id !== milestone.id))}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Add new */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <select
                  value={newMilestone.category}
                  onChange={(e) => setNewMilestone((p) => ({ ...p, category: e.target.value }))}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="engineering">Engineering</option>
                  <option value="operations">Operations</option>
                  <option value="commercial">Commercial</option>
                </select>
                <input
                  type="text"
                  placeholder="Milestone name..."
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (!newMilestone.name.trim()) return;
                    const categoryItems = localMilestones.filter((m) => m.category === newMilestone.category);
                    setLocalMilestones((prev) => [
                      ...prev,
                      {
                        id: `temp-${Date.now()}`,
                        name: newMilestone.name.trim(),
                        category: newMilestone.category,
                        order: categoryItems.length + 1,
                      },
                    ]);
                    setNewMilestone({ name: "", category: newMilestone.category });
                  }}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => showSaved("milestones")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {saved === "milestones" ? <Check className="w-4 h-4" /> : null}
              {saved === "milestones" ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

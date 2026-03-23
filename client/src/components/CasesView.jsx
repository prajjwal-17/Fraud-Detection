import { useMemo, useState } from "react";

const priorityTone = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700"
};

export const CasesView = ({ cases, admins, onUpdateCase }) => {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [noteDrafts, setNoteDrafts] = useState({});

  const filteredCases = useMemo(
    () =>
      cases.filter((item) => {
        if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
        if (priorityFilter !== "ALL" && item.priority !== priorityFilter) return false;
        return true;
      }),
    [cases, priorityFilter, statusFilter]
  );

  return (
    <div className="space-y-4">
      <div className="panel rounded-lg p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Investigation Queue</h2>
            <p className="mt-1 text-sm text-gray-500">Track ownership, notes, and resolution decisions for flagged activity.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="space-y-1">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED", "FALSE_POSITIVE"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-xs font-medium uppercase tracking-wide text-gray-500">Priority</span>
              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                {["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCases.map((item) => (
          <div key={item.id} className="panel rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-gray-900">{item.user?.name || "Unknown user"}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                    {item.decision}
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${priorityTone[item.priority] || "bg-slate-100 text-slate-700"}`}>
                    {item.priority || "UNSPECIFIED"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">Risk {item.latestRiskScore} • Status {item.status}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <select
                  defaultValue={item.status}
                  onChange={(event) =>
                    onUpdateCase(item.id, {
                      status: event.target.value
                    })
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {["OPEN", "UNDER_REVIEW", "RESOLVED", "FALSE_POSITIVE"].map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  defaultValue={item.assignedTo || ""}
                  onChange={(event) =>
                    onUpdateCase(item.id, {
                      assignedTo: event.target.value
                    })
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {admins.map((admin) => (
                    <option key={admin._id || admin.id} value={admin._id || admin.id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.5fr,1fr]">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">Notes</p>
                <div className="mt-3 space-y-2">
                  {(item.notes || []).map((note) => (
                    <div key={note._id} className="rounded-md border border-white bg-white px-3 py-2 shadow-sm">
                      <p className="text-sm text-gray-700">{note.message}</p>
                      <p className="mt-1 text-xs text-gray-500">{note.authorName}</p>
                    </div>
                  ))}
                  {item.notes?.length === 0 ? <p className="text-sm text-gray-500">No notes added yet.</p> : null}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={noteDrafts[item.id] || ""}
                    onChange={(event) =>
                      setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder="Add investigation note"
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      onUpdateCase(item.id, { note: noteDrafts[item.id] || "" });
                      setNoteDrafts((current) => ({ ...current, [item.id]: "" }));
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                  >
                    Add note
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">Resolution</p>
                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {item.resolutionReason || "No resolution reason recorded yet."}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

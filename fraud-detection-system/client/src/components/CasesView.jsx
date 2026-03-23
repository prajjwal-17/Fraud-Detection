import { useMemo, useState } from "react";

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
        <div className="flex flex-wrap items-center gap-3">
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
        </div>
      </div>

      <div className="space-y-4">
        {filteredCases.map((item) => (
          <div key={item.id} className="panel rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {item.user?.name} · {item.decision}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Risk {item.latestRiskScore} · Priority {item.priority}
                </p>
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
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-900">Notes</p>
                <div className="mt-3 space-y-2">
                  {(item.notes || []).map((note) => (
                    <div key={note._id} className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-sm text-gray-700">{note.message}</p>
                      <p className="mt-1 text-xs text-gray-500">{note.authorName}</p>
                    </div>
                  ))}
                  {item.notes?.length === 0 ? (
                    <p className="text-sm text-gray-500">No notes added yet.</p>
                  ) : null}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={noteDrafts[item.id] || ""}
                    onChange={(event) =>
                      setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder="Add investigation note"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => {
                      onUpdateCase(item.id, { note: noteDrafts[item.id] || "" });
                      setNoteDrafts((current) => ({ ...current, [item.id]: "" }));
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
                  >
                    Add note
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-900">Resolution</p>
                <p className="mt-2 text-sm text-gray-500">
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


const decisionTone = {
  SAFE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  SUSPICIOUS: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  FRAUD: "bg-red-50 text-red-700 ring-1 ring-red-100"
};

const priorityTone = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700"
};

export const AuditTrailView = ({ logs }) => (
  <div className="panel rounded-lg p-4 sm:p-5">
    <div className="mb-5">
      <h2 className="text-base font-semibold text-gray-900">Audit Trail</h2>
      <p className="mt-1 text-sm text-gray-500">Full scoring decisions with breakdowns for audit and compliance review.</p>
    </div>

    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-gray-900">{log.user?.name || "Unknown user"}</p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${decisionTone[log.decision] || "bg-slate-100 text-slate-700"}`}>
                  {log.decision}
                </span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${priorityTone[log.priority] || "bg-slate-100 text-slate-700"}`}>
                  {log.priority || "UNSPECIFIED"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>Risk {log.finalRiskScore}</span>
                <span>ML {Math.round((log.mlScore || 0) * 100)}%</span>
                <span>Latency {log.latencyMs} ms</span>
              </div>
            </div>

            {log.degradedMode ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                Rule fallback
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-3">
            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Rules</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{(log.ruleSignals || []).join(", ") || "None"}</p>
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Top Factors</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">{(log.topFactors || []).join(", ") || "None"}</p>
            </div>

            <div className="rounded-lg bg-gray-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Explanation</p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {(log.audit?.explanation || [])
                  .map((item) => `${item.label}: ${item.weight}%`)
                  .join(" • ") || "No explanation available"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

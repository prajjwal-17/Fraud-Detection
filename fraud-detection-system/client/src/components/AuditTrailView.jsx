export const AuditTrailView = ({ logs }) => (
  <div className="panel rounded-lg p-4">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900">Audit Trail</h2>
      <p className="mt-1 text-sm text-gray-500">Full scoring decisions with breakdowns for audit and compliance review.</p>
    </div>
    <div className="space-y-3">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border border-gray-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {log.user?.name} · {log.decision} · {log.priority}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Risk {log.finalRiskScore} · ML {Math.round((log.mlScore || 0) * 100)}% · Latency {log.latencyMs} ms
              </p>
            </div>
            {log.degradedMode ? (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                Rule fallback
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Rules</p>
              <p className="mt-1 text-sm text-gray-700">{(log.ruleSignals || []).join(", ") || "None"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Top factors</p>
              <p className="mt-1 text-sm text-gray-700">{(log.topFactors || []).join(", ") || "None"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Explanation</p>
              <p className="mt-1 text-sm text-gray-700">
                {(log.audit?.explanation || [])
                  .map((item) => `${item.label}: ${item.weight}%`)
                  .join(" · ") || "No explanation available"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);


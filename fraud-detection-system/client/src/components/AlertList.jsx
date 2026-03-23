import { AlertCircle, BellRing, Inbox } from "lucide-react";

const decisionTone = {
  SAFE: "text-safe",
  SUSPICIOUS: "text-suspicious",
  FRAUD: "text-fraud"
};

const formatTime = (value) => {
  if (!value) return "Just now";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const AlertList = ({ alerts, loading = false }) => (
  <div className="panel flex h-[430px] flex-col rounded-lg p-4">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-text">Fraud Alerts</h2>
      <p className="mt-1 text-sm text-muted">Compact queue of flagged transactions and rule triggers.</p>
    </div>
    <div className="flex-1 space-y-2 overflow-y-auto pr-1">
      {loading
        ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-line p-3">
              <div className="skeleton h-4 w-20 rounded-md" />
              <div className="skeleton mt-3 h-3 w-full rounded-md" />
            </div>
          ))
        : null}
      {!loading &&
        alerts.map((alert) => (
          <div key={alert.id || alert.transactionId} className="flex items-start gap-3 rounded-lg border border-line bg-white px-3 py-3 shadow-sm">
            <div className={`mt-0.5 ${decisionTone[alert.decision]}`}>
              {alert.decision === "FRAUD" ? <AlertCircle size={16} /> : <BellRing size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-text">
                  {(alert.ruleSignals || alert.alerts || []).join(", ") || "Manual review recommended"}
                </p>
                <span className="shrink-0 text-xs text-muted">{formatTime(alert.createdAt)}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">
                  {alert.decision}
                </span>
                {alert.priority ? (
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                      alert.priority === "CRITICAL"
                        ? "bg-red-50 text-red-700"
                        : alert.priority === "HIGH"
                          ? "bg-orange-50 text-orange-700"
                          : alert.priority === "MEDIUM"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {alert.priority}
                  </span>
                ) : null}
                <span className="text-xs text-muted">Risk {alert.finalRiskScore}</span>
              </div>
            </div>
          </div>
        ))}
      {!loading && alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line px-4 py-10 text-center">
          <Inbox size={18} className="text-gray-400" />
          <p className="mt-2 text-sm text-muted">No active alerts right now.</p>
        </div>
      ) : null}
    </div>
  </div>
);

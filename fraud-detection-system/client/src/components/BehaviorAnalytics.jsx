const riskTone = (value) => {
  if (value >= 70) return "text-fraud";
  if (value >= 30) return "text-suspicious";
  return "text-safe";
};

export const BehaviorAnalytics = ({ users, loading = false }) => (
  <div className="panel h-[430px] overflow-auto rounded-lg p-4">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-text">User Behavior Analytics</h2>
      <p className="mt-1 text-sm text-muted">Risk-ranked user profiles based on current transaction behavior.</p>
    </div>
    <div className="space-y-3">
      {loading
        ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-line p-3">
              <div className="skeleton h-4 w-28 rounded-md" />
              <div className="skeleton mt-3 h-2 w-full rounded-full" />
            </div>
          ))
        : null}
      {!loading &&
        users.map((user) => (
          <div key={user.id} className="rounded-lg border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">{user.name}</p>
                <p className="mt-1 text-xs text-muted">{user.email}</p>
              </div>
              <p className={`text-sm font-semibold ${riskTone(user.riskLevel)}`}>{user.riskLevel}</p>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${
                  user.riskLevel >= 70
                    ? "bg-fraud"
                    : user.riskLevel >= 30
                      ? "bg-amber-600"
                      : "bg-safe"
                }`}
                style={{ width: `${Math.min(user.riskLevel, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>Average amount</span>
              <span>Rs. {Math.round(user.averageAmount).toLocaleString()}</span>
            </div>
          </div>
        ))}
      {!loading && users.length === 0 ? (
        <p className="text-sm text-muted">No user risk profiles available yet.</p>
      ) : null}
    </div>
  </div>
);

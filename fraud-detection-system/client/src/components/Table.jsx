const decisionTone = {
  SAFE: "bg-green-50 text-safe",
  SUSPICIOUS: "bg-amber-50 text-suspicious",
  FRAUD: "bg-red-50 text-fraud"
};

const getParticipantLabel = (participant) => {
  if (typeof participant === "string") return participant;
  if (participant && typeof participant === "object") return participant.name || participant.id || "Unknown";
  return "Unknown";
};

const getLocationLabel = (location) => {
  if (typeof location === "string") return location;
  if (location && typeof location === "object") return location.city || "Unknown location";
  return "Unknown location";
};

export const Table = ({ rows, loading = false }) => (
  <div className="panel flex h-[430px] flex-col rounded-lg p-4">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-text">Live Transaction Feed</h2>
      <p className="mt-1 text-sm text-muted">Recent payment events with live classification and risk status.</p>
    </div>
    <div className="flex-1 overflow-hidden rounded-lg border border-line bg-white">
      <div className="h-full overflow-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Sender</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Receiver</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Decision</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3">
                        <div className="skeleton h-4 rounded-md" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id || row.transactionId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-text">{getParticipantLabel(row.sender)}</td>
                  <td className="px-4 py-3 text-text">{getParticipantLabel(row.receiver)}</td>
                  <td className="px-4 py-3 text-text">Rs. {row.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted">{getLocationLabel(row.location)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${decisionTone[row.decision]}`}>
                      {row.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text">{row.riskScore || row.finalRiskScore}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 ? (
        <div className="px-4 py-6 text-sm text-muted">No transactions yet. Run a simulation to populate the feed.</div>
      ) : null}
    </div>
  </div>
);

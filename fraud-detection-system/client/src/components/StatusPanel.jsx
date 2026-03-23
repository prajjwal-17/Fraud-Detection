const statusTone = {
  UP: "bg-green-100 text-green-700",
  DOWN: "bg-red-100 text-red-700",
  DEGRADED: "bg-amber-100 text-amber-700"
};

export const StatusPanel = ({ status }) => {
  if (!status) return null;

  const items = [
    {
      label: "ML Service",
      value: status.mlService?.status || "DOWN",
      helper: status.mlService?.latencyMs ? `${status.mlService.latencyMs} ms` : "No response"
    },
    {
      label: "Redis",
      value: status.redis?.status || "DEGRADED",
      helper: "Cache availability"
    },
    {
      label: "Pipeline",
      value: status.pipeline?.latencyMs > 250 ? "WARN" : "OK",
      helper: `${status.pipeline?.latencyMs || 0} ms`
    }
  ];

  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">System Status</h2>
        <p className="mt-1 text-sm text-gray-500">Operational status for critical scoring dependencies.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  statusTone[item.value] || "bg-slate-100 text-slate-700"
                }`}
              >
                {item.value}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">{item.helper}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


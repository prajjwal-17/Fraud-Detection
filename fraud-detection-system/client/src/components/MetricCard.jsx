export const MetricCard = ({ label, value, helper, tone = "text-text", loading = false }) => (
  <div className="panel rounded-lg p-4">
    <p className="text-sm text-muted">{label}</p>
    <div className="mt-2 flex items-end justify-between gap-3">
      {loading ? (
        <div className="skeleton h-8 w-20 rounded-md" />
      ) : (
        <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
      )}
      <span className="text-xs text-muted">{helper}</span>
    </div>
  </div>
);

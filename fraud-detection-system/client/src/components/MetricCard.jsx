export const MetricCard = ({ label, value, helper, tone = "text-text", loading = false }) => (
  <div className="panel rounded-lg p-4 shadow-sm">
    <p className="text-sm font-medium text-muted">{label}</p>
    <div className="mt-3 flex items-end justify-between gap-3">
      {loading ? (
        <div className="skeleton h-8 w-20 rounded-md" />
      ) : (
        <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
      )}
      <span className="max-w-[7rem] text-right text-xs leading-5 text-muted">{helper}</span>
    </div>
  </div>
);

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export const RiskChart = ({ data, loading = false }) => (
  <div className="panel flex h-[430px] flex-col rounded-lg p-4">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-text">Risk Score Trend</h2>
      <p className="mt-1 text-sm text-muted">Combined ML and rules-based scoring over recent decisions.</p>
    </div>
    <div className="flex-1">
      {loading ? (
        <div className="flex h-full items-end gap-3 rounded-lg bg-slate-50 p-5">
          {[32, 48, 40, 65, 51, 74, 58].map((height, index) => (
            <div key={index} className="skeleton flex-1 rounded-md" style={{ height: `${height}%` }} />
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            />
            <YAxis stroke="#9CA3AF" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
                fontSize: "12px"
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={{ r: 2.5, strokeWidth: 0, fill: "#3B82F6" }}
              activeDot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

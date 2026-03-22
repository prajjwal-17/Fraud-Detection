import { Activity, Bell, ChevronLeft, CreditCard, LayoutDashboard, ShieldCheck } from "lucide-react";

const items = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "analytics", label: "Analytics", icon: Activity }
];

export const Sidebar = ({ collapsed, onToggle, activeItem = "dashboard", onNavigate }) => (
  <aside
    className={`hidden shrink-0 lg:flex lg:flex-col ${
      collapsed ? "w-24" : "w-64"
    }`}
  >
    <div
      className={`sticky top-4 ml-4 mr-2 mt-4 flex h-[calc(100vh-2rem)] flex-col rounded-2xl border border-white/70 bg-white/70 shadow-sm backdrop-blur-xl transition-[width] duration-200 ${
        collapsed ? "px-2 py-3" : "px-3 py-3"
      }`}
    >
      <div className={`border-b border-gray-200/80 pb-3 ${collapsed ? "px-1" : "px-2"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-3"}`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-text ring-1 ring-gray-200/80">
              <ShieldCheck size={18} />
            </div>
            {!collapsed ? (
              <div>
                <p className="text-sm font-semibold text-text">FinSecure</p>
                <p className="text-xs text-muted">Fraud Operations</p>
              </div>
            ) : null}
          </div>
          <button
            onClick={onToggle}
            className="rounded-lg border border-gray-200/80 bg-white/80 p-1.5 text-muted transition hover:bg-white hover:text-text"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft size={16} className={collapsed ? "rotate-180" : ""} />
          </button>
        </div>
      </div>

      <nav className={`flex-1 pt-3 ${collapsed ? "px-1" : "px-2"}`}>
        <div className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center rounded-xl text-sm font-medium transition ${
                  collapsed ? "justify-center px-3 py-3" : "gap-3 px-3 py-2.5"
                } ${
                  activeItem === item.id
                    ? "bg-white text-text shadow-sm ring-1 ring-gray-200/80"
                    : "text-muted hover:bg-white/80 hover:text-text"
                }`}
              >
                <Icon size={17} />
                {!collapsed ? item.label : null}
                {collapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-white px-2 py-1 text-xs text-text shadow-sm group-hover:block">
                    {item.label}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {!collapsed ? (
        <div className="px-2 pt-3">
          <div className="rounded-xl border border-gray-200/80 bg-white/75 p-3">
            <p className="text-xs font-medium text-gray-900">Ops status</p>
            <p className="mt-1 text-xs text-gray-500">Monitoring live fraud telemetry</p>
          </div>
        </div>
      ) : null}
    </div>
  </aside>
);

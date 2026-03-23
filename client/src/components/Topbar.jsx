import { useEffect, useState } from "react";
import { Search, UserCircle2 } from "lucide-react";

export const Topbar = ({ simulating, onSimulate, title = "Dashboard", subtitle }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`sticky top-0 z-20 transition ${
        scrolled
          ? "border-b border-white/70 bg-white/65 backdrop-blur-xl"
          : "border-b border-line bg-white"
      }`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {subtitle || "Monitor real-time payment risk, fraud signals, and user behavior."}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-500 ${
              scrolled
                ? "border border-white/70 bg-white/70 backdrop-blur-xl"
                : "border border-gray-200 bg-white"
            }`}
          >
            <Search size={16} />
            <span>Search users or transactions</span>
          </div>
          <button
            onClick={() => onSimulate("normal")}
            disabled={simulating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {simulating ? "Processing..." : "Simulate Normal"}
          </button>
          <button
            onClick={() => onSimulate("fraud")}
            disabled={simulating}
            className="rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
          >
            {simulating ? "Scoring..." : "Simulate Fraud"}
          </button>
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
              scrolled
                ? "border border-white/70 bg-white/70 backdrop-blur-xl"
                : "border border-gray-200 bg-white"
            }`}
          >
            <UserCircle2 size={18} className="text-gray-500" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">FraudOps Admin</p>
              <p className="text-xs text-gray-500">admin@finsecure.ai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useMemo, useRef, useState } from "react";
import { api, setAuthToken } from "./api/client.js";
import { useLiveFeed } from "./hooks/useLiveFeed.js";
import { AlertList } from "./components/AlertList.jsx";
import { BehaviorAnalytics } from "./components/BehaviorAnalytics.jsx";
import { MetricCard } from "./components/MetricCard.jsx";
import { RiskChart } from "./components/RiskChart.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { Table } from "./components/Table.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { TransactionControls } from "./components/TransactionControls.jsx";

const initialDashboard = {
  metrics: {
    processedTransactions: 0,
    flaggedTransactions: 0,
    averageRiskScore: 0,
    redisAvailable: false
  },
  liveFeed: [],
  fraudTrend: [],
  alerts: [],
  userProfiles: []
};

const hasDashboardData = (dashboard) =>
  dashboard.liveFeed.length > 0 ||
  dashboard.fraudTrend.length > 0 ||
  dashboard.alerts.length > 0 ||
  dashboard.userProfiles.length > 0;

function App() {
  const [token, setToken] = useState("");
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [selectedReceiverId, setSelectedReceiverId] = useState("");
  const bootstrapStartedRef = useRef(false);
  const overviewLoadedRef = useRef(false);
  const sectionRefs = useRef({});
  const { events, alerts: socketAlerts } = useLiveFeed(Boolean(token));

  useEffect(() => {
    if (bootstrapStartedRef.current) {
      return;
    }
    bootstrapStartedRef.current = true;

    const bootstrap = async () => {
      try {
        setLoading(true);
        const response = await api.post("/auth/login", {
          email: "admin@finsecure.ai",
          password: "Admin@123"
        });
        setToken(response.data.token);
        setAuthToken(response.data.token);
      } catch (error) {
        setAuthError(error.response?.data?.message || "Unable to sign in");
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!token || overviewLoadedRef.current) {
      return;
    }
    overviewLoadedRef.current = true;

    const loadDashboard = async () => {
      try {
        setOverviewLoading(true);
        const response = await api.get("/dashboard/overview");
        setDashboard(response.data);
      } finally {
        setOverviewLoading(false);
      }
    };

    loadDashboard();
  }, [token]);

  const mergedFeed = useMemo(
    () =>
      [...events, ...dashboard.liveFeed]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 20),
    [events, dashboard.liveFeed]
  );

  const mergedAlerts = useMemo(
    () => [...socketAlerts, ...dashboard.alerts].slice(0, 8),
    [socketAlerts, dashboard.alerts]
  );

  useEffect(() => {
    if (!dashboard.userProfiles.length) {
      return;
    }

    if (!selectedSenderId) {
      setSelectedSenderId(dashboard.userProfiles[0].id);
    }

    if (!selectedReceiverId) {
      const fallbackReceiver =
        dashboard.userProfiles.find((user) => user.id !== dashboard.userProfiles[0].id)?.id ||
        dashboard.userProfiles[0].id;
      setSelectedReceiverId(fallbackReceiver);
    }
  }, [dashboard.userProfiles, selectedReceiverId, selectedSenderId]);

  useEffect(() => {
    if (selectedSenderId && selectedSenderId === selectedReceiverId) {
      const fallbackReceiver =
        dashboard.userProfiles.find((user) => user.id !== selectedSenderId)?.id || "";
      setSelectedReceiverId(fallbackReceiver);
    }
  }, [dashboard.userProfiles, selectedReceiverId, selectedSenderId]);

  const refreshOverview = async () => {
    const response = await api.get("/dashboard/overview");
    overviewLoadedRef.current = true;
    setDashboard(response.data);
  };

  const submitTransaction = async (payload) => {
    try {
      setSimulating(true);
      setOverviewLoading(true);
      await api.post("/transactions/simulate", payload);
      await refreshOverview();
    } finally {
      setOverviewLoading(false);
      setSimulating(false);
    }
  };

  const simulate = async (mode) =>
    submitTransaction({
      mode,
      senderId: selectedSenderId || undefined,
      receiverId: selectedReceiverId || undefined
    });

  const submitManualTransaction = async (payload) =>
    submitTransaction({
      ...payload,
      mode: "manual"
    });

  const panelLoading = overviewLoading && !hasDashboardData(dashboard);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-muted">Loading dashboard...</div>;
  }

  if (authError) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-fraud">{authError}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-text">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          activeItem={activeSection}
          onNavigate={scrollToSection}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar simulating={simulating} onSimulate={simulate} />
          <main className="flex-1 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-6">
              {overviewLoading ? (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-brand">
                  Refreshing transaction data and risk signals...
                </div>
              ) : null}

              <section
                ref={(node) => {
                  sectionRefs.current.dashboard = node;
                }}
                className="mb-4"
              >
                <TransactionControls
                  users={dashboard.userProfiles}
                  selectedSenderId={selectedSenderId}
                  selectedReceiverId={selectedReceiverId}
                  onSenderChange={setSelectedSenderId}
                  onReceiverChange={setSelectedReceiverId}
                  onAutoSimulate={simulate}
                  onManualSubmit={submitManualTransaction}
                  simulating={simulating}
                />
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Transactions"
                  value={dashboard.metrics.processedTransactions}
                  helper="Latest window"
                  tone="text-text"
                  loading={panelLoading}
                />
                <MetricCard
                  label="Fraud Cases"
                  value={dashboard.metrics.flaggedTransactions}
                  helper="Suspicious + fraud"
                  tone="text-fraud"
                  loading={panelLoading}
                />
                <MetricCard
                  label="Average Risk"
                  value={dashboard.metrics.averageRiskScore}
                  helper="0 to 100"
                  tone="text-suspicious"
                  loading={panelLoading}
                />
                <MetricCard
                  label="Cache State"
                  value={dashboard.metrics.redisAvailable ? "Redis" : "Memory"}
                  helper="Recent transactions"
                  tone="text-brand"
                  loading={panelLoading}
                />
              </section>

              <section
                ref={(node) => {
                  sectionRefs.current.alerts = node;
                }}
                className="mt-4 grid gap-4 xl:grid-cols-10"
              >
                <div className="xl:col-span-7">
                  <RiskChart data={dashboard.fraudTrend} loading={panelLoading} />
                </div>
                <div className="xl:col-span-3">
                  <AlertList alerts={mergedAlerts} loading={panelLoading} />
                </div>
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-10">
                <div className="xl:col-span-6">
                  <div
                    ref={(node) => {
                      sectionRefs.current.transactions = node;
                    }}
                  >
                    <Table rows={mergedFeed} loading={panelLoading} />
                  </div>
                </div>
                <div className="xl:col-span-4">
                  <div
                    ref={(node) => {
                      sectionRefs.current.analytics = node;
                    }}
                  >
                    <BehaviorAnalytics users={dashboard.userProfiles} loading={panelLoading} />
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

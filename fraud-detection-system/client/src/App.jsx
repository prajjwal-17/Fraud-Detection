import { useEffect, useMemo, useRef, useState } from "react";
import { api, setAuthToken } from "./api/client.js";
import { AlertList } from "./components/AlertList.jsx";
import { AuditTrailView } from "./components/AuditTrailView.jsx";
import { BehaviorAnalytics } from "./components/BehaviorAnalytics.jsx";
import { CasesView } from "./components/CasesView.jsx";
import { GraphConnections } from "./components/GraphConnections.jsx";
import { MetricCard } from "./components/MetricCard.jsx";
import { RiskChart } from "./components/RiskChart.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { SidePanel } from "./components/SidePanel.jsx";
import { StatusPanel } from "./components/StatusPanel.jsx";
import { Table } from "./components/Table.jsx";
import { Topbar } from "./components/Topbar.jsx";
import { TransactionControls } from "./components/TransactionControls.jsx";
import { useLiveFeed } from "./hooks/useLiveFeed.js";

const initialOverview = {
  metrics: {
    processedTransactions: 0,
    flaggedTransactions: 0,
    openCases: 0,
    averageRiskScore: 0,
    redisAvailable: false
  },
  liveFeed: [],
  fraudTrend: [],
  alerts: [],
  userProfiles: [],
  admins: [],
  status: null
};

const viewMeta = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Monitor payment risk, analyst queues, and platform health in real time."
  },
  cases: {
    title: "Cases",
    subtitle: "Investigate flagged transactions, assign ownership, and close reviews with resolution notes."
  },
  transactions: {
    title: "Transactions",
    subtitle: "Review the latest scored transactions and open explainability details."
  },
  alerts: {
    title: "Alerts",
    subtitle: "Prioritized fraud alerts sorted by severity and recency for operational response."
  },
  analytics: {
    title: "Analytics",
    subtitle: "Explore user risk posture, device behavior, and connected-account relationships."
  },
  audit: {
    title: "Audit Trail",
    subtitle: "Inspect scoring decisions, fallback behavior, and explanation evidence for compliance."
  }
};

function App() {
  const [token, setToken] = useState("");
  const [overview, setOverview] = useState(initialOverview);
  const [cases, setCases] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [graphInsights, setGraphInsights] = useState([]);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedSenderId, setSelectedSenderId] = useState("");
  const [selectedReceiverId, setSelectedReceiverId] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const bootstrapStartedRef = useRef(false);
  const { events, alerts: socketAlerts } = useLiveFeed(Boolean(token));

  const mergedFeed = useMemo(
    () =>
      [...events, ...overview.liveFeed]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 30),
    [events, overview.liveFeed]
  );

  const mergedAlerts = useMemo(
    () =>
      [...socketAlerts, ...overview.alerts]
        .sort((a, b) => {
          const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
          return (
            (order[b.priority] || 0) - (order[a.priority] || 0) ||
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
        })
        .slice(0, 20),
    [socketAlerts, overview.alerts]
  );

  useEffect(() => {
    if (bootstrapStartedRef.current) return;
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

  const loadPlatformData = async () => {
    const [overviewResponse, casesResponse, auditResponse, graphResponse] = await Promise.all([
      api.get("/dashboard/overview"),
      api.get("/dashboard/cases"),
      api.get("/dashboard/audit-trail"),
      api.get("/dashboard/graph-insights")
    ]);

    setOverview(overviewResponse.data);
    setCases(casesResponse.data.cases);
    setAuditLogs(auditResponse.data.logs);
    setGraphInsights(graphResponse.data.connections);
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        setRefreshing(true);
        await loadPlatformData();
      } finally {
        setRefreshing(false);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (!overview.userProfiles.length) return;
    if (!selectedSenderId) setSelectedSenderId(overview.userProfiles[0].id);
    if (!selectedReceiverId) {
      setSelectedReceiverId(
        overview.userProfiles.find((user) => user.id !== overview.userProfiles[0].id)?.id || ""
      );
    }
  }, [overview.userProfiles, selectedReceiverId, selectedSenderId]);

  useEffect(() => {
    if (selectedSenderId && selectedSenderId === selectedReceiverId) {
      setSelectedReceiverId(
        overview.userProfiles.find((user) => user.id !== selectedSenderId)?.id || ""
      );
    }
  }, [overview.userProfiles, selectedReceiverId, selectedSenderId]);

  const simulate = async (mode, options = {}) => {
    try {
      setSimulating(true);
      setRefreshing(true);

      const iterations = options.burstCount || 1;
      for (let index = 0; index < iterations; index += 1) {
        const payload = {
          mode,
          senderId: selectedSenderId || undefined,
          receiverId: selectedReceiverId || undefined,
          amount: options.amount,
          deviceId: options.deviceChange ? `anomaly-device-${Date.now()}-${index}` : undefined,
          location:
            options.locationJumpDistance > 0
              ? {
                  city: `${options.locationJumpDistance}km Jump`,
                  lat: options.locationJumpDistance / 10,
                  lng: options.locationJumpDistance / 12
                }
              : undefined
        };

        await api.post("/transactions/simulate", payload);
      }

      await loadPlatformData();
    } finally {
      setRefreshing(false);
      setSimulating(false);
    }
  };

  const submitManualTransaction = async (payload) => {
    try {
      setSimulating(true);
      setRefreshing(true);
      await api.post("/transactions/simulate", {
        ...payload,
        mode: "manual"
      });
      await loadPlatformData();
    } finally {
      setRefreshing(false);
      setSimulating(false);
    }
  };

  const openTransaction = async (transactionId) => {
    const response = await api.get(`/dashboard/transactions/${transactionId}`);
    setSelectedTransaction(response.data);
  };

  const openUserProfile = async (userId) => {
    const response = await api.get(`/dashboard/users/${userId}/profile`);
    setSelectedUserProfile(response.data);
  };

  const updateCase = async (caseId, payload) => {
    await api.patch(`/dashboard/cases/${caseId}`, payload);
    const response = await api.get("/dashboard/cases");
    setCases(response.data.cases);
  };

  const renderCurrentView = () => {
    if (currentView === "cases") {
      return <CasesView cases={cases} admins={overview.admins || []} onUpdateCase={updateCase} />;
    }

    if (currentView === "transactions") {
      return <Table rows={mergedFeed} onRowClick={openTransaction} />;
    }

    if (currentView === "alerts") {
      return (
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <AlertList alerts={mergedAlerts} />
          <StatusPanel status={overview.status} />
        </div>
      );
    }

    if (currentView === "analytics") {
      return (
        <div className="grid gap-4 xl:grid-cols-[0.9fr,1.1fr]">
          <BehaviorAnalytics users={overview.userProfiles} onSelectUser={openUserProfile} />
          <GraphConnections connections={graphInsights} />
        </div>
      );
    }

    if (currentView === "audit") {
      return <AuditTrailView logs={auditLogs} />;
    }

    return (
      <>
        <section className="mb-4">
          <TransactionControls
            users={overview.userProfiles}
            selectedSenderId={selectedSenderId}
            selectedReceiverId={selectedReceiverId}
            onSenderChange={setSelectedSenderId}
            onReceiverChange={setSelectedReceiverId}
            onAutoSimulate={simulate}
            onManualSubmit={submitManualTransaction}
            simulating={simulating}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            label="Transactions"
            value={overview.metrics.processedTransactions}
            helper="Latest window"
          />
          <MetricCard label="Fraud Cases" value={overview.metrics.flaggedTransactions} helper="Scored queue" tone="text-fraud" />
          <MetricCard label="Open Cases" value={overview.metrics.openCases} helper="Investigation workflow" tone="text-blue-600" />
          <MetricCard label="Average Risk" value={overview.metrics.averageRiskScore} helper="0 to 100" tone="text-suspicious" />
          <MetricCard
            label="Cache State"
            value={overview.metrics.redisAvailable ? "Redis" : "Memory"}
            helper="Recent transactions"
            tone="text-blue-600"
          />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
          <StatusPanel status={overview.status} />
          <GraphConnections connections={graphInsights.slice(0, 4)} />
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-10">
          <div className="xl:col-span-7">
            <RiskChart data={overview.fraudTrend} />
          </div>
          <div className="xl:col-span-3">
            <AlertList alerts={mergedAlerts} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-10">
          <div className="xl:col-span-6">
            <Table rows={mergedFeed} onRowClick={openTransaction} />
          </div>
          <div className="xl:col-span-4">
            <BehaviorAnalytics users={overview.userProfiles} onSelectUser={openUserProfile} />
          </div>
        </section>
      </>
    );
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Loading analyst platform...</div>;
  }

  if (authError) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-red-600">{authError}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((current) => !current)}
          activeItem={currentView}
          onNavigate={setCurrentView}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            simulating={simulating}
            onSimulate={simulate}
            title={viewMeta[currentView].title}
            subtitle={viewMeta[currentView].subtitle}
          />
          <main className="flex-1 bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-6">
              {refreshing ? (
                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-600">
                  Refreshing fraud telemetry, analyst queues, and system health...
                </div>
              ) : null}
              {renderCurrentView()}
            </div>
          </main>
        </div>
      </div>

      <SidePanel
        open={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Explanation"
        subtitle="Why this transaction was scored the way it was."
      >
        {selectedTransaction?.transaction ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">
                {selectedTransaction.transaction.sender?.name} → {selectedTransaction.transaction.receiver?.name}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Rs. {selectedTransaction.transaction.amount?.toLocaleString()} · {selectedTransaction.transaction.decision} · {selectedTransaction.transaction.priority}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">ML + rules breakdown</p>
              <p className="mt-2 text-sm text-gray-700">
                ML score: {Math.round((selectedTransaction.riskLog?.mlScore || 0) * 100)}%
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Rules: {(selectedTransaction.riskLog?.ruleSignals || []).join(", ") || "None"}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Top contributing factors</p>
              <div className="mt-3 space-y-2">
                {(selectedTransaction.riskLog?.audit?.explanation || []).map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">
                        Baseline {item.baseline} · Observed {item.observed}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-blue-600">{item.weight}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SidePanel>

      <SidePanel
        open={Boolean(selectedUserProfile)}
        onClose={() => setSelectedUserProfile(null)}
        title={selectedUserProfile?.user?.name || "User Risk Profile"}
        subtitle="Deep-dive view for analyst investigation."
      >
        {selectedUserProfile?.user ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">{selectedUserProfile.user.email}</p>
              <p className="mt-1 text-sm text-gray-500">
                Average amount Rs. {Math.round(selectedUserProfile.user.profile?.averageAmount || 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Recent transactions</p>
              <div className="mt-3 space-y-2">
                {selectedUserProfile.transactions.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-900">{item.receiver?.name}</span>
                    <span className="text-sm text-gray-500">Rs. {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-medium text-gray-900">Device history</p>
              <div className="mt-3 space-y-2">
                {selectedUserProfile.deviceHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-gray-50 px-3 py-2">
                    <span className="text-sm text-gray-900">{item.deviceId}</span>
                    <span className="text-xs text-gray-500">{item.city}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SidePanel>
    </div>
  );
}

export default App;

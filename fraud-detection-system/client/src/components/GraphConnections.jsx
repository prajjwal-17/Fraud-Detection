export const GraphConnections = ({ connections }) => (
  <div className="panel rounded-lg p-4">
    <div className="mb-4">
      <h2 className="text-base font-semibold text-gray-900">Connected Accounts</h2>
      <p className="mt-1 text-sm text-gray-500">Repeated sender-receiver relationships and suspicious clusters.</p>
    </div>

    <div className="space-y-3">
      {connections.map((edge, index) => (
        <div key={`${edge.senderId}-${edge.receiverId}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">
              {edge.senderName} → {edge.receiverName}
            </p>
            {edge.suspiciousCluster ? (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                Cluster risk
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {edge.transfers} transfers • Rs. {Math.round(edge.totalAmount).toLocaleString()} total • max risk {edge.maxRisk}
          </p>
        </div>
      ))}
    </div>
  </div>
);

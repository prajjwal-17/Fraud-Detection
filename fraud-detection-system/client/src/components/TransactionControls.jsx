import { useEffect, useMemo, useState } from "react";

const selectClassName =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500";
const inputClassName =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500";

export const TransactionControls = ({
  users,
  selectedSenderId,
  selectedReceiverId,
  onSenderChange,
  onReceiverChange,
  onAutoSimulate,
  onManualSubmit,
  simulating
}) => {
  const [activeTab, setActiveTab] = useState("automated");
  const [manualForm, setManualForm] = useState({
    senderId: selectedSenderId || "",
    receiverId: selectedReceiverId || "",
    amount: "2500",
    deviceId: "manual-device",
    city: "Mumbai"
  });

  const receiverOptions = useMemo(
    () => users.filter((user) => user.id !== selectedSenderId),
    [users, selectedSenderId]
  );

  const manualReceiverOptions = useMemo(
    () => users.filter((user) => user.id !== manualForm.senderId),
    [users, manualForm.senderId]
  );

  const updateManualField = (field, value) => {
    setManualForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  useEffect(() => {
    if (!manualForm.senderId && selectedSenderId) {
      setManualForm((current) => ({
        ...current,
        senderId: selectedSenderId
      }));
    }

    if (!manualForm.receiverId && selectedReceiverId) {
      setManualForm((current) => ({
        ...current,
        receiverId: selectedReceiverId
      }));
    }
  }, [manualForm.receiverId, manualForm.senderId, selectedReceiverId, selectedSenderId]);

  const submitManual = () => {
    onManualSubmit({
      senderId: manualForm.senderId,
      receiverId: manualForm.receiverId,
      amount: Number(manualForm.amount),
      deviceId: manualForm.deviceId,
      location: {
        city: manualForm.city
      }
    });
  };

  return (
    <div className="panel rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Transaction Controls</h2>
          <p className="mt-1 text-sm text-gray-500">
            Run automated scenarios for selected users or submit a manual transaction.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setActiveTab("automated")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === "automated" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Automated
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              activeTab === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Manual
          </button>
        </div>
      </div>

      {activeTab === "automated" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr,1fr,auto]">
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">Sender</label>
            <select
              value={selectedSenderId}
              onChange={(event) => onSenderChange(event.target.value)}
              className={selectClassName}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">Receiver</label>
            <select
              value={selectedReceiverId}
              onChange={(event) => onReceiverChange(event.target.value)}
              className={selectClassName}
            >
              {receiverOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => onAutoSimulate("normal")}
              disabled={simulating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >
              Normal
            </button>
            <button
              onClick={() => onAutoSimulate("fraud")}
              disabled={simulating}
              className="rounded-lg border border-red-500 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
            >
              Fraud
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">Sender</label>
            <select
              value={manualForm.senderId}
              onChange={(event) => updateManualField("senderId", event.target.value)}
              className={selectClassName}
            >
              <option value="">Select sender</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">Receiver</label>
            <select
              value={manualForm.receiverId}
              onChange={(event) => updateManualField("receiverId", event.target.value)}
              className={selectClassName}
            >
              <option value="">Select receiver</option>
              {manualReceiverOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">Amount</label>
            <input
              type="number"
              min="1"
              value={manualForm.amount}
              onChange={(event) => updateManualField("amount", event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">Device ID</label>
            <input
              type="text"
              value={manualForm.deviceId}
              onChange={(event) => updateManualField("deviceId", event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-gray-500">City</label>
            <input
              type="text"
              value={manualForm.city}
              onChange={(event) => updateManualField("city", event.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-5">
            <button
              onClick={submitManual}
              disabled={
                simulating ||
                !manualForm.senderId ||
                !manualForm.receiverId ||
                !manualForm.amount ||
                !manualForm.city
              }
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {simulating ? "Submitting..." : "Submit Manual Transaction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const deriveAlerts = ({ amount, behaviorFeatures, rulesTriggered, decision, priority }) => {
  const alerts = [];

  if (amount > 50000 && behaviorFeatures.amount_delta_ratio > 3) {
    alerts.push("High-value unusual transaction");
  }

  if (behaviorFeatures.device_mismatch) {
    alerts.push("New device login or device mismatch");
  }

  if (behaviorFeatures.velocity_1h >= 5) {
    alerts.push("Rapid multiple transfers detected");
  }

  if (decision === "FRAUD" || rulesTriggered.length >= 2) {
    alerts.push("Manual review required");
  }

  if (priority === "CRITICAL") {
    alerts.push("Critical fraud priority queue");
  }

  return alerts;
};

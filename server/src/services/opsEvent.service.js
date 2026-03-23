import { OpsEvent } from "../models/OpsEvent.js";

export const logOpsEvent = async ({
  type,
  severity = "INFO",
  message,
  userId = null,
  transactionId = null,
  metadata = {}
}) =>
  OpsEvent.create({
    type,
    severity,
    message,
    userId,
    transactionId,
    metadata
  });


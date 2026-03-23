import { DeviceSession } from "../models/DeviceSession.js";
import { Transaction } from "../models/Transaction.js";

const haversineKm = (pointA, pointB) => {
  if (!pointA?.lat || !pointA?.lng || !pointB?.lat || !pointB?.lng) {
    return 0;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const dLat = toRad(pointB.lat - pointA.lat);
  const dLng = toRad(pointB.lng - pointA.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pointA.lat)) *
      Math.cos(toRad(pointB.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(a));
};

export const buildBehaviorFeatures = async ({ sender, amount, deviceId, location }) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [recentHour, recentDay, deviceSession] = await Promise.all([
    Transaction.find({
      sender: sender._id,
      createdAt: { $gte: oneHourAgo }
    }).lean(),
    Transaction.find({
      sender: sender._id,
      createdAt: { $gte: dayAgo }
    }).lean(),
    DeviceSession.findOne({ userId: sender._id, deviceId }).lean()
  ]);

  const averageAmount =
    recentDay.length > 0
      ? recentDay.reduce((sum, tx) => sum + tx.amount, 0) / recentDay.length
      : sender.profile?.averageAmount || amount;

  const locationDeviationKm = haversineKm(sender.homeLocation, location);
  const trustedDevices = sender.trustedDevices || [];
  const deviceMismatch = trustedDevices.includes(deviceId) ? 0 : 1;

  return {
    avg_amount_24h: Number(averageAmount.toFixed(2)),
    amount_delta_ratio: Number((amount / Math.max(averageAmount, 1)).toFixed(2)),
    velocity_1h: recentHour.length,
    velocity_24h: recentDay.length,
    location_deviation_km: Number(locationDeviationKm.toFixed(2)),
    device_mismatch: deviceMismatch,
    known_device_session: deviceSession ? 1 : 0,
    hour_of_day: now.getHours()
  };
};

export const upsertDeviceSession = async ({ userId, deviceId, location, isTrusted }) =>
  DeviceSession.findOneAndUpdate(
    { userId, deviceId },
    {
      $set: {
        lastLocation: location,
        lastSeenAt: new Date(),
        isTrusted
      }
    },
    { upsert: true, new: true }
  );

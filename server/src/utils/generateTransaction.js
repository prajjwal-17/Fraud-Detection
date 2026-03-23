const locations = [
  { city: "Mumbai", lat: 19.076, lng: 72.8777 },
  { city: "Delhi", lat: 28.6139, lng: 77.209 },
  { city: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { city: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { city: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Dubai", lat: 25.2048, lng: 55.2708 }
];

const pick = (items) => items[Math.floor(Math.random() * items.length)];

export const generateSimulationPayload = ({ sender, receiver, mode }) => {
  const fraudMode = mode === "fraud";
  const trustedDevices = sender.trustedDevices?.length
    ? sender.trustedDevices
    : ["device-fallback-mobile"];
  return {
    senderId: sender._id,
    receiverId: receiver._id,
    amount: fraudMode
      ? Math.floor(65000 + Math.random() * 120000)
      : Math.floor(200 + Math.random() * 12000),
    deviceId: fraudMode ? `unknown-device-${Date.now()}` : pick(trustedDevices),
    location: fraudMode ? pick(locations.slice(4)) : sender.homeLocation,
    mode
  };
};

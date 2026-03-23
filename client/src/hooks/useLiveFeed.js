import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useLiveFeed = (enabled) => {
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const socket = io(socketUrl, {
      transports: ["websocket"]
    });

    socket.emit("subscribe:admin");
    socket.on("transaction:created", (event) => {
      setEvents((current) => [event, ...current].slice(0, 20));
    });
    socket.on("alert:created", (event) => {
      setAlerts((current) => [event, ...current].slice(0, 10));
    });

    return () => socket.disconnect();
  }, [enabled]);

  return { events, alerts };
};

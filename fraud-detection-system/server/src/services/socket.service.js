let ioInstance;

export const initializeSocket = (io) => {
  ioInstance = io;
  io.on("connection", (socket) => {
    socket.on("subscribe:admin", () => {
      socket.join("admins");
    });
  });
};

export const broadcastRiskEvent = (event, payload) => {
  ioInstance?.to("admins").emit(event, payload);
};

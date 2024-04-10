import { Server } from "socket.io";
import { Game } from "./classes/game";

const rooms = new Map<String, Game>();

export function setupListeners(io: Server) {
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("join-game", (roomId: string, name: string) => {
      if (!roomId) {
        return socket.emit("join-error", "Room ID  required");
      }

      if (!name) {
        return socket.emit("join-error", "Name required");
      }

      // Join user to room
      socket.join(roomId);

      if (rooms.has(roomId)) {
        const game = rooms.get(roomId);
        if (!game) {
          return socket.emit("join-error", "Game does not exist");
        }
      }
    });
  });
}

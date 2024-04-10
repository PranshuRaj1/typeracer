import { Server, Socket } from "socket.io";

export class Game {
  gameStatus: "pending" | "started" | "finished";
  gameId: string;
  players: { id: string; score: number; name: string }[];
  io: Server;
  gameHost: string;
  paragraph: string;

  constructor(id: string, io: Server, host: string) {
    this.gameId = id;
    this.io = io;
    this.gameHost = host;
    this.players = [];
    this.gameStatus = "pending";
    this.paragraph = "";
  }

  setupListeners(socket: Socket) {}

  joinPlayer(id: string, name: string, socket: Socket) {
    if (this.gameStatus !== "started") {
      return socket.emit("error", "Game has already started");
    }

    this.players.push({
      id,
      name,
      score: 0,
    });
    //socket refers to user
    //io refers to everyone

    this.io.to(this.gameId).emit("player-joined", {
      id,
      name,
      score: 0,
    });

    socket.emit("player", this.players);
    socket.emit("new_user", this.gameHost);

    this.setupListeners(socket);
  }
}

import { Server, Socket } from "socket.io";
import { generateParagraph } from "../utils/genrateParagraph";
import { rooms } from "../setupListeners";

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

  setupListeners(socket: Socket) {
    socket.on("start-game", async () => {
      if (this.gameStatus === "pending") {
        return socket.emit("error", "Game has already started");
      }

      if (this.gameHost !== socket.id) {
        return socket.emit("error", "Only game host can start game");
      }

      for (const player of this.players) {
        player.score = 0;
      }

      this.io.to(this.gameId).emit("players", this.players);

      this.gameStatus = "started";

      const paragraph = await generateParagraph();
      this.paragraph = paragraph;
      this.io.to(this.gameId).emit("game-started", paragraph);

      setTimeout(() => {
        this.gameStatus = "finished";
        this.io.to(this.gameId).emit("game-finished");
        this.io.to(this.gameId).emit("players", this.players);
      }, 60000);
    });
    socket.on("player-typed", (typed: string) => {
      if (this.gameStatus !== "started") {
        return socket.emit("error", "Game has not started yet");
      }

      const splittedParagraph = this.paragraph.split(" ");
      const splittedTyped = typed.split(" ");

      let score = 0;

      for (let i = 0; i < splittedParagraph.length; i++) {
        if (splittedTyped[i] === splittedParagraph[i]) {
          score++;
        } else {
          break;
        }
      }

      const player = this.players.find((player) => player.id === socket.id);
      if (player) {
        player.score = score;
        this.io
          .to(this.gameId)
          .emit("player-score", { id: socket.id, score: score });
      }
    });
    socket.on("leave", () => {
      if (socket.id === this.gameHost) {
        this.players = this.players.filter((player) => player.id !== socket.id);

        if (this.players.length !== 0) {
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit("host-changed", this.gameHost);
          this.io.to(this.gameId).emit("players-left", socket.id);
        } else {
          rooms.delete(this.gameId);
        }
      }
      socket.leave(this.gameId);
      this.players = this.players.filter((player) => player.id !== socket.id);
      this.io.to(this.gameId).emit("player-left", socket.id);
    });
    socket.on("disconnect", () => {
      if (socket.id === this.gameHost) {
        this.players = this.players.filter((player) => player.id !== socket.id);

        if (this.players.length !== 0) {
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit("host-changed", this.gameHost);
          this.io.to(this.gameId).emit("players-left", socket.id);
        } else {
          rooms.delete(this.gameId);
        }
      }
      socket.leave(this.gameId);
      this.players = this.players.filter((player) => player.id !== socket.id);
      this.io.to(this.gameId).emit("player-left", socket.id);
    });
  }

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

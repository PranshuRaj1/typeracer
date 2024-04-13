export type Player = {
  id: string;
  score: number;
  name: string;
};

export type PlayerScore = {
  id: string;
  score: number;
};

export type GameStatus = "pending" | "started" | "finished";

export type GameProps = {
  gameId: string;
  name: string;
};

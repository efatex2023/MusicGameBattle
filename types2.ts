// Hand-written mirrors of backend/models/schemas.py and the engine's room snapshot (lib/engine.py Room.view).
export type Mode = "guess" | "word";
export type Phase = "idle" | "ready" | "open" | "buzzed" | "done";
export type RoomStatus = "lobby" | "countdown" | "playing" | "ended";
export type TeamStatus = "active" | "blocked" | "removed";
export type Difficulty = "facile" | "media" | "difficile";

export const MODE_LABEL: Record<Mode, string> = { guess: "INDOVINA IL BRANO", word: "PAROLA BATTLE" };

export interface RoomCreated { code: string; master_token: string; mode: Mode }
export interface RoomPublic { code: string; name: string; mode: Mode; status: RoomStatus; team_count: number }
export interface JoinResponse { team_id: string; token: string; recovery_code: string; name: string; color: string }

export interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  year: number | null;
  artwork: string | null;
  preview_url: string | null;
  duration_ms: number | null;
}
export interface Genre { key: string; label: string }

export interface BoardRow { id: string; name: string; color: string; score: number; correct: number; position: number }
export interface TeamView extends BoardRow { status: TeamStatus; connected: boolean }

export interface Settings {
  genres: string[];
  year_min: number;
  year_max: number;
  excerpt: number;
  difficulty: Difficulty;
  prefer_common: boolean;
}

export interface TurnView {
  n: number;
  phase: Phase;
  buzzed_team_id: string | null;
  buzzed_team_name: string | null;
  buzz_seq: number | null;
  buzz_at: number | null;
  result: "correct" | "skipped" | "closed" | null;
  winner_team_id: string | null;
  attempts: number;
  playing: boolean;
  track: Track | null;
  word: string | null;
  word_visible: boolean;
}

export interface GameEvent {
  id: string;
  type: "start" | "buzz" | "wrong" | "correct" | "skip" | "open" | "closed" | "ended";
  turn: number;
  ts: number;
  team_id: string | null;
}

export interface RoomState {
  code: string;
  name: string;
  mode: Mode;
  status: RoomStatus;
  paused: boolean;
  master_online: boolean;
  seq: number;
  server_now: number;
  countdown_end: number | null;
  teams: TeamView[];
  leaderboard: BoardRow[];
  turn: TurnView;
  event: GameEvent | null;
  rounds_count: number;
  me: TeamView | null;
  settings: Settings | null;
  generating: boolean;
}

export interface ServerError { code: string; message: string; at: number }

export interface RoundRecord {
  turn: number;
  result: string;
  winner_name: string | null;
  attempts: number;
  at: string | null;
  title: string | null;
  artist: string | null;
  artwork: string | null;
  year: number | null;
  word: string | null;
}
export interface MatchSummary {
  id: string;
  room_code: string;
  mode: Mode;
  name: string;
  started_at: string;
  ended_at: string;
  duration_sec: number;
  team_count: number;
  winners: string[];
  winner_points: number;
}
export interface MatchDetail extends MatchSummary { leaderboard: BoardRow[]; rounds: RoundRecord[] }
export interface DeleteResult { deleted: boolean }

// Device credentials only (master token / team token). Game data and history live on the server.
import type { JoinResponse } from "./types";

const mk = (code: string) => `mb:master:${code.toUpperCase()}`;
const tk = (code: string) => `mb:team:${code.toUpperCase()}`;

export const saveMaster = (code: string, token: string) => localStorage.setItem(mk(code), token);
export const getMaster = (code: string) => localStorage.getItem(mk(code));

export const saveTeam = (code: string, t: JoinResponse) => localStorage.setItem(tk(code), JSON.stringify(t));
export function getTeam(code: string): JoinResponse | null {
  try {
    const raw = localStorage.getItem(tk(code));
    return raw ? (JSON.parse(raw) as JoinResponse) : null;
  } catch {
    return null;
  }
}
export const clearTeam = (code: string) => localStorage.removeItem(tk(code));

export const joinLink = (code: string) => `${window.location.origin}/join?code=${code.toUpperCase()}`;

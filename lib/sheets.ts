import { parseCSV } from "./csv";
import type { RaceInfo, RaceParticipant, Member, RaceRecord } from "./types";

const SHEET_ID = "16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw";

const GID = {
  대회현황: "267782969",
  대회참여현황: "573958893",
  가입신청서: "0",
  대회기록: "1638315503",
} as const;

function csvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
}

const CACHE_TTL = 5 * 60 * 1000; // 5분

function getCached<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // quota exceeded — ignore
  }
}

async function fetchSheet(gid: string): Promise<string[][]> {
  const cacheKey = `sheet_${gid}`;
  const cached = getCached<string[][]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(csvUrl(gid));
  if (!res.ok) throw new Error(`Failed to fetch sheet ${gid}: ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  // 헤더 제거
  const data = rows.slice(1);
  setCache(cacheKey, data);
  return data;
}

export async function fetchRaces(): Promise<RaceInfo[]> {
  const rows = await fetchSheet(GID.대회현황);
  return rows.map((row) => ({
    competitionId: row[0] || "",
    type: row[1] || "",
    name: row[2] || "",
    competitionClass: row[3] || "",
    distanceKm: parseFloat(row[4]) || 0,
    pbKey: row[5] || "",
    date: row[6] || "",
  }));
}

export async function fetchParticipants(): Promise<RaceParticipant[]> {
  const rows = await fetchSheet(GID.대회참여현황);
  return rows.map((row) => ({
    memberId: row[0] || "",
    memberName: row[1] || "",
    competitionId: row[2] || "",
    competitionName: row[3] || "",
    competitionClass: row[4] || "",
    status: row[5] || "",
    pledge: row[6] || "",
  }));
}

export async function fetchMembers(): Promise<Member[]> {
  const rows = await fetchSheet(GID.가입신청서);
  return rows.map((row) => ({
    memberId: row[0] || "",
    name: row[1] || "",
    gender: row[2] || "",
    birthDate: row[3] || "",
    status: row[5] || "",
  }));
}

export async function fetchRecords(): Promise<RaceRecord[]> {
  const rows = await fetchSheet(GID.대회기록);
  return rows.map((row) => ({
    name: row[0] || "",
    raceName: row[1] || "",
    course: row[2] || "",
    record: row[3] || "",
    raceDate: row[4] || "",
  }));
}

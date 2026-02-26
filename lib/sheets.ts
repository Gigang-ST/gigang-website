import { parseCSV } from "./csv";
import type { RaceInfo, RaceParticipant, Member, RaceRecord, FeeRecord } from "./types";

type SheetName = "races" | "participants" | "members" | "records" | "fees";

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

async function fetchSheet(name: SheetName): Promise<string[][]> {
  const cacheKey = `sheet_${name}`;
  const cached = getCached<string[][]>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/api/sheets/${name}`);
  if (!res.ok) throw new Error(`Failed to fetch sheet ${name}: ${res.status}`);
  const text = await res.text();
  const rows = parseCSV(text);
  // 헤더 제거
  const data = rows.slice(1);
  setCache(cacheKey, data);
  return data;
}

export async function fetchRaces(): Promise<RaceInfo[]> {
  const rows = await fetchSheet("races");
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
  const rows = await fetchSheet("participants");
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
  const rows = await fetchSheet("members");
  return rows.map((row) => ({
    memberId: row[0] || "",
    name: row[1] || "",
    gender: row[2] || "",
    birthDate: row[3] || "",
    status: row[5] || "",
    joinDate: row[8] || "",
  }));
}

export async function fetchFees(): Promise<FeeRecord[]> {
  const rows = await fetchSheet("fees");
  return rows.map((row) => ({
    memberId: row[0] || "",
    date: row[1] || "",
    memberName: row[2] || "",
    amount: Number(row[3]) || 0,
    type: row[4] || "",
    note: row[5] || "",
  }));
}

export async function fetchRecords(): Promise<RaceRecord[]> {
  const rows = await fetchSheet("records");
  return rows.map((row) => ({
    recordId: row[0] || "",
    recordType: row[1] || "",
    memberName: row[2] || "",
    competitionId: row[3] || "",
    competitionName: row[4] || "",
    competitionClass: row[5] || "",
    record: row[6] || "",
    competitionDate: row[7] || "",
    swimTime: row[8] || "",
    bikeTime: row[9] || "",
    runTime: row[10] || "",
    utmbSlug: row[11] || "",
    utmbIndex: row[12] || "",
  }));
}

import type { RaceRecord, Member } from "./types";

/** "H:MM:SS" 또는 "HH:MM:SS" → 총 초 */
export function parseTimeToSeconds(time: string): number {
  if (!time) return Infinity;
  const parts = time.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Infinity;
}

/** 총 초 → "H:MM:SS" */
export function formatSecondsToTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "-";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 트랜지션 계산: 총시간 - (수영+자전거+러닝) */
export function calcTransition(
  total: string,
  swim: string,
  bike: string,
  run: string,
): string {
  const totalSec = parseTimeToSeconds(total);
  const partsSec =
    parseTimeToSeconds(swim) +
    parseTimeToSeconds(bike) +
    parseTimeToSeconds(run);
  if (!isFinite(totalSec) || !isFinite(partsSec)) return "-";
  const diff = totalSec - partsSec;
  if (diff < 0) return "-";
  return formatSecondsToTime(diff);
}

/** "YYYY-MM-DD" 또는 "YYYY. M. D" → Date 객체 */
function parseDate(str: string): Date {
  const trimmed = str.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parts = trimmed.replace(/\./g, "").split(/\s+/).map(Number);
  if (parts.length === 3) return new Date(parts[0], parts[1] - 1, parts[2]);
  return new Date(trimmed);
}

/** 최근 N개월 이내 날짜인지 확인 */
export function isWithinMonths(dateStr: string, months: number): boolean {
  if (!dateStr) return false;
  const date = parseDate(dateStr);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  cutoff.setHours(0, 0, 0, 0);
  return date >= cutoff;
}

/** active 회원 이름 Set 생성 */
export function activeMemberNames(members: Member[]): Set<string> {
  return new Set(
    members.filter((m) => m.status === "active").map((m) => m.name),
  );
}

/**
 * 같은 사람의 여러 기록 중 가장 빠른 기록만 남기기
 * courseFilter로 코스 구분 (Full/Half/10K 등)
 */
export function bestPerPerson(
  records: RaceRecord[],
  courseFilter: string,
): RaceRecord[] {
  const filtered = records.filter(
    (r) => r.competitionClass.toLowerCase() === courseFilter.toLowerCase(),
  );

  const bestMap = new Map<string, RaceRecord>();
  for (const r of filtered) {
    const existing = bestMap.get(r.memberName);
    if (
      !existing ||
      parseTimeToSeconds(r.record) < parseTimeToSeconds(existing.record)
    ) {
      bestMap.set(r.memberName, r);
    }
  }

  return Array.from(bestMap.values()).sort(
    (a, b) => parseTimeToSeconds(a.record) - parseTimeToSeconds(b.record),
  );
}

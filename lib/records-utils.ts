import type { ActivityLog, Member } from "@/api/types";

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
		members.filter((m) => m.status === "active").map((m) => m.full_name),
	);
}

/**
 * 같은 사람의 여러 기록 중 가장 빠른 기록만 남기기
 * courseFilter로 코스 구분 (Full/Half/10K 등)
 */
export function bestPerPerson(
	records: ActivityLog[],
	courseFilter: string,
): ActivityLog[] {
	const filtered = records.filter(
		(r) =>
			(r.competition_class || "").toLowerCase() ===
			courseFilter.toLowerCase(),
	);

	const bestMap = new Map<string, ActivityLog>();
	for (const r of filtered) {
		const existing = bestMap.get(r.full_name);
		if (
			!existing ||
			parseTimeToSeconds(r.duration_hhmmss) <
				parseTimeToSeconds(existing.duration_hhmmss)
		) {
			bestMap.set(r.full_name, r);
		}
	}

	return Array.from(bestMap.values()).sort(
		(a, b) =>
			parseTimeToSeconds(a.duration_hhmmss) -
			parseTimeToSeconds(b.duration_hhmmss),
	);
}

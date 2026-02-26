import type { Member } from "@/api/types";

/** "H:MM:SS" 또는 "HH:MM:SS" → 총 초 */
export function parseTimeToSeconds(time: string): number {
	if (!time) return Infinity;
	const parts = time.split(":").map(Number);
	if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
	if (parts.length === 2) return parts[0] * 60 + parts[1];
	return Infinity;
}

/** active 회원 이름 Set 생성 */
export function activeMemberNames(members: Member[]): Set<string> {
	return new Set(
		members.filter((m) => m.status === "active").map((m) => m.full_name),
	);
}

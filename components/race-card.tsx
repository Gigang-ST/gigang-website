"use client";

import type { Race, RaceParticipant } from "@/lib/types";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, string> = {
  road_run: "로드런",
  trail_run: "트레일런",
  triathlon: "트라이애슬론",
  cycling: "사이클",
};

/** 코스 정렬 우선순위 (낮을수록 앞) */
function courseSortKey(competitionClass: string): number {
  const label = competitionClass.toUpperCase();
  if (label === "FULL") return 0;
  if (label === "32K") return 1;
  if (label === "HALF") return 2;
  if (label === "10K") return 3;
  if (label === "5K") return 4;
  if (label === "미정") return 98;
  if (label === "응원") return 99;
  return 50;
}

/**
 * 같은 대회에서 동일 인물이 여러 번 신청한 경우 마지막 신청만 유지
 */
function deduplicateParticipants(participants: RaceParticipant[]): RaceParticipant[] {
  const map = new Map<string, RaceParticipant>();
  for (const p of participants) {
    map.set(p.memberName, p);
  }
  return Array.from(map.values());
}

type RaceCardProps = {
  race: Race;
  onSignup: () => void;
};

export default function RaceCard({ race, onSignup }: RaceCardProps) {
  const uniqueParticipants = deduplicateParticipants(race.participants);

  // 코스별 참가자 그룹
  const courseGroups = new Map<string, string[]>();
  for (const course of race.courses) {
    courseGroups.set(course.competitionClass, []);
  }
  // "미정"과 "응원" 항상 표시
  for (const extra of ["미정", "응원"]) {
    if (!courseGroups.has(extra)) {
      courseGroups.set(extra, []);
    }
  }

  for (const p of uniqueParticipants) {
    const existing = courseGroups.get(p.competitionClass);
    if (existing) {
      existing.push(p.memberName);
    } else {
      courseGroups.set(p.competitionClass, [p.memberName]);
    }
  }

  // 정렬
  const sortedCourses = Array.from(courseGroups.entries()).sort(
    ([a], [b]) => courseSortKey(a) - courseSortKey(b),
  );

  const totalCount = uniqueParticipants.length;

  // 지난 대회 기록
  const records = race.records;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 md:p-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-white/50 text-sm">{race.date}</span>
        <h3 className="text-lg font-bold text-white">{race.name}</h3>
        <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/60">
          {TYPE_LABELS[race.type] || race.type}
        </span>
      </div>

      {/* 코스별 참가자 */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {sortedCourses.map(([competitionClass, names]) => (
          <div key={competitionClass}>
            <p className="text-sm font-medium text-white/80">
              {competitionClass}{" "}
              <span className="text-white/40">({names.length})</span>
            </p>
            {names.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {names.map((n) => (
                  <li key={n} className="text-xs text-white/60">
                    · {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* 지난 대회 기록 */}
      {race.isPast && records.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-sm font-medium text-white/80 mb-2">완주 기록</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-white/60">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="pb-1 pr-3 font-medium">이름</th>
                  <th className="pb-1 pr-3 font-medium">코스</th>
                  <th className="pb-1 font-medium">기록</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={`${r.name}-${i}`} className="border-b border-white/5">
                    <td className="py-1 pr-3">{r.name}</td>
                    <td className="py-1 pr-3">{r.course}</td>
                    <td className="py-1">{r.record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-white/50">총 {totalCount}명</span>
        {race.isPast ? (
          <span className="rounded bg-white/10 px-3 py-1.5 text-xs text-white/40">
            종료됨
          </span>
        ) : (
          <Button
            onClick={onSignup}
            className="bg-white text-black hover:bg-white/90 text-sm"
          >
            참가 신청
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { RaceRecord, Member, RaceInfo } from "@/lib/types";
import { bestPerPerson, activeMemberNames, isWithinMonths } from "@/lib/records-utils";
import RecordInputDialog from "./record-input-dialog";

type Props = {
  records: RaceRecord[];
  members: Member[];
  races: RaceInfo[];
  onRecordSubmitted: (record: RaceRecord) => void;
};

const COURSES = [
  { value: "Full", label: "Full" },
  { value: "Half", label: "Half" },
  { value: "10K", label: "10K" },
];

const INITIAL_LIMIT = 10;

function RankingTable({
  ranked,
  limit,
}: {
  ranked: RaceRecord[];
  limit: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? ranked : ranked.slice(0, limit);
  const hasMore = ranked.length > limit;

  if (ranked.length === 0) {
    return <p className="py-4 text-center text-sm text-white/30">기록이 없습니다.</p>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50 text-xs">
              <th className="pb-2 pr-2 w-10">#</th>
              <th className="pb-2 pr-3">이름</th>
              <th className="pb-2 pr-3">대회명</th>
              <th className="pb-2 pr-3">기록</th>
              <th className="pb-2">대회일</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr
                key={r.recordId || `${r.memberName}-${i}`}
                className="border-b border-white/5"
              >
                <td className="py-2 pr-2 text-white/40">
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                </td>
                <td className="py-2 pr-3 font-medium">{r.memberName}</td>
                <td className="py-2 pr-3 text-white/70">{r.competitionName}</td>
                <td className="py-2 pr-3 font-mono">{r.record}</td>
                <td className="py-2 text-white/50">{r.competitionDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 w-full py-2 text-center text-sm text-white/50 hover:text-white/80"
        >
          더보기 ({ranked.length - limit}명)
        </button>
      )}
    </>
  );
}

export default function MarathonTab({ records, members, races, onRecordSubmitted }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeNames = activeMemberNames(members);

  // 회원 이름 → 성별 맵
  const genderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) {
      if (m.status === "active") map.set(m.name, m.gender);
    }
    return map;
  }, [members]);

  const marathonRecords = records.filter(
    (r) =>
      (!r.recordType || r.recordType === "marathon") &&
      isWithinMonths(r.competitionDate, 18) &&
      activeNames.has(r.memberName),
  );

  return (
    <div>
      <div className="space-y-10">
        {COURSES.map((course) => {
          const ranked = bestPerPerson(marathonRecords, course.value);
          const male = ranked.filter((r) => genderMap.get(r.memberName) === "male");
          const female = ranked.filter((r) => genderMap.get(r.memberName) === "female");

          if (male.length === 0 && female.length === 0) return null;

          return (
            <div key={course.value}>
              <h3 className="mb-4 text-lg font-bold">{course.label}</h3>
              <div className="space-y-6">
                {male.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/60">남자</p>
                    <RankingTable ranked={male} limit={INITIAL_LIMIT} />
                  </div>
                )}
                {female.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/60">여자</p>
                    <RankingTable ranked={female} limit={INITIAL_LIMIT} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full bg-white text-black hover:bg-white/90"
        >
          대회기록 입력
        </Button>
      </div>

      <RecordInputDialog
        mode="marathon"
        members={members}
        races={races}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={onRecordSubmitted}
      />
    </div>
  );
}

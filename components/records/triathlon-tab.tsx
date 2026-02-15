"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RaceRecord, Member, RaceInfo } from "@/lib/types";
import {
  bestPerPerson,
  activeMemberNames,
  isWithinMonths,
  calcTransition,
} from "@/lib/records-utils";
import RecordInputDialog from "./record-input-dialog";

type Props = {
  records: RaceRecord[];
  members: Member[];
  races: RaceInfo[];
  onRecordSubmitted: (record: RaceRecord) => void;
};

const COURSES = [
  { value: "King", label: "King" },
  { value: "Half", label: "Half" },
  { value: "Olympic", label: "Olympic" },
];

const INITIAL_LIMIT = 20;

function RankingSection({
  label,
  ranked,
}: {
  label: string;
  ranked: RaceRecord[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? ranked : ranked.slice(0, INITIAL_LIMIT);
  const hasMore = ranked.length > INITIAL_LIMIT;

  if (ranked.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-lg font-bold">{label}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-white/50 text-xs">
              <th className="pb-2 pr-2 w-10">#</th>
              <th className="pb-2 pr-2">이름</th>
              <th className="pb-2 pr-2">대회명</th>
              <th className="pb-2 pr-2">수영</th>
              <th className="pb-2 pr-2">자전거</th>
              <th className="pb-2 pr-2">러닝</th>
              <th className="pb-2 pr-2">T</th>
              <th className="pb-2 pr-2">총시간</th>
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
                <td className="py-2 pr-2 font-medium">{r.memberName}</td>
                <td className="py-2 pr-2 text-white/70 text-xs">{r.competitionName}</td>
                <td className="py-2 pr-2 font-mono text-xs">{r.swimTime || "-"}</td>
                <td className="py-2 pr-2 font-mono text-xs">{r.bikeTime || "-"}</td>
                <td className="py-2 pr-2 font-mono text-xs">{r.runTime || "-"}</td>
                <td className="py-2 pr-2 font-mono text-xs text-white/50">
                  {calcTransition(r.record, r.swimTime, r.bikeTime, r.runTime)}
                </td>
                <td className="py-2 pr-2 font-mono">{r.record}</td>
                <td className="py-2 text-white/50 text-xs">{r.competitionDate}</td>
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
          더보기 ({ranked.length - INITIAL_LIMIT}명)
        </button>
      )}
    </div>
  );
}

export default function TriathlonTab({ records, members, races, onRecordSubmitted }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeNames = activeMemberNames(members);

  const triRecords = records.filter(
    (r) =>
      r.recordType === "triathlon" &&
      isWithinMonths(r.competitionDate, 60) &&
      activeNames.has(r.memberName),
  );

  return (
    <div>
      <div className="space-y-8">
        {COURSES.map((course) => {
          const ranked = bestPerPerson(triRecords, course.value);
          return (
            <RankingSection
              key={course.value}
              label={course.label}
              ranked={ranked}
            />
          );
        })}
      </div>

      <div className="mt-6">
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full bg-white text-black hover:bg-white/90"
        >
          철인3종 기록 입력
        </Button>
      </div>

      <RecordInputDialog
        mode="triathlon"
        members={members}
        races={races}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={onRecordSubmitted}
      />
    </div>
  );
}

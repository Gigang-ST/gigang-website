"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RaceRecord, Member } from "@/lib/types";
import { activeMemberNames } from "@/lib/records-utils";
import TrailRegisterDialog from "./trail-register-dialog";

type Props = {
  records: RaceRecord[];
  members: Member[];
  onRecordSubmitted: (record: RaceRecord) => void;
};

export default function TrailTab({ records, members, onRecordSubmitted }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeNames = activeMemberNames(members);

  // 트레일 레코드, UTMB 인덱스 내림차순
  const trailRecords = records
    .filter(
      (r) => r.recordType === "trail" && activeNames.has(r.memberName),
    )
    .sort((a, b) => (parseFloat(b.utmbIndex) || 0) - (parseFloat(a.utmbIndex) || 0));

  return (
    <div>
      <div className="mt-4 mb-6">
        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full bg-white text-black hover:bg-white/90"
        >
          UTMB 프로필 등록
        </Button>
      </div>

      {trailRecords.length === 0 ? (
        <p className="py-10 text-center text-white/50">
          등록된 UTMB 프로필이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/50 text-xs">
                <th className="pb-2 pr-2 w-10">#</th>
                <th className="pb-2 pr-3">이름</th>
                <th className="pb-2 pr-3">UTMB Index</th>
                <th className="pb-2 pr-3">최근 대회</th>
                <th className="pb-2 pr-3">기록</th>
                <th className="pb-2">프로필</th>
              </tr>
            </thead>
            <tbody>
              {trailRecords.map((r, i) => (
                <tr
                  key={r.recordId || `${r.memberName}-${i}`}
                  className="border-b border-white/5"
                >
                  <td className="py-2 pr-2 text-white/40">
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                  </td>
                  <td className="py-2 pr-3 font-medium whitespace-nowrap">{r.memberName}</td>
                  <td className="py-2 pr-3 font-mono font-bold">
                    {r.utmbIndex || "-"}
                  </td>
                  <td className="py-2 pr-3 text-white/70">
                    {r.competitionName || "-"}
                  </td>
                  <td className="py-2 pr-3 font-mono">{r.record || "-"}</td>
                  <td className="py-2">
                    {r.utmbSlug && /^[\w.-]+$/.test(r.utmbSlug) ? (
                      <a
                        href={`https://utmb.world/en/runner/${encodeURIComponent(r.utmbSlug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline underline-offset-2 hover:text-blue-300 text-xs"
                      >
                        UTMB
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TrailRegisterDialog
        members={members}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmitted={onRecordSubmitted}
      />
    </div>
  );
}

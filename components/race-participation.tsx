"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchRaces,
  fetchParticipants,
  fetchMembers,
  fetchRecords,
} from "@/lib/sheets";
import type {
  Race,
  RaceInfo,
  RaceParticipant,
  Member,
  RaceRecord,
} from "@/lib/types";
import RaceCard from "@/components/race-card";
import RaceSignupDialog from "@/components/race-signup-dialog";

/** "2024-08-17" 또는 "2026. 2. 22" → Date 객체 */
function parseDate(str: string): Date {
  const trimmed = str.trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  // "2026. 2. 22" (대회기록 등 구 형식)
  const parts = trimmed.replace(/\./g, "").split(/\s+/).map(Number);
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(trimmed);
}

/** 오늘 자정 기준 */
function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 대회현황 행(competition_id 단위)을 같은 대회명+날짜로 그룹핑하여 Race 배열 생성
 */
function buildRaces(
  raceInfos: RaceInfo[],
  participants: RaceParticipant[],
  records: RaceRecord[],
): Race[] {
  const today = todayMidnight();

  // 같은 대회명 + 날짜로 그룹핑
  const raceMap = new Map<
    string,
    { infos: RaceInfo[]; date: string; name: string; type: string }
  >();

  for (const info of raceInfos) {
    const key = `${info.date}_${info.name}`;
    if (!raceMap.has(key)) {
      raceMap.set(key, {
        infos: [],
        date: info.date,
        name: info.name,
        type: info.type,
      });
    }
    raceMap.get(key)!.infos.push(info);
  }

  return Array.from(raceMap.values()).map(({ infos, date, name, type }) => {
    const raceDate = parseDate(date);
    const isPast = raceDate < today;

    const courses = infos.map((info) => ({
      competitionId: info.competitionId,
      competitionClass: info.competitionClass,
    }));

    // 이 대회에 속하는 competition_id 집합
    const compIds = new Set(infos.map((i) => i.competitionId));

    // 참가자 매칭: competition_id 일치 또는 (id 없이 대회명 일치)
    const raceParticipants = participants.filter(
      (p) =>
        compIds.has(p.competitionId) ||
        (!p.competitionId && p.competitionName === name),
    );

    // 기록 매칭 (대회명 기준)
    const raceRecords = records.filter((r) => r.raceName === name);

    return {
      id: `${date}_${name}`,
      date,
      name,
      type,
      courses,
      participants: raceParticipants,
      records: raceRecords,
      isPast,
    };
  });
}

export default function RaceParticipation() {
  const [races, setRaces] = useState<Race[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signupRace, setSignupRace] = useState<Race | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [raceInfos, participants, memberList, records] = await Promise.all([
          fetchRaces(),
          fetchParticipants(),
          fetchMembers(),
          fetchRecords(),
        ]);
        setMembers(memberList);
        setRaces(buildRaces(raceInfos, participants, records));
      } catch (e) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubmitted = useCallback(
    (participant: RaceParticipant) => {
      // 낙관적 업데이트: races 배열의 해당 대회에 참가자 추가
      setRaces((prev) =>
        prev.map((r) =>
          r.name === participant.competitionName
            ? { ...r, participants: [...r.participants, participant] }
            : r,
        ),
      );
    },
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-white/60">
        <p>{error}</p>
      </div>
    );
  }

  const today = todayMidnight();
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const upcoming = races
    .filter((r) => !r.isPast)
    .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

  const recent = races
    .filter((r) => r.isPast && parseDate(r.date) >= sixtyDaysAgo)
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  return (
    <>
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">다가오는 대회</h2>
          <div className="space-y-4">
            {upcoming.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                onSignup={() => setSignupRace(race)}
              />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className={upcoming.length > 0 ? "mt-10" : ""}>
          <h2 className="text-xl font-bold text-white mb-4">최근 대회</h2>
          <div className="space-y-4">
            {recent.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                onSignup={() => setSignupRace(race)}
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 && recent.length === 0 && (
        <div className="py-20 text-center text-white/50">
          <p>등록된 대회가 없습니다.</p>
        </div>
      )}

      {signupRace && (
        <RaceSignupDialog
          race={signupRace}
          members={members}
          open={!!signupRace}
          onOpenChange={(open) => {
            if (!open) setSignupRace(null);
          }}
          onSubmitted={handleSubmitted}
        />
      )}
    </>
  );
}

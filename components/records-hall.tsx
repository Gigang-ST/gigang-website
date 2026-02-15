"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fetchRecords, fetchMembers, fetchRaces } from "@/lib/sheets";
import type { RaceRecord, Member, RaceInfo } from "@/lib/types";
import MarathonTab from "@/components/records/marathon-tab";
import TriathlonTab from "@/components/records/triathlon-tab";
import TrailTab from "@/components/records/trail-tab";

const MAIN_TABS = [
  { value: "marathon", label: "마라톤" },
  { value: "trail", label: "트레일러닝" },
  { value: "triathlon", label: "철인3종" },
];

export default function RecordsHall() {
  const [records, setRecords] = useState<RaceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [races, setRaces] = useState<RaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [recs, mems, raceList] = await Promise.all([
          fetchRecords(),
          fetchMembers(),
          fetchRaces(),
        ]);
        if (cancelled) return;
        setRecords(recs);
        setMembers(mems);
        setRaces(raceList);
      } catch {
        if (!cancelled) setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // 낙관적 업데이트
  const handleRecordSubmitted = useCallback((record: RaceRecord) => {
    setRecords((prev) => [...prev, record]);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-center text-red-400">{error}</p>
    );
  }

  return (
    <Tabs defaultValue="marathon">
      <TabsList className="w-full">
        {MAIN_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="marathon">
        <MarathonTab
          records={records}
          members={members}
          races={races}
          onRecordSubmitted={handleRecordSubmitted}
        />
      </TabsContent>

      <TabsContent value="trail">
        <TrailTab
          records={records}
          members={members}
          onRecordSubmitted={handleRecordSubmitted}
        />
      </TabsContent>

      <TabsContent value="triathlon">
        <TriathlonTab
          records={records}
          members={members}
          races={races}
          onRecordSubmitted={handleRecordSubmitted}
        />
      </TabsContent>
    </Tabs>
  );
}

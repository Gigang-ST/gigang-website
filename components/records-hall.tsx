"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getActivityLogs } from "@/app/actions/activity-log";
import { getMembers } from "@/app/actions/member";
import { getCompetitions } from "@/app/actions/competition";
import { getPersonalBests } from "@/app/actions/personal-best";
import type { ActivityLog, Member, Competition, PersonalBest } from "@/api/types";
import MarathonTab from "@/components/records/marathon-tab";
import TriathlonTab from "@/components/records/triathlon-tab";
import TrailTab from "@/components/records/trail-tab";

const MAIN_TABS = [
	{ value: "marathon", label: "마라톤" },
	{ value: "trail", label: "트레일러닝" },
	{ value: "triathlon", label: "철인3종" },
];

export default function RecordsHall() {
	const [records, setRecords] = useState<ActivityLog[]>([]);
	const [members, setMembers] = useState<Member[]>([]);
	const [competitions, setCompetitions] = useState<Competition[]>([]);
	const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function load() {
			try {
				const [recs, mems, comps, pbs] = await Promise.all([
					getActivityLogs(),
					getMembers(),
					getCompetitions(),
					getPersonalBests(),
				]);
				if (cancelled) return;
				setRecords(recs);
				setMembers(mems);
				setCompetitions(comps);
				setPersonalBests(pbs);
			} catch {
				if (!cancelled)
					setError("데이터를 불러오는 데 실패했습니다.");
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleRecordSubmitted = useCallback((record: ActivityLog) => {
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
		return <p className="py-10 text-center text-red-400">{error}</p>;
	}

	return (
		<Tabs defaultValue="marathon">
			<TabsList className="w-full">
				{MAIN_TABS.map((tab) => (
					<TabsTrigger
						key={tab.value}
						value={tab.value}
						className="flex-1"
					>
						{tab.label}
					</TabsTrigger>
				))}
			</TabsList>

			<TabsContent value="marathon">
				<MarathonTab
					personalBests={personalBests}
					members={members}
					competitions={competitions}
					records={records}
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
					personalBests={personalBests}
					members={members}
					competitions={competitions}
					records={records}
					onRecordSubmitted={handleRecordSubmitted}
				/>
			</TabsContent>
		</Tabs>
	);
}

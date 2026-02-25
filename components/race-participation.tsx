"use client";

import { useState, useEffect, useCallback } from "react";
import { getMembers } from "@/app/actions/member";
import { getCompetitions } from "@/app/actions/competition";
import { getCompApplications } from "@/app/actions/comp-application";
import { getActivityLogs } from "@/app/actions/activity-log";
import type {
	Race,
	Competition,
	CompApplication,
	Member,
	ActivityLog,
} from "@/api/types";
import RaceCard from "@/components/race-card";
import RaceSignupDialog from "@/components/race-signup-dialog";

/** "2024-08-17" 또는 "2026. 2. 22" → Date 객체 */
function parseDate(str: string): Date {
	const trimmed = str.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		const [y, m, d] = trimmed.split("-").map(Number);
		return new Date(y, m - 1, d);
	}
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
	competitions: Competition[],
	participants: CompApplication[],
	records: ActivityLog[],
): Race[] {
	const today = todayMidnight();

	const raceMap = new Map<
		string,
		{
			infos: Competition[];
			date: string;
			name: string;
			type: string;
		}
	>();

	for (const comp of competitions) {
		const key = `${comp.competition_date}_${comp.competition_name}`;
		if (!raceMap.has(key)) {
			raceMap.set(key, {
				infos: [],
				date: comp.competition_date,
				name: comp.competition_name,
				type: comp.competition_type,
			});
		}
		raceMap.get(key)!.infos.push(comp);
	}

	return Array.from(raceMap.values()).map(({ infos, date, name, type }) => {
		const raceDate = parseDate(date);
		const isPast = raceDate < today;

		const courses = infos.map((comp) => ({
			competition_id: comp.id,
			competition_class: comp.competition_class,
		}));

		const compIds = new Set(infos.map((c) => c.id));

		const raceParticipants = participants.filter(
			(p) =>
				compIds.has(p.competition_id) ||
				(!p.competition_id && p.competition_name === name),
		);

		const raceRecords = records.filter(
			(r) => r.competition_name === name,
		);

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
				const [competitions, participants, memberList, records] =
					await Promise.all([
						getCompetitions(),
						getCompApplications(),
						getMembers(),
						getActivityLogs(),
					]);
				setMembers(memberList);
				setRaces(buildRaces(competitions, participants, records));
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
		(participant: CompApplication) => {
			setRaces((prev) =>
				prev.map((r) =>
					r.name === participant.competition_name
						? {
								...r,
								participants: [...r.participants, participant],
							}
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
		.sort(
			(a, b) =>
				parseDate(a.date).getTime() - parseDate(b.date).getTime(),
		);

	const recent = races
		.filter((r) => r.isPast && parseDate(r.date) >= sixtyDaysAgo)
		.sort(
			(a, b) =>
				parseDate(b.date).getTime() - parseDate(a.date).getTime(),
		);

	return (
		<>
			{upcoming.length > 0 && (
				<section>
					<h2 className="text-xl font-bold text-white mb-4">
						다가오는 대회
					</h2>
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
					<h2 className="text-xl font-bold text-white mb-4">
						최근 대회
					</h2>
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

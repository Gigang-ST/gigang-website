"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { PersonalBest, Member, Competition, ActivityLog } from "@/api/types";
import { activeMemberNames } from "@/lib/records-utils";
import RecordInputDialog from "./record-input-dialog";

type Props = {
	personalBests: PersonalBest[];
	members: Member[];
	competitions: Competition[];
	onRecordSubmitted: (record: ActivityLog) => void;
};

// pb_key → display label
const COURSES = [
	{ pbKey: "full", label: "Full Marathon" },
	{ pbKey: "half", label: "Half Marathon" },
	{ pbKey: "10k", label: "10K" },
	{ pbKey: "32k", label: "32K" },
];

const INITIAL_LIMIT = 10;

function RankingTable({
	ranked,
	limit,
}: {
	ranked: PersonalBest[];
	limit: number;
}) {
	const [expanded, setExpanded] = useState(false);
	const visible = expanded ? ranked : ranked.slice(0, limit);
	const hasMore = ranked.length > limit;

	if (ranked.length === 0) {
		return (
			<p className="py-4 text-center text-sm text-white/30">
				기록이 없습니다.
			</p>
		);
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
							<th className="pb-2">날짜</th>
						</tr>
					</thead>
					<tbody>
						{visible.map((r, i) => (
							<tr
								key={r.id}
								className="border-b border-white/5"
							>
								<td className="py-2 pr-2 text-white/40">
									{i < 3
										? ["🥇", "🥈", "🥉"][i]
										: i + 1}
								</td>
								<td className="py-2 pr-3 font-medium">
									{r.full_name}
								</td>
								<td className="py-2 pr-3 text-white/70">
									{r.competition_name || "-"}
								</td>
								<td className="py-2 pr-3 font-mono">
									{r.best_time_hhmmss}
								</td>
								<td className="py-2 text-white/50">
									{r.best_date}
								</td>
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

export default function MarathonTab({
	personalBests,
	members,
	competitions,
	onRecordSubmitted,
}: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);

	const activeNames = activeMemberNames(members);

	const genderMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const m of members) {
			if (m.status === "active") map.set(m.full_name, m.gender);
		}
		return map;
	}, [members]);

	// Filter to active members and sort by best_time_sec
	const roadPbs = useMemo(() => {
		return personalBests
			.filter((pb) => activeNames.has(pb.full_name))
			.sort((a, b) => a.best_time_sec - b.best_time_sec);
	}, [personalBests, activeNames]);

	return (
		<div>
			<div className="mt-4 mb-6">
				<Button
					onClick={() => setDialogOpen(true)}
					className="w-full bg-white text-black hover:bg-white/90"
				>
					대회기록 입력
				</Button>
			</div>

			<div className="space-y-10">
				{COURSES.map((course) => {
					const ranked = roadPbs.filter(
						(pb) => pb.pb_key === course.pbKey,
					);
					const male = ranked.filter(
						(r) => genderMap.get(r.full_name) === "male",
					);
					const female = ranked.filter(
						(r) => genderMap.get(r.full_name) === "female",
					);

					if (male.length === 0 && female.length === 0) return null;

					return (
						<div key={course.pbKey}>
							<h3 className="mb-4 text-lg font-bold">
								{course.label}
							</h3>
							<div className="space-y-6">
								{male.length > 0 && (
									<div>
										<p className="mb-2 text-sm font-medium text-white/60">
											남자
										</p>
										<RankingTable
											ranked={male}
											limit={INITIAL_LIMIT}
										/>
									</div>
								)}
								{female.length > 0 && (
									<div>
										<p className="mb-2 text-sm font-medium text-white/60">
											여자
										</p>
										<RankingTable
											ranked={female}
											limit={INITIAL_LIMIT}
										/>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<RecordInputDialog
				mode="marathon"
				members={members}
				competitions={competitions}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmitted={onRecordSubmitted}
			/>
		</div>
	);
}

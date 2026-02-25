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
	records: ActivityLog[];
	onRecordSubmitted: (record: ActivityLog) => void;
};

const COURSES = [
	{ pbKey: "tri_olympic", label: "Olympic" },
	{ pbKey: "tri_ironman", label: "Ironman" },
];

const INITIAL_LIMIT = 20;

function RankingSection({
	label,
	ranked,
}: {
	label: string;
	ranked: PersonalBest[];
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
							<th className="pb-2 pr-2">총시간</th>
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
								<td className="py-2 pr-2 font-medium">
									{r.full_name}
								</td>
								<td className="py-2 pr-2 text-white/70 text-xs">
									{r.competition_name || "-"}
								</td>
								<td className="py-2 pr-2 font-mono">
									{r.best_time_hhmmss}
								</td>
								<td className="py-2 text-white/50 text-xs">
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
					더보기 ({ranked.length - INITIAL_LIMIT}명)
				</button>
			)}
		</div>
	);
}

export default function TriathlonTab({
	personalBests,
	members,
	competitions,
	records,
	onRecordSubmitted,
}: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);

	const activeNames = activeMemberNames(members);

	const triPbs = useMemo(() => {
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
					철인3종 기록 입력
				</Button>
			</div>

			<div className="space-y-8">
				{COURSES.map((course) => {
					const ranked = triPbs.filter(
						(pb) => pb.pb_key === course.pbKey,
					);
					return (
						<RankingSection
							key={course.pbKey}
							label={course.label}
							ranked={ranked}
						/>
					);
				})}
			</div>

			<RecordInputDialog
				mode="triathlon"
				members={members}
				competitions={competitions}
				open={dialogOpen}
				onOpenChange={setDialogOpen}
				onSubmitted={onRecordSubmitted}
			/>
		</div>
	);
}

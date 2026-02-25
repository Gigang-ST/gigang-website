"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActivityLog, Member } from "@/api/types";
import { activeMemberNames } from "@/lib/records-utils";
import TrailRegisterDialog from "./trail-register-dialog";

type Props = {
	records: ActivityLog[];
	members: Member[];
	onRecordSubmitted: (record: ActivityLog) => void;
};

export default function TrailTab({
	records,
	members,
	onRecordSubmitted,
}: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);

	const activeNames = activeMemberNames(members);

	// 트레일 레코드 (activity_type === "trail_running")
	const trailRecords = records
		.filter(
			(r) =>
				r.activity_type === "trail_running" &&
				activeNames.has(r.full_name),
		)
		.sort(
			(a, b) =>
				(b.elevation_gain_m || 0) - (a.elevation_gain_m || 0),
		);

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
					등록된 트레일 기록이 없습니다.
				</p>
			) : (
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-white/10 text-left text-white/50 text-xs">
								<th className="pb-2 pr-2 w-10">#</th>
								<th className="pb-2 pr-3">이름</th>
								<th className="pb-2 pr-3">대회명</th>
								<th className="pb-2 pr-3">기록</th>
								<th className="pb-2">누적고도(m)</th>
							</tr>
						</thead>
						<tbody>
							{trailRecords.map((r, i) => (
								<tr
									key={r.id || `${r.full_name}-${i}`}
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
										{r.competition_name || r.event_name || "-"}
									</td>
									<td className="py-2 pr-3 font-mono">
										{r.duration_hhmmss || "-"}
									</td>
									<td className="py-2 font-mono">
										{r.elevation_gain_m || "-"}
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

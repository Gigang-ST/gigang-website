"use client";

import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMemberUtmbs } from "@/app/actions/member-utmb";
import { getUtmbProfile } from "@/app/actions/utmb";
import type { Member } from "@/api/types";
import TrailRegisterDialog from "./trail-register-dialog";

type Props = {
	members: Member[];
	onUtmbRegistered: () => void;
};

type TrailRunner = {
	memberId: string;
	fullName: string;
	utmbKey: string;
	utmbIndex: number | null;
	index20k: number | null;
	index50k: number | null;
	index100k: number | null;
	index100m: number | null;
};

export default function TrailTab({ members, onUtmbRegistered }: Props) {
	const [dialogOpen, setDialogOpen] = useState(false);
	const [runners, setRunners] = useState<TrailRunner[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadUtmbData() {
			try {
				setLoading(true);
				setError(null);

				// 1. member_utmb 데이터 가져오기
				const memberUtmbs = await getMemberUtmbs();

				// 2. 각 utmb_key로 UTMB 프로필 조회 (병렬)
				const utmbDataPromises = memberUtmbs.map(async (mu) => {
					try {
						const data = await getUtmbProfile(mu.utmb_key);
						return { memberId: mu.member_id, utmbKey: mu.utmb_key, data };
					} catch {
						return null;
					}
				});

				const utmbResults = await Promise.all(utmbDataPromises);

				// 3. member 정보와 조인하여 TrailRunner 생성
				const trailRunners: TrailRunner[] = utmbResults
					.filter((r) => r !== null)
					.map((r) => {
						const member = members.find((m) => m.id === r.memberId);
						const scores = r.data.scores;
						return {
							memberId: r.memberId,
							fullName: member?.full_name || "-",
							utmbKey: r.utmbKey,
							utmbIndex: r.data.utmbIndex,
							index20k:
								scores.find((s) => s.piCategory === "20k")?.index ?? null,
							index50k:
								scores.find((s) => s.piCategory === "50k")?.index ?? null,
							index100k:
								scores.find((s) => s.piCategory === "100k")?.index ?? null,
							index100m:
								scores.find((s) => s.piCategory === "100m")?.index ?? null,
						};
					});

				// 4. UTMB Index 기준 내림차순 정렬
				trailRunners.sort(
					(a, b) => (b.utmbIndex || 0) - (a.utmbIndex || 0),
				);

				setRunners(trailRunners);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "데이터를 불러오는 중 오류가 발생했습니다.",
				);
			} finally {
				setLoading(false);
			}
		}

		loadUtmbData();
	}, [members]);

	const handleRegistered = () => {
		onUtmbRegistered();
		// 데이터 새로고침
		setLoading(true);
		setTimeout(() => window.location.reload(), 1000);
	};

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

			{loading ? (
				<p className="py-10 text-center text-white/50">로딩 중...</p>
			) : error ? (
				<p className="py-10 text-center text-red-400">{error}</p>
			) : runners.length === 0 ? (
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
								<th className="pb-2 pr-2">20K</th>
								<th className="pb-2 pr-2">50K</th>
								<th className="pb-2 pr-2">100K</th>
								<th className="pb-2 pr-2">100M</th>
								<th className="pb-2"></th>
							</tr>
						</thead>
						<tbody>
							{runners.map((r, i) => (
								<tr
									key={r.memberId}
									className="border-b border-white/5"
								>
									<td className="py-2 pr-2 text-white/40">
										{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
									</td>
									<td className="py-2 pr-3 font-medium">
										{r.fullName}
									</td>
									<td className="py-2 pr-3 font-mono font-bold text-yellow-400">
										{r.utmbIndex ?? "-"}
									</td>
									<td className="py-2 pr-2 font-mono text-white/70">
										{r.index20k ?? "-"}
									</td>
									<td className="py-2 pr-2 font-mono text-white/70">
										{r.index50k ?? "-"}
									</td>
									<td className="py-2 pr-2 font-mono text-white/70">
										{r.index100k ?? "-"}
									</td>
									<td className="py-2 pr-2 font-mono text-white/70">
										{r.index100m ?? "-"}
									</td>
									<td className="py-2">
										{/^[\w.-]+$/.test(r.utmbKey) && (
											<a
												href={`https://utmb.world/en/runner/${encodeURIComponent(r.utmbKey)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-white/40 hover:text-white transition-colors"
												aria-label={`${r.fullName} UTMB 프로필`}
											>
												<ExternalLink size={14} />
											</a>
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
				onSubmitted={handleRegistered}
			/>
		</div>
	);
}

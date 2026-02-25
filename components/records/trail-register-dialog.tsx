"use client";

import { useState, useCallback } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateBirthDate, normalizeBirthDate } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { createActivityLog } from "@/app/actions/activity-log";
import type { ActivityLog, Member } from "@/api/types";

type Props = {
	members: Member[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmitted: (record: ActivityLog) => void;
};

type Step = "verify" | "slug-input" | "done";

type UtmbData = {
	name: string;
	utmbIndex: number | null;
	recentRaces: { eventName: string; time: string }[];
};

export default function TrailRegisterDialog({
	members,
	open,
	onOpenChange,
	onSubmitted,
}: Props) {
	const [step, setStep] = useState<Step>("verify");

	// verify
	const [name, setName] = useState("");
	const [birthDate, setBirthDate] = useState("");
	const [birthDateError, setBirthDateError] = useState<string | null>(null);
	const [verifyError, setVerifyError] = useState("");
	const [verifiedMember, setVerifiedMember] = useState<Member | null>(null);

	// slug-input
	const [slug, setSlug] = useState("");
	const [fetching, setFetching] = useState(false);
	const [utmbData, setUtmbData] = useState<UtmbData | null>(null);
	const [fetchError, setFetchError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const reset = useCallback(() => {
		setStep("verify");
		setName("");
		setBirthDate("");
		setBirthDateError(null);
		setVerifyError("");
		setVerifiedMember(null);
		setSlug("");
		setFetching(false);
		setUtmbData(null);
		setFetchError("");
		setSubmitting(false);
	}, []);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) reset();
			onOpenChange(open);
		},
		[onOpenChange, reset],
	);

	// verify
	const handleVerify = useCallback(() => {
		if (!name.trim() || !birthDate.trim() || birthDateError) return;
		const inputNorm = normalizeBirthDate(birthDate);
		const found = members.find(
			(m) =>
				m.full_name.trim() === name.trim() &&
				normalizeBirthDate(m.birthday) === inputNorm,
		);
		if (!found) {
			setVerifyError("등록된 회원 정보와 일치하지 않습니다.");
			return;
		}
		if (found.status !== "active") {
			setVerifyError("활동 중인 회원만 등록할 수 있습니다.");
			return;
		}
		setVerifyError("");
		setVerifiedMember(found);
		setStep("slug-input");
	}, [name, birthDate, birthDateError, members]);

	// UTMB 조회
	const handleFetchUtmb = useCallback(async () => {
		if (!slug.trim()) return;
		setFetching(true);
		setFetchError("");
		setUtmbData(null);

		try {
			const res = await fetch(
				`/api/utmb/${encodeURIComponent(slug.trim())}`,
			);
			if (!res.ok) {
				const body = await res.json().catch(() => null);
				throw new Error(
					body?.error || "UTMB 프로필을 찾을 수 없습니다.",
				);
			}
			const data = await res.json();
			setUtmbData({
				name: data.name || "",
				utmbIndex: data.utmbIndex ?? null,
				recentRaces: data.recentRaces || [],
			});
		} catch (err) {
			setFetchError(
				err instanceof Error
					? err.message
					: "조회 중 오류가 발생했습니다.",
			);
		} finally {
			setFetching(false);
		}
	}, [slug]);

	// 등록
	const handleSubmit = useCallback(async () => {
		if (!verifiedMember) return;
		setSubmitting(true);

		const competitionName = sanitizeText(
			utmbData?.recentRaces?.[0]?.eventName || "",
			100,
		);

		try {
			const result = await createActivityLog({
				member_id: verifiedMember.id,
				full_name: sanitizeText(name, 20),
				activity_date: new Date().toISOString().split("T")[0],
				activity_type: "trail_running",
				distance_km: 0,
				duration_sec: 0,
				duration_hhmmss: sanitizeText(
					utmbData?.recentRaces?.[0]?.time || "",
					20,
				),
				event_name: `UTMB:${sanitizeText(slug, 100).replace(/[^a-zA-Z0-9._-]/g, "")}`,
				competition_name: competitionName,
			});

			onSubmitted(result);
			setStep("done");
		} catch {
			alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
		} finally {
			setSubmitting(false);
		}
	}, [name, slug, utmbData, verifiedMember, onSubmitted]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>UTMB 프로필 등록</DialogTitle>
					<DialogDescription>
						{step === "verify" &&
							"본인 확인 후 UTMB 프로필을 등록할 수 있습니다."}
						{step === "slug-input" &&
							`${name}님, UTMB 프로필을 등록해주세요.`}
						{step === "done" &&
							"UTMB 프로필이 등록되었습니다."}
					</DialogDescription>
				</DialogHeader>

				{step === "verify" && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label
								htmlFor="trail-name"
								className="text-white/80"
							>
								이름 *
							</Label>
							<Input
								id="trail-name"
								placeholder="이름"
								value={name}
								onChange={(e) => {
									setName(e.target.value);
									setVerifyError("");
								}}
								className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
							/>
						</div>
						<div className="space-y-2">
							<Label
								htmlFor="trail-birth"
								className="text-white/80"
							>
								생년월일 *
							</Label>
							<Input
								id="trail-birth"
								placeholder="예: 1995-03-15 또는 950315"
								value={birthDate}
								onChange={(e) => {
									setBirthDate(e.target.value);
									setBirthDateError(
										e.target.value
											? validateBirthDate(e.target.value)
											: null,
									);
									setVerifyError("");
								}}
								className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
							/>
							{birthDateError && (
								<p className="text-sm text-red-400">
									{birthDateError}
								</p>
							)}
						</div>
						{verifyError && (
							<p className="text-sm text-red-400">
								{verifyError}
							</p>
						)}
						<Button
							onClick={handleVerify}
							disabled={
								!name.trim() ||
								!birthDate.trim() ||
								!!birthDateError
							}
							className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
						>
							본인 확인
						</Button>
					</div>
				)}

				{step === "slug-input" && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label
								htmlFor="utmb-slug"
								className="text-white/80"
							>
								UTMB 프로필 슬러그
							</Label>
							<p className="text-xs text-white/40">
								utmb.world/en/runner/ 뒤의 값 (예:
								7477568.hyeongeun.lee)
							</p>
							<div className="flex gap-2">
								<Input
									id="utmb-slug"
									placeholder="7477568.hyeongeun.lee"
									value={slug}
									onChange={(e) => {
										setSlug(e.target.value);
										setFetchError("");
										setUtmbData(null);
									}}
									maxLength={100}
									className="flex-1 border-white/20 bg-white/5 text-white placeholder:text-white/40"
								/>
								<Button
									onClick={handleFetchUtmb}
									disabled={!slug.trim() || fetching}
									className="bg-white text-black hover:bg-white/90 disabled:opacity-40"
								>
									{fetching ? "조회중..." : "조회"}
								</Button>
							</div>
							{fetchError && (
								<p className="text-sm text-red-400">
									{fetchError}
								</p>
							)}
						</div>

						{utmbData && (
							<div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
								<p className="text-sm font-medium">
									{utmbData.name}
								</p>
								<p className="text-sm text-white/70">
									UTMB Index:{" "}
									<span className="font-mono font-bold">
										{utmbData.utmbIndex ?? "-"}
									</span>
								</p>
								{utmbData.recentRaces.length > 0 && (
									<div className="space-y-1">
										<p className="text-xs text-white/50">
											최근 대회:
										</p>
										{utmbData.recentRaces
											.slice(0, 3)
											.map((race, i) => (
												<p
													key={i}
													className="text-xs text-white/60"
												>
													{race.eventName} —{" "}
													{race.time || "-"}
												</p>
											))}
									</div>
								)}
							</div>
						)}

						<Button
							onClick={handleSubmit}
							disabled={!utmbData || submitting}
							className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
						>
							{submitting ? "등록 중..." : "프로필 등록"}
						</Button>
					</div>
				)}

				{step === "done" && (
					<div className="space-y-4 text-center">
						<p className="text-lg font-semibold text-white">
							등록 완료!
						</p>
						<p className="text-sm text-white/60">
							UTMB 프로필이 등록되었습니다.
						</p>
						<Button
							onClick={() => handleOpenChange(false)}
							className="bg-white text-black hover:bg-white/90"
						>
							확인
						</Button>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}

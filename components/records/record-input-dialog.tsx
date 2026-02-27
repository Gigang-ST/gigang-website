"use client";

import { useState, useCallback, useMemo } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { validateBirthDate, normalizeBirthDate } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { parseTimeToSeconds } from "@/lib/records-utils";
import { createActivityLog } from "@/app/actions/activity-log";
import type { ActivityLog, Member, Competition } from "@/api/types";

type Props = {
	mode: "marathon" | "triathlon";
	members: Member[];
	competitions: Competition[];
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmitted: (record: ActivityLog) => void;
};

type Step = "verify" | "input" | "done";

const MARATHON_COURSES = ["Full", "Half", "10K"];
const TRIATHLON_COURSES = ["King", "Half", "Olympic"];

export default function RecordInputDialog({
	mode,
	members,
	competitions,
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

	// input
	const [raceSelection, setRaceSelection] = useState("custom");
	const [customRaceName, setCustomRaceName] = useState("");
	const [course, setCourse] = useState("");
	const [raceDate, setRaceDate] = useState("");
	const [record, setRecord] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const reset = useCallback(() => {
		setStep("verify");
		setName("");
		setBirthDate("");
		setBirthDateError(null);
		setVerifyError("");
		setVerifiedMember(null);
		setRaceSelection("custom");
		setCustomRaceName("");
		setCourse("");
		setRaceDate("");
		setRecord("");
		setSubmitting(false);
	}, []);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) reset();
			onOpenChange(open);
		},
		[onOpenChange, reset],
	);

	// 지난 3개월 대회 목록
	const recentCompetitions = useMemo(() => {
		const typeFilter = mode === "marathon" ? "road_run" : "triathlon";
		const cutoff = new Date();
		cutoff.setMonth(cutoff.getMonth() - 3);

		const seen = new Set<string>();
		return competitions
			.filter((c) => {
				if (c.competition_type !== typeFilter) return false;
				const d = new Date(c.competition_date);
				if (d > new Date() || d < cutoff) return false;
				if (seen.has(c.competition_name)) return false;
				seen.add(c.competition_name);
				return true;
			})
			.sort((a, b) =>
				b.competition_date.localeCompare(a.competition_date),
			);
	}, [competitions, mode]);

	const courseOptions =
		mode === "marathon" ? MARATHON_COURSES : TRIATHLON_COURSES;

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
			setVerifyError("활동 중인 회원만 기록을 입력할 수 있습니다.");
			return;
		}
		setVerifyError("");
		setVerifiedMember(found);
		setStep("input");
	}, [name, birthDate, birthDateError, members]);

	const raceName =
		raceSelection === "custom"
			? customRaceName
			: recentCompetitions.find(
					(c) => c.competition_name === raceSelection,
				)?.competition_name || "";

	const isValid = raceName.trim() && course && raceDate && record;

	// submit
	const handleSubmit = useCallback(async () => {
		if (!isValid || !verifiedMember) return;
		setSubmitting(true);

		const selectedComp = recentCompetitions.find(
			(c) => c.competition_name === raceSelection,
		);
		const matchedCompId =
			(selectedComp &&
				competitions.find(
					(c) =>
						c.competition_name === selectedComp.competition_name &&
						c.competition_class === course,
				)?.id) ||
			"";

		const totalSec = parseTimeToSeconds(record);

		try {
			const result = await createActivityLog({
				member_id: verifiedMember.id,
				full_name: sanitizeText(name, 20),
				activity_date: raceDate,
				activity_type: mode === "marathon" ? "running" : "triathlon",
				distance_km: 0,
				duration_sec: isFinite(totalSec) ? totalSec : 0,
				duration_hhmmss: sanitizeText(record, 20),
				competition_id: matchedCompId || undefined,
				competition_name: sanitizeText(raceName, 50),
				competition_class: course,
			});

			onSubmitted(result);
			setStep("done");
		} catch {
			alert("제출 중 오류가 발생했습니다. 다시 시도해주세요.");
		} finally {
			setSubmitting(false);
		}
	}, [
		isValid,
		name,
		raceName,
		course,
		raceDate,
		record,
		mode,
		competitions,
		recentCompetitions,
		raceSelection,
		verifiedMember,
		onSubmitted,
	]);

	const title =
		mode === "marathon" ? "마라톤 기록 입력" : "철인3종 기록 입력";

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						{step === "verify" &&
							"본인 확인 후 기록을 입력할 수 있습니다."}
						{step === "input" &&
							`${name}님, 대회 기록을 입력해주세요.`}
						{step === "done" && "기록이 등록되었습니다."}
					</DialogDescription>
				</DialogHeader>

				{step === "verify" && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label
								htmlFor="rec-name"
								className="text-white/80"
							>
								이름 *
							</Label>
							<Input
								id="rec-name"
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
								htmlFor="rec-birth"
								className="text-white/80"
							>
								생년월일 *
							</Label>
							<Input
								id="rec-birth"
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

				{step === "input" && (
					<div className="space-y-4">
						{/* 대회 선택 */}
						<div className="space-y-2">
							<Label className="text-white/80">대회 선택</Label>
							<RadioGroup
								value={raceSelection}
								onValueChange={(val) => {
									setRaceSelection(val);
									if (val !== "custom") {
										const selected =
											recentCompetitions.find(
												(c) =>
													c.competition_name === val,
											);
										if (selected)
											setRaceDate(
												selected.competition_date,
											);
									} else {
										setRaceDate("");
									}
								}}
							>
								{recentCompetitions.map((c) => (
									<div
										key={c.competition_name}
										className="flex items-center gap-2"
									>
										<RadioGroupItem
											value={c.competition_name}
											id={`race-${c.competition_name}`}
											className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
										/>
										<Label
											htmlFor={`race-${c.competition_name}`}
											className="font-normal text-white/80 text-sm"
										>
											{c.competition_name} (
											{c.competition_date})
										</Label>
									</div>
								))}
								<div className="flex items-center gap-2">
									<RadioGroupItem
										value="custom"
										id="race-custom"
										className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
									/>
									<Label
										htmlFor="race-custom"
										className="font-normal text-white/80 text-sm"
									>
										직접 입력
									</Label>
								</div>
							</RadioGroup>
							{raceSelection === "custom" && (
								<Input
									placeholder="대회명 입력"
									value={customRaceName}
									onChange={(e) =>
										setCustomRaceName(e.target.value)
									}
									maxLength={50}
									className="mt-2 border-white/20 bg-white/5 text-white placeholder:text-white/40"
								/>
							)}
						</div>

						{/* 코스 */}
						<div className="space-y-2">
							<Label className="text-white/80">코스 *</Label>
							<RadioGroup
								value={course}
								onValueChange={setCourse}
							>
								{courseOptions.map((c) => (
									<div
										key={c}
										className="flex items-center gap-2"
									>
										<RadioGroupItem
											value={c}
											id={`course-${c}`}
											className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
										/>
										<Label
											htmlFor={`course-${c}`}
											className="font-normal text-white/80"
										>
											{c}
										</Label>
									</div>
								))}
							</RadioGroup>
						</div>

						{/* 대회 날짜 */}
						<div className="space-y-2">
							<Label
								htmlFor="rec-date"
								className="text-white/80"
							>
								대회 날짜 *
							</Label>
							<Input
								id="rec-date"
								type="date"
								value={raceDate}
								onChange={(e) => setRaceDate(e.target.value)}
								readOnly={raceSelection !== "custom"}
								className="border-white/20 bg-white/5 text-white"
							/>
						</div>

						{/* 기록 */}
						<div className="space-y-2">
							<Label
								htmlFor="rec-time"
								className="text-white/80"
							>
								기록 (H:MM:SS) *
							</Label>
							<Input
								id="rec-time"
								placeholder="예: 3:25:10"
								value={record}
								onChange={(e) => setRecord(e.target.value)}
								maxLength={20}
								className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
							/>
						</div>

						<Button
							onClick={handleSubmit}
							disabled={!isValid || submitting}
							className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
						>
							{submitting ? "제출 중..." : "기록 등록"}
						</Button>
					</div>
				)}

				{step === "done" && (
					<div className="space-y-4 text-center">
						<p className="text-lg font-semibold text-white">
							등록 완료!
						</p>
						<p className="text-sm text-white/60">
							{raceName} — {course} 기록이 등록되었습니다.
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

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { validateBirthDate, normalizeBirthDate } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import type { Race, Member, RaceParticipant } from "@/lib/types";

type Props = {
  race: Race;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (participant: RaceParticipant) => void;
};

type Step = "verify" | "course" | "done";

export default function RaceSignupDialog({
  race,
  members,
  open,
  onOpenChange,
  onSubmitted,
}: Props) {
  const [step, setStep] = useState<Step>("verify");
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedMemberId, setVerifiedMemberId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setStep("verify");
    setName("");
    setBirthDate("");
    setBirthDateError(null);
    setVerifyError("");
    setVerifiedMemberId("");
    setSelectedCourse("");
    setResolution("");
    setSubmitting(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) reset();
      onOpenChange(open);
    },
    [onOpenChange, reset],
  );

  const handleBirthDateChange = useCallback((value: string) => {
    setBirthDate(value);
    setBirthDateError(value ? validateBirthDate(value) : null);
    setVerifyError("");
  }, []);

  // Step 1: 본인확인
  const handleVerify = useCallback(() => {
    if (!name.trim() || !birthDate.trim() || birthDateError) return;

    const inputNorm = normalizeBirthDate(birthDate);
    const found = members.find((m) => {
      if (m.name.trim() !== name.trim()) return false;
      return normalizeBirthDate(m.birthDate) === inputNorm;
    });

    if (!found) {
      setVerifyError("등록된 회원 정보와 일치하지 않습니다. 이름과 생년월일을 확인해주세요.");
      return;
    }
    if (found.status !== "active") {
      setVerifyError("탈퇴한 회원입니다. 문의사항은 운영진에게 연락해주세요.");
      return;
    }

    setVerifyError("");
    setVerifiedMemberId(found.memberId);
    setStep("course");
  }, [name, birthDate, birthDateError, members]);

  // 코스 목록 구성
  const courseOptions = race.courses.map((c) => c.competitionClass);
  for (const extra of ["미정", "응원"]) {
    if (!courseOptions.includes(extra)) {
      courseOptions.push(extra);
    }
  }

  // 이미 신청했는지 확인 (마지막 신청 기준)
  const existingEntry = race.participants
    .filter((p) => p.memberName === name.trim())
    .at(-1);

  // Step 2: 코스 선택 후 제출
  const handleSubmit = useCallback(async () => {
    if (!selectedCourse) return;
    setSubmitting(true);

    const matchedCourse = race.courses.find(
      (c) => c.competitionClass === selectedCourse,
    );

    const payload = {
      action: "raceParticipation",
      memberId: verifiedMemberId,
      memberName: sanitizeText(name, 20),
      competitionId: matchedCourse?.competitionId || "",
      competitionName: race.name,
      competitionClass: selectedCourse,
      pledge: sanitizeText(resolution, 100),
    };

    try {
      const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
      if (!scriptUrl) throw new Error("Google Script URL이 설정되지 않았습니다.");

      await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload),
      });

      // 낙관적 업데이트
      onSubmitted({
        memberId: verifiedMemberId,
        memberName: name.trim(),
        competitionId: matchedCourse?.competitionId || "",
        competitionName: race.name,
        competitionClass: selectedCourse,
        status: selectedCourse === "응원" ? "cheering" : "applied",
        pledge: resolution.trim(),
      });

      setStep("done");
    } catch (err) {
      console.error("Race signup error:", err);
      alert(`제출 중 오류가 발생했습니다: ${err instanceof Error ? err.message : err}`);
    } finally {
      setSubmitting(false);
    }
  }, [selectedCourse, name, resolution, race.name, race.courses, verifiedMemberId, onSubmitted]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>참가 신청 — {race.name}</DialogTitle>
          <DialogDescription>
            {race.date}
          </DialogDescription>
        </DialogHeader>

        {step === "verify" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-white/80">
                이름 *
              </Label>
              <Input
                id="signup-name"
                placeholder="이름"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setVerifyError("");
                }}
                maxLength={20}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-birth" className="text-white/80">
                생년월일 *
              </Label>
              <Input
                id="signup-birth"
                placeholder="예: 1995-03-15 또는 950315"
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                aria-invalid={!!birthDateError}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
              />
              {birthDateError && (
                <p className="text-sm text-red-400">{birthDateError}</p>
              )}
            </div>

            {verifyError && (
              <p className="text-sm text-red-400">{verifyError}</p>
            )}

            <Button
              onClick={handleVerify}
              disabled={!name.trim() || !birthDate.trim() || !!birthDateError}
              className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
            >
              본인 확인
            </Button>
          </div>
        )}

        {step === "course" && (
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              <span className="font-medium text-white">{name}</span>님, 코스를 선택해주세요.
            </p>

            {existingEntry && (
              <p className="rounded bg-yellow-900/30 border border-yellow-700/30 px-3 py-2 text-sm text-yellow-300">
                이미 <strong>{existingEntry.competitionClass}</strong>(으)로 신청되어 있습니다.
                다시 신청하면 마지막 신청으로 변경됩니다.
              </p>
            )}

            <RadioGroup value={selectedCourse} onValueChange={setSelectedCourse}>
              {courseOptions.map((course) => (
                <div key={course} className="flex items-center gap-2">
                  <RadioGroupItem
                    value={course}
                    id={`course-${course}`}
                    className="border-white/40 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                  <Label htmlFor={`course-${course}`} className="font-normal text-white/80">
                    {course}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="signup-resolution" className="text-white/80">
                각오 (선택)
              </Label>
              <Input
                id="signup-resolution"
                placeholder="한 줄 각오"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                maxLength={100}
                className="border-white/20 bg-white/5 text-white placeholder:text-white/40"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!selectedCourse || submitting}
              className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
            >
              {submitting ? "제출 중..." : "참가 신청"}
            </Button>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4 text-center">
            <p className="text-lg font-semibold text-white">신청 완료!</p>
            <p className="text-sm text-white/60">
              {race.name} — {selectedCourse} 코스로 신청되었습니다.
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

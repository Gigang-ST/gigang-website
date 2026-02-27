"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { validateBirthDate, normalizeBirthDate } from "@/lib/validation";
import { sanitizeText } from "@/lib/sanitize";
import { fetchMembers, fetchFees } from "@/lib/sheets";
import { calcFeeStatus } from "@/lib/fee-utils";
import type { Member, FeeRecord } from "@/lib/types";

type FeeResult = {
  member: Member;
  expectedFee: number;
  totalPaid: number;
  balance: number;
  records: FeeRecord[];
};

export default function FeeLookup() {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FeeResult | null>(null);

  const handleBirthDateChange = useCallback((value: string) => {
    setBirthDate(value);
    setBirthDateError(value ? validateBirthDate(value) : null);
    setError("");
  }, []);

  const handleLookup = useCallback(async () => {
    const cleanName = sanitizeText(name.trim(), 50);
    const cleanBirth = sanitizeText(birthDate.trim(), 20);

    if (!cleanName || !cleanBirth || birthDateError) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const [members, fees] = await Promise.all([fetchMembers(), fetchFees()]);

      const inputNorm = normalizeBirthDate(cleanBirth);
      const found = members.find((m) => {
        if (m.status !== "active") return false;
        if (m.name.trim() !== cleanName) return false;
        return normalizeBirthDate(m.birthDate) === inputNorm;
      });

      if (!found) {
        setError("등록된 회원 정보가 없습니다.");
        return;
      }

      const { expectedFee, totalPaid, balance } = calcFeeStatus(found, fees);
      const myRecords = fees.filter((r) => r.memberId === found.memberId);

      setResult({ member: found, expectedFee, totalPaid, balance, records: myRecords });
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }, [name, birthDate, birthDateError]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleLookup();
    },
    [handleLookup],
  );

  const canSubmit = name.trim() && birthDate.trim() && !birthDateError && !loading;

  return (
    <div className="space-y-6">
      {/* 조회 폼 */}
      <div className="rounded-lg border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fee-name" className="text-white">
              이름
            </Label>
            <Input
              id="fee-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="홍길동"
              maxLength={50}
              className="border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:border-white/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee-birth" className="text-white">
              생년월일
            </Label>
            <Input
              id="fee-birth"
              value={birthDate}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="950315 또는 1995-03-15"
              maxLength={10}
              className="border-white/30 bg-white/10 text-white placeholder:text-white/40 focus:border-white/60"
            />
            {birthDateError && (
              <p className="text-sm text-red-400">{birthDateError}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            onClick={handleLookup}
            disabled={!canSubmit}
            className="w-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
          >
            {loading ? "조회 중..." : "조회하기"}
          </Button>
        </div>
      </div>

      {/* 결과 */}
      {result && <FeeResultCard result={result} />}
    </div>
  );
}

function FeeResultCard({ result }: { result: FeeResult }) {
  const { member, expectedFee, totalPaid, balance, records } = result;

  const joinYear = member.joinDate ? new Date(member.joinDate).getFullYear() : null;
  const joinMonth = member.joinDate ? new Date(member.joinDate).getMonth() + 1 : null;

  // 납부 시작 월 계산 (가입 다음 달)
  let startLabel = "-";
  if (member.joinDate) {
    const join = new Date(member.joinDate);
    const startYear = join.getMonth() === 11 ? join.getFullYear() + 1 : join.getFullYear();
    const startMonth = (join.getMonth() + 1) % 12 + 1;
    startLabel = `${startYear}년 ${startMonth}월`;
  }

  return (
    <div className="space-y-4">
      {/* 현황 카드 */}
      <div className="rounded-lg border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-bold text-white">
          {member.name}님의 회비 현황
        </h2>

        <div className="space-y-2 text-sm text-white/80">
          {joinYear && joinMonth && (
            <div className="flex justify-between">
              <span>가입일</span>
              <span>
                {joinYear}년 {joinMonth}월
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>납부 기준월</span>
            <span>{startLabel} ~</span>
          </div>
          <div className="flex justify-between">
            <span>예상 납부액</span>
            <span>{expectedFee.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span>실제 납부액</span>
            <span>{totalPaid.toLocaleString()}원</span>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-white/10 bg-white/10 p-4 text-center">
          {balance === 0 ? (
            <p className="text-lg font-semibold text-green-400">✅ 완납</p>
          ) : balance > 0 ? (
            <p className="text-lg font-semibold text-blue-400">
              💰 예치금: {balance.toLocaleString()}원
            </p>
          ) : (
            <p className="text-lg font-semibold text-red-400">
              ❌ 미납금: {Math.abs(balance).toLocaleString()}원
            </p>
          )}
        </div>
      </div>

      {/* 납부 내역 */}
      {records.length > 0 && (
        <div className="rounded-lg border border-white/20 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-3 font-semibold text-white">납부 내역</h3>
          <div className="space-y-2">
            {records.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm text-white/70"
              >
                <div className="flex gap-3">
                  <span>{r.date}</span>
                  <span className="text-white/40">{r.type}</span>
                  {r.note && <span className="text-white/40">({r.note})</span>}
                </div>
                <span className="font-medium text-white">
                  {r.amount.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length === 0 && expectedFee > 0 && (
        <div className="rounded-lg border border-white/20 bg-white/5 p-4 text-center text-sm text-white/50">
          납부 내역이 없습니다.
        </div>
      )}
    </div>
  );
}

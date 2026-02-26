import type { Member, FeeRecord } from "./types";

const MONTHLY_FEE = 2000;

/**
 * 가입일 기준 납부해야 할 총 회비를 계산한다.
 * 가입 첫 달은 면제, 이후 매월 2,000원.
 * 한국 시간(Asia/Seoul) 기준으로 현재 월 계산.
 */
export function calcExpectedFee(joinDate: string, referenceDate?: Date): number {
  if (!joinDate) return 0;

  const join = new Date(joinDate);
  if (isNaN(join.getTime())) return 0;

  // 한국 시간 기준 현재 날짜
  const ref = referenceDate ?? new Date();
  const koreaOffset = 9 * 60; // UTC+9
  const utcMs = ref.getTime() + ref.getTimezoneOffset() * 60000;
  const koreaDate = new Date(utcMs + koreaOffset * 60000);

  // 납부 시작: 가입 다음 달 1일
  const startYear = join.getMonth() === 11 ? join.getFullYear() + 1 : join.getFullYear();
  const startMonth = (join.getMonth() + 1) % 12;

  const refYear = koreaDate.getFullYear();
  const refMonth = koreaDate.getMonth();

  const months = (refYear - startYear) * 12 + (refMonth - startMonth);
  return Math.max(0, months) * MONTHLY_FEE;
}

/**
 * 회비 납부 현황을 반환한다.
 * - balance > 0: 예치금 (초과 납부)
 * - balance < 0: 미납금 (부족)
 * - balance === 0: 완납
 */
export function calcFeeStatus(
  member: Member,
  feeRecords: FeeRecord[],
): { expectedFee: number; totalPaid: number; balance: number } {
  const myRecords = feeRecords.filter((r) => r.memberId === member.memberId);
  const totalPaid = myRecords.reduce((sum, r) => sum + r.amount, 0);
  const expectedFee = calcExpectedFee(member.joinDate);
  return { expectedFee, totalPaid, balance: totalPaid - expectedFee };
}

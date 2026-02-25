# 회비 관리 기능 개발 플랜

## 1. 기능 개요

### 규칙
- 월 회비: **2,000원**
- **가입 첫 달은 면제** (가입한 달 제외, 다음 달부터 납부)
- 예: 2025년 1월 가입 → 2월부터 납부 시작

### 관리자 워크플로우
1. 은행 입금 내역 확인
2. Google Sheets `회비장부` 시트에 **이름 + 금액 + 날짜** 직접 입력
3. Google Apps Script가 이름으로 `가입신청서`에서 `memberId`를 자동 매칭하여 기록

### 회원 조회 기능 (웹)
1. 이름 + 생년월일 입력 → 본인 인증
2. 회비 납부 현황 표시:
   - **예치금**: 실제 납부액 > 기대 납부액 (초과 납부)
   - **미납금**: 실제 납부액 < 기대 납부액 (부족)
   - **완납**: 일치

---

## 2. 데이터 모델

### 2-1. 신규 시트: `회비장부`

| 컬럼 인덱스 | 컬럼명 | 설명 | 예시 |
|---|---|---|---|
| 0 | `feeId` | 자동 생성 (`fee_N`) | `fee_1` |
| 1 | `memberId` | Apps Script가 이름으로 매칭 | `mem_5` |
| 2 | `memberName` | 관리자가 입력한 이름 | `홍길동` |
| 3 | `amount` | 입금액 (원) | `4000` |
| 4 | `paymentDate` | 납부일 (`YYYY-MM-DD`) | `2025-03-15` |
| 5 | `note` | 비고 | `2월+3월분` |
| 6 | `createdAt` | 기록 생성 시각 | `2025-03-16T10:00:00` |

> 관리자는 2~5번 컬럼만 입력. `feeId`, `memberId`, `createdAt`은 Apps Script 자동 처리.

### 2-2. `가입신청서` 시트 — `joinDate` 추가 노출

현재 `Member` 타입에 `createdAt`(인덱스 9)이 파싱되지 않음.
`joinDate`로 추가 파싱 필요 (회비 계산의 기준일).

---

## 3. Google Apps Script 변경

### 3-1. 신규 액션: `feePayment`

**요청 Payload:**
```json
{
  "action": "feePayment",
  "memberName": "홍길동",
  "amount": 4000,
  "paymentDate": "2025-03-15",
  "note": "2월+3월분"
}
```

**Apps Script 처리 로직:**
```javascript
case "feePayment": {
  // 1. 가입신청서에서 이름으로 memberId 조회
  const memberSheet = ss.getSheetByName("가입신청서");
  const members = memberSheet.getDataRange().getValues();
  let memberId = "";
  for (let i = 1; i < members.length; i++) {
    if (members[i][1] === data.memberName) {
      memberId = members[i][0];
      break;
    }
  }

  // 2. 회비장부 시트에 기록 추가
  const feeSheet = ss.getSheetByName("회비장부");
  const nextId = "fee_" + feeSheet.getLastRow();
  feeSheet.appendRow([
    nextId,
    memberId,       // 매칭된 memberId (없으면 빈 문자열)
    data.memberName,
    data.amount,
    data.paymentDate,
    data.note || "",
    new Date().toISOString()
  ]);
  break;
}
```

> 이름이 동명이인일 경우 첫 번째 활성 회원으로 매칭. 매칭 실패 시 `memberId`는 빈 문자열로 저장 (수동 수정).

### 3-2. 파일 위치
- `google-apps-script/Code.js` — `switch(action)` 블록에 case 추가

---

## 4. 타입 정의 변경 (`lib/types.ts`)

### 4-1. `Member` 타입에 `joinDate` 추가
```typescript
export type Member = {
  memberId: string;
  name: string;
  gender: string;
  birthDate: string;
  status: string;
  joinDate: string; // 추가: 가입일 (YYYY-MM-DD 또는 ISO 문자열)
};
```

### 4-2. 신규 타입: `FeeRecord`
```typescript
export type FeeRecord = {
  feeId: string;
  memberId: string;
  memberName: string;
  amount: number;
  paymentDate: string;
  note: string;
  createdAt: string;
};
```

---

## 5. API Route 확장 (`app/api/sheets/[sheet]/route.ts`)

`GID_MAP`에 회비장부 시트 추가:
```typescript
const GID_MAP: Record<string, string> = {
  races: "267782969",
  participants: "573958893",
  members: "0",
  records: "1638315503",
  fees: "671485688",  // 회비장부 시트
};
```

---

## 6. Sheets 클라이언트 확장 (`lib/sheets.ts`)

### `fetchMembers()` 수정
```typescript
// row[9] → joinDate 추가 파싱
joinDate: row[9] ?? "",
```

### `fetchFees()` 신규 추가
```typescript
export async function fetchFees(): Promise<FeeRecord[]> {
  const rows = await fetchSheetCSV("fees");
  return rows.slice(1).map((row) => ({
    feeId: row[0] ?? "",
    memberId: row[1] ?? "",
    memberName: row[2] ?? "",
    amount: Number(row[3]) || 0,
    paymentDate: row[4] ?? "",
    note: row[5] ?? "",
    createdAt: row[6] ?? "",
  }));
}
```

---

## 7. 회비 계산 로직 (`lib/fee-utils.ts`)

### 핵심 함수

```typescript
/**
 * 가입일 기준 납부해야 할 총 회비를 계산한다.
 * 가입 첫 달은 면제, 이후 매월 2,000원.
 */
export function calcExpectedFee(joinDate: string, referenceDate?: Date): number {
  const MONTHLY_FEE = 2000;
  const join = new Date(joinDate);
  const ref = referenceDate ?? new Date();

  // 가입 다음 달 1일부터 이번 달 1일까지 개월 수
  const startYear = join.getMonth() === 11 ? join.getFullYear() + 1 : join.getFullYear();
  const startMonth = (join.getMonth() + 1) % 12; // 다음 달

  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth();

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
  feeRecords: FeeRecord[]
): { expectedFee: number; totalPaid: number; balance: number } {
  const myRecords = feeRecords.filter((r) => r.memberId === member.memberId);
  const totalPaid = myRecords.reduce((sum, r) => sum + r.amount, 0);
  const expectedFee = calcExpectedFee(member.joinDate);
  return { expectedFee, totalPaid, balance: totalPaid - expectedFee };
}
```

---

## 8. 신규 페이지: `/fee`

### 파일 구조
```
app/fee/page.tsx              # 서버 컴포넌트 (레이아웃)
components/fee-lookup.tsx     # 클라이언트 컴포넌트 (조회 폼 + 결과)
```

### UI 흐름

```
[이름 입력] [생년월일 입력]  →  [조회하기]
              ↓
    가입신청서에서 본인 인증 (이름 + 생년월일 일치)
              ↓
    회비장부 시트에서 해당 memberId 납부 내역 합산
              ↓
  ┌───────────────────────────────────┐
  │  홍길동님의 회비 현황             │
  │                                   │
  │  납부 기준월: 2025년 2월 ~        │
  │  예상 납부액: 26,000원            │
  │  실제 납부액: 28,000원            │
  │                                   │
  │  ✅ 예치금: 2,000원               │
  │  (or ❌ 미납금: 4,000원)          │
  │  (or ✅ 완납)                     │
  └───────────────────────────────────┘
```

### 인증 방식
- `race-signup-dialog.tsx`와 동일: `normalizeBirthDate()` 비교
- 탈퇴 회원(`status !== "active"`)은 "등록된 회원 정보가 없습니다" 처리

---

## 9. 네비게이션 업데이트 (`config.ts`)

```typescript
navigation: {
  items: [
    { label: "홈", href: "/" },
    { label: "회칙", href: "/rules" },
    { label: "대회", href: "/races" },
    { label: "기록", href: "/records" },
    { label: "회비", href: "/fee" },  // 추가
    { label: "가입", href: "/join" },
  ]
}
```

---

## 10. 구현 순서

| 단계 | 작업 | 파일 |
|---|---|---|
| 1 | Google Sheets `회비장부` 시트 GID 확인 완료 (671485688) | — |
| 2 | Apps Script에 `feePayment` 액션 추가 | `google-apps-script/Code.js` |
| 3 | `FeeRecord` 타입 추가, `Member` 타입에 `joinDate` 추가 | `lib/types.ts` |
| 4 | API Route 화이트리스트에 `fees` 추가 | `app/api/sheets/[sheet]/route.ts` |
| 5 | `fetchFees()` 추가, `fetchMembers()` 수정 | `lib/sheets.ts` |
| 6 | `calcExpectedFee()`, `calcFeeStatus()` 구현 | `lib/fee-utils.ts` |
| 7 | `/fee` 페이지 및 `fee-lookup.tsx` 컴포넌트 구현 | `app/fee/`, `components/` |
| 8 | 네비게이션에 회비 메뉴 추가 | `config.ts` |
| 9 | 빌드 검증 | `pnpm typecheck && pnpm build` |

---

## 11. 주의사항 및 엣지 케이스

### 동명이인
- Apps Script 매칭 시 첫 번째 활성 회원으로 매칭
- 매칭 실패 시 `memberId` 빈 문자열로 저장 → 관리자가 수동으로 수정
- 웹 조회 시 `memberId` 기준으로 필터링하므로 미매칭 기록은 반영 안 됨

### 가입일 미기재
- 가입신청서의 `createdAt`(인덱스 9)을 joinDate로 사용
- 빈 값이면 예상 납부액을 0으로 처리 (안전한 기본값)

### 보안
- 회비 조회는 이름 + 생년월일 인증 후에만 결과 표시
- 민감한 금액 정보이므로 클라이언트 side에서 인증 후 표시 (현재 아키텍처와 동일)
- `sanitizeText()`로 입력값 정제

### 월 계산 기준
- 한국 시간(`Asia/Seoul`) 기준으로 현재 월 계산
- 당월 1일 이후에 가입했더라도 해당 달은 면제 (달 단위 계산)

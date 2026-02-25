# 회비 관리 기능 개발 플랜

## 1. 기능 개요

### 규칙
- 월 회비: **2,000원**
- **가입 첫 달은 면제** (가입한 달 제외, 다음 달부터 납부)
- 예: 2025년 1월 가입 → 2월부터 납부 시작

### 관리자 워크플로우
1. 은행 입금 내역 확인
2. Google Sheets `회비장부` 시트에 **이름 + 타입 + 금액 + 날짜** 직접 입력
3. `Dues.js` (Apps Script)가 `member_name`으로 `가입신청서`에서 `member_id`를 자동 매칭하여 채움

### 회원 조회 기능 (웹)
1. 이름 + 생년월일 입력 → 본인 인증
2. 회비 납부 현황 표시:
   - **예치금**: 실제 납부액 > 기대 납부액 (초과 납부)
   - **미납금**: 실제 납부액 < 기대 납부액 (부족)
   - **완납**: 일치

---

## 2. 데이터 모델

### 2-1. 기존 시트: `회비장부` (GID: 671485688)

실제 컬럼 구조 (`google-apps-script/Code.js` 헤더 주석 기준):

| 컬럼 인덱스 | 컬럼명 | 설명 | 예시 |
|---|---|---|---|
| 0 | `member_id` | Dues.js가 이름으로 자동 매칭 | `mem_005` |
| 1 | `member_name` | 관리자가 입력한 이름 | `홍길동` |
| 2 | `type` | 납부 타입 | `월회비` |
| 3 | `amount` | 입금액 (원) | `4000` |
| 4 | `date` | 납부일 (`YYYY-MM-DD`) | `2025-03-15` |
| 5 | `note` | 비고 | `2월+3월분` |

> 관리자는 1~5번 컬럼 입력. `member_id`는 `Dues.js`가 자동 채움.
> `feeId`, `createdAt` 컬럼 없음 (기존 설계와 다름).

### 2-2. `가입신청서` 시트 — `joinDate` 노출

실제 컬럼 구조 (`google-apps-script/Code.js` 헤더 주석 기준):

| 컬럼 인덱스 | 컬럼명 |
|---|---|
| 0 | `member_id` |
| 1 | `full_name` |
| 2 | `gender` |
| 3 | `birthday` |
| 4 | `phone` |
| 5 | `status` |
| 6 | `account_number` |
| 7 | `admin` |
| **8** | **`joined_at`** ← 가입일 (회비 계산 기준) |
| 9 | `created_at` |
| 10 | `updated_at` |
| 11 | `note` |

> `joined_at`(인덱스 8)을 `Member.joinDate`로 파싱. (기존 `created_at` 인덱스 9 사용은 오류)

---

## 3. Google Apps Script

### 3-1. 변경 없음 — `Dues.js`가 이미 처리
- 관리자가 `회비장부` 시트에 `member_name` 입력 시 `Dues.js`가 `member_id` 자동 매칭
- `doPost`에 `feePayment` 액션 추가 불필요
- 웹 앱에서 회비를 직접 제출하는 기능 없음 (관리자 전용 시트 직접 입력)

### 3-2. `google-apps-script/Dues.js` 신규 파일 (로컬 관리)
- 현재 Apps Script에 배포되어 있으나 로컬 `google-apps-script/` 디렉토리에 파일 없음
- 소스 코드 동기화를 위해 `Dues.js` 파일 로컬에 추가 필요

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
  joinDate: string; // 추가: joined_at (인덱스 8)
};
```

### 4-2. 신규 타입: `FeeRecord`
```typescript
export type FeeRecord = {
  memberId: string;
  memberName: string;
  type: string;
  amount: number;
  date: string;
  note: string;
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
  fees: "671485688",  // 회비장부
};
```

---

## 6. Sheets 클라이언트 확장 (`lib/sheets.ts`)

### `fetchMembers()` 수정
```typescript
// row[8] → joinDate (joined_at) 추가 파싱
joinDate: row[8] ?? "",
```

### `fetchFees()` 신규 추가
```typescript
export async function fetchFees(): Promise<FeeRecord[]> {
  const rows = await fetchSheetCSV("fees");
  return rows.slice(1).map((row) => ({
    memberId: row[0] ?? "",
    memberName: row[1] ?? "",
    type: row[2] ?? "",
    amount: Number(row[3]) || 0,
    date: row[4] ?? "",
    note: row[5] ?? "",
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
| 1 | `Dues.js` 로컬 파일 생성 (소스 동기화) | `google-apps-script/Dues.js` |
| 2 | `FeeRecord` 타입 추가, `Member` 타입에 `joinDate` 추가 | `lib/types.ts` |
| 3 | API Route 화이트리스트에 `fees` 추가 | `app/api/sheets/[sheet]/route.ts` |
| 4 | `fetchFees()` 추가, `fetchMembers()`에 `joinDate` 파싱 추가 | `lib/sheets.ts` |
| 5 | `calcExpectedFee()`, `calcFeeStatus()` 구현 | `lib/fee-utils.ts` |
| 6 | `/fee` 페이지 및 `fee-lookup.tsx` 컴포넌트 구현 | `app/fee/`, `components/` |
| 7 | 네비게이션에 회비 메뉴 추가 | `config.ts` |
| 8 | 빌드 검증 | `pnpm typecheck && pnpm build` |

---

## 11. 주의사항 및 엣지 케이스

### 동명이인
- `Dues.js` 매칭 시 첫 번째 활성 회원으로 매칭
- 매칭 실패 시 `member_id` 빈 문자열로 저장 → 관리자가 수동 수정
- 웹 조회 시 `memberId` 기준으로 필터링하므로 미매칭 기록은 반영 안 됨

### 가입일 미기재
- `joined_at`(인덱스 8)이 비어있으면 예상 납부액 0으로 처리 (안전한 기본값)

### 보안
- 회비 조회는 이름 + 생년월일 인증 후에만 결과 표시
- 민감한 금액 정보이므로 클라이언트 사이드에서 인증 후 표시
- `sanitizeText()`로 입력값 정제

### 월 계산 기준
- 한국 시간(`Asia/Seoul`) 기준으로 현재 월 계산
- 당월 중 가입했더라도 해당 달은 면제 (달 단위 계산)

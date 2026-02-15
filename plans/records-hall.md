# 기강의전당 페이지 구현

## Context
현재 "기강의전당"은 네비게이션에서 외부 Google Sheets 링크로 연결됨. 이를 내부 `/records` 페이지로 전환하여 회원 대회기록을 마라톤/트레일러닝/철인3종 3개 탭으로 보여주고, 기록 입력 기능도 제공.

## 시트 구조 현황 (2026-02-15 확인)

### 가입신청서 (gid=0) — 회원 명단
```
A:member_id | B:full_name | C:gender | D:birthday | E:phone | F:status | G:account_number | H:admin | I:joined_at | J:created_at | K:updated_at | L:note
```
- 코드 매핑 (`lib/sheets.ts` fetchMembers): row[0]→memberId, row[1]→name, row[2]→gender, row[3]→birthDate, row[5]→status

### 대회현황 (gid=267782969) — 대회 정보 (참여조사용)
```
A:competition_id | B:competition_type | C:competition_name | D:competition_class | E:distance_km | F:pb_key | G:competition_date | H:created_at | I:updated_at
```
- competition_type: "road_run" | "trail_run" | "triathlon" | "cycling"
- competition_class: "Full" | "Half" | "10K" | "32K" | "King" | "Olympic" | "100K" | "50K" | "100M" 등

### 대회기록 (gid=1638315503) — 대회 결과 저장 ⚠️ 재구성 필요
현재 대회현황과 동일한 데이터가 잘못 들어가 있음. **기존 데이터를 지우고 새 구조로 재구성** 필요.

**새 구조:**
```
A:record_id | B:record_type | C:member_name | D:competition_id | E:competition_name | F:competition_class | G:record | H:competition_date | I:swim_time | J:bike_time | K:run_time | L:utmb_slug | M:utmb_index | N:created_at | O:updated_at
```

| 컬럼 | 설명 | 마라톤 | 트레일 | 철인 |
|---|---|---|---|---|
| record_id | 고유 ID (rec_001) | O | O | O |
| record_type | "marathon" / "trail" / "triathlon" | O | O | O |
| member_name | 회원 이름 | O | O | O |
| competition_id | 대회현황 연결 (선택) | O | - | O |
| competition_name | 대회명 | O | O (최근 UTMB 대회) | O |
| competition_class | 코스 구분 | Full/Half/10K | 100K/50K 등 | King/Half/Olympic |
| record | 기록 시간 (H:MM:SS) | O | O (최근 대회 기록) | O (총시간) |
| competition_date | 대회 날짜 (YYYY-MM-DD) | O | O | O |
| swim_time | 수영 시간 | - | - | O |
| bike_time | 자전거 시간 | - | - | O |
| run_time | 러닝 시간 | - | - | O |
| utmb_slug | UTMB 프로필 슬러그 | - | O | - |
| utmb_index | UTMB 인덱스 점수 | - | O | - |
| created_at | 생성일 | O | O | O |
| updated_at | 수정일 | O | O | O |

## 수정/생성 파일 목록

### 기존 파일 수정

| 파일 | 변경 |
|---|---|
| `config.ts` | 네비게이션 "기강의전당" href를 `/records`로 변경 |
| `lib/types.ts` | RaceRecord 타입을 새 시트 구조에 맞게 재정의 |
| `lib/sheets.ts` | fetchRecords()를 새 컬럼 구조(15컬럼)에 맞게 수정 |

### 새로 생성

| 파일 | 역할 |
|---|---|
| `components/ui/tabs.tsx` | shadcn/ui Tabs 설치 (`pnpm dlx shadcn@latest add tabs`) |
| `lib/records-utils.ts` | 기록 파싱/비교 유틸 (parseTimeToSeconds, bestPerPerson, isWithinMonths 등) |
| `app/records/page.tsx` | 서버 컴포넌트 페이지 (기존 races/page.tsx 패턴) |
| `components/records-hall.tsx` | 메인 클라이언트 컴포넌트 — 데이터 fetch + 3개 탭 |
| `components/records/marathon-tab.tsx` | 마라톤 탭 (Full/Half/10K 서브탭 + 랭킹 테이블 + 기록입력 버튼) |
| `components/records/trail-tab.tsx` | 트레일 탭 (UTMB 인덱스 랭킹 + 등록 버튼) |
| `components/records/triathlon-tab.tsx` | 철인 탭 (King/Half/Olympic 서브탭 + 랭킹 테이블 + 기록입력 버튼) |
| `components/records/record-input-dialog.tsx` | 마라톤/철인 기록 입력 다이얼로그 |
| `components/records/trail-register-dialog.tsx` | UTMB 프로필 등록 다이얼로그 |
| `app/api/utmb/[slug]/route.ts` | UTMB 프록시 API (서버사이드 fetch → __NEXT_DATA__ JSON 파싱) |

## 탭별 상세 설계

### 1. 마라톤 탭

**표시 로직:**
- record_type === "marathon"
- 최근 18개월 이내 기록
- active 회원만 (가입신청서 시트의 status === "active" && member_name 매칭)
- 같은 사람 여러 기록 중 가장 빠른 기록 1개만
- 기록순 오름차순 정렬

**서브탭:** Full → Half → 10K (Full이 기본)

**테이블 컬럼:** 순위 | 이름 | 대회명 | 기록 | 대회일

**기록 입력 다이얼로그 (record-input-dialog.tsx):**
1. `verify`: 이름 + 생년월일 회원 인증 (race-signup-dialog.tsx 패턴 재사용)
2. `input`: 대회 선택 (대회현황 시트에서 지난 3개월 road_run 대회 목록 + "직접 입력" 옵션) → 코스(Full/Half/10K) → 기록(H:MM:SS)
3. `done`: 완료 + 낙관적 업데이트

### 2. 트레일러닝 탭

**표시 로직:**
- record_type === "trail"
- UTMB 인덱스(숫자) 내림차순 정렬
- 프로필 링크: `https://utmb.world/en/runner/{utmbSlug}`

**테이블 컬럼:** 순위 | 이름 | UTMB Index | 최근 대회 | 기록 | 프로필 링크

**UTMB 등록 다이얼로그 (trail-register-dialog.tsx):**
1. `verify`: 이름 + 생년월일 회원 인증
2. `slug-input`: UTMB 슬러그 입력 (예: `7477568.hyeongeun.lee`)
   - "조회" 버튼 → `/api/utmb/[slug]` 호출
   - 성공: 인덱스 + 최근 대회 미리보기 → 확인 후 저장
   - 실패: 수동 입력 폴백 (UTMB 인덱스 숫자 + 최근 대회명/기록 직접 입력)
3. `done`: 등록 완료

**UTMB API Route (`app/api/utmb/[slug]/route.ts`):**
- `https://utmb.world/en/runner/{slug}` 서버사이드 fetch
- HTML에서 `<script id="__NEXT_DATA__">` JSON 추출
- pageProps.runner에서 인덱스 점수 + 최근 대회 결과 파싱 후 반환
- 1시간 revalidate 캐싱
- 실패 시 404/500 응답 → 프론트에서 수동 입력 폴백

### 3. 철인3종 탭

**표시 로직:**
- record_type === "triathlon"
- 최근 5년 이내 기록
- active 회원, 같은 사람 가장 빠른 기록(총시간 기준)
- 기록순 오름차순

**서브탭:** King → Half → Olympic (King이 기본)

**테이블 컬럼:** 순위 | 이름 | 대회명 | 수영 | 자전거 | 러닝 | T(트랜지션) | 총시간 | 대회일

**트랜지션 계산:** 총시간 - (수영 + 자전거 + 러닝) = 트랜지션

**기록 입력 (record-input-dialog.tsx에서 triathlon 모드):**
1. `verify`: 회원 인증
2. `input`: 대회명, 코스(King/Half/Olympic), 대회날짜, 수영시간, 자전거시간, 러닝시간, 총시간 입력. 트랜지션 실시간 계산 표시
3. `done`: 완료

## 유틸리티 (lib/records-utils.ts)

```ts
parseTimeToSeconds(time: string): number      // "3:25:10" → 12310
formatSecondsToTime(seconds: number): string   // 12310 → "3:25:10"
calcTransition(total, swim, bike, run): string  // 트랜지션 계산
isWithinMonths(dateStr: string, months: number): boolean
bestPerPerson(records: RaceRecord[], courseFilter: string): RaceRecord[]
```

## Apps Script 웹훅 확장

`doPost`에 `action: "recordSubmit"` 분기 추가:
```json
{
  "action": "recordSubmit",
  "recordType": "marathon",
  "memberName": "이현근",
  "competitionId": "comp_055",
  "competitionName": "JTBC 마라톤",
  "competitionClass": "Full",
  "record": "3:25:10",
  "competitionDate": "2025-11-02",
  "swimTime": "",
  "bikeTime": "",
  "runTime": "",
  "utmbSlug": "",
  "utmbIndex": ""
}
```
→ Apps Script에서 record_id 자동 생성 (rec_001, rec_002, ...), created_at/updated_at 자동 기입

## 대회기록 시트 재구성 (수동 작업)

1. 대회기록 시트(gid=1638315503) 열기
2. 기존 데이터 전부 삭제 (Ctrl+A → Delete)
3. A1~O1에 아래 헤더 입력:

```
record_id | record_type | member_name | competition_id | competition_name | competition_class | record | competition_date | swim_time | bike_time | run_time | utmb_slug | utmb_index | created_at | updated_at
```

CSV로 붙여넣기용:
```
record_id,record_type,member_name,competition_id,competition_name,competition_class,record,competition_date,swim_time,bike_time,run_time,utmb_slug,utmb_index,created_at,updated_at
```

## 구현 순서

1. 대회기록 시트 재구성 (위 수동 작업)
2. shadcn/ui Tabs 설치
3. `lib/types.ts` RaceRecord 타입 재정의
4. `lib/sheets.ts` fetchRecords 새 구조에 맞게 수정
5. `lib/records-utils.ts` 유틸리티 생성
6. `app/api/utmb/[slug]/route.ts` UTMB 프록시
7. `components/records/marathon-tab.tsx`
8. `components/records/trail-tab.tsx`
9. `components/records/triathlon-tab.tsx`
10. `components/records/record-input-dialog.tsx`
11. `components/records/trail-register-dialog.tsx`
12. `components/records-hall.tsx` 메인 컴포넌트
13. `app/records/page.tsx` 페이지
14. `config.ts` 네비게이션 변경

## 검증
- `pnpm typecheck && pnpm lint && pnpm build`
- `/records` 접속 → 마라톤 탭 Full/Half/10K 서브탭 전환
- 마라톤 "대회기록 입력" → 회원 인증 → 대회 선택 → 기록 제출
- 트레일 탭 → "UTMB 등록" → 슬러그 입력 → 조회 → 등록
- 철인 탭 → King/Half/Olympic → 기록 입력 → 트랜지션 자동 계산 확인
- 대회기록 시트에 새 행 추가 확인

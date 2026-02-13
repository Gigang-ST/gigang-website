# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

기강(GIGANG) 러닝크루 웹사이트. Next.js 15 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui 기반. Vercel에 배포.

## 명령어

- **개발 서버**: `pnpm dev`
- **빌드**: `pnpm build` (빌드 전 히어로 LQIP 자동 생성)
- **타입 체크**: `pnpm typecheck`
- **린트**: `pnpm lint`
- **히어로 이미지 플레이스홀더 생성**: `pnpm lqip:hero`
- **Google Sheets 조회**: `node scripts/fetch-sheet.mjs --list` / `node scripts/fetch-sheet.mjs "<시트이름>"`

패키지 매니저는 **pnpm** (v10.28.0). npm이나 yarn 사용 금지. 테스트 프레임워크는 미설정.

## 크로스 플랫폼

- Windows와 macOS 모두에서 동작해야 함.
- 쉘 스크립트(`rm -rf` 등) 대신 Node.js 기반의 크로스플랫폼 방식을 사용할 것.

## 아키텍처

### 데이터 흐름 — Google Sheets 백엔드

모든 데이터는 단일 Google 스프레드시트(ID: `16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw`)에 저장되며 4개 시트를 사용:

| 시트 (gid) | 용도 | 타입 |
|---|---|---|
| 대회현황 (267782969) | 대회 목록 | `RaceInfo` |
| 대회참여현황 (573958893) | 대회 참가자 | `RaceParticipant` |
| 가입신청서 (0) | 회원 명단 | `Member` |
| 대회기록 (1638315503) | 대회 기록 | `RaceRecord` |

**읽기**: `lib/sheets.ts`에서 CSV export를 클라이언트 사이드로 fetch하고, RFC 4180 파서(`lib/csv.ts`)로 파싱 후 sessionStorage에 캐싱(5분 TTL). 모든 데이터 타입은 `lib/types.ts`에 정의.

**쓰기**: 폼에서 JSON을 Google Apps Script 웹훅(`NEXT_PUBLIC_GOOGLE_SCRIPT_URL` 환경변수)으로 전송하면 스프레드시트에 행 추가. 요청은 `mode: "no-cors"` 사용.

### 페이지 및 주요 컴포넌트

- `/` — 히어로 캐러셀(Embla, 이미지 10장, 3초 자동 전환) + 네비게이션. 컴포넌트: `hero-section.tsx`
- `/rules` — 회칙, `config.ts`에서 콘텐츠 로드
- `/join` — 가입 신청 폼(`join-form.tsx`), 생년월일 검증 후 Apps Script로 제출
- `/races` — 대회 참여(`race-participation.tsx`), 4개 시트 병렬 fetch, 예정 대회와 최근 대회(60일 이내) 분리. 참가 신청은 다단계 다이얼로그(`race-signup-dialog.tsx`: 회원 인증 → 코스 선택 → 완료)

### 콘텐츠 중앙 관리

`config.ts`에 모든 사이트 텍스트, 네비게이션 링크, 회칙 내용, 모임 장소 데이터가 집중됨. 사이트 문구 변경 시 개별 컴포넌트가 아닌 이 파일을 수정할 것.

## 컨벤션

- **언어**: UI 텍스트와 주석은 한국어, 코드 식별자는 영어.
- **타임존**: 날짜 비교 시 한국 시간(`Asia/Seoul`) 사용.
- **경로 별칭**: `@/*`가 프로젝트 루트에 매핑.
- **스타일링**: Tailwind CSS v4, CSS 변수로 테마 설정. 클래스 병합 시 `lib/utils.ts`의 `cn()` 사용.
- **컴포넌트**: shadcn/ui (new-york 스타일, Radix 프리미티브). 설정은 `components.json`.
- **클라이언트 컴포넌트**: 인터랙티브 컴포넌트는 `"use client"` 디렉티브 사용. 인터랙션 없는 페이지는 서버 컴포넌트.
- **폰트**: Pretendard(본문, `lib/fonts.ts`에서 로드), 나눔명조(히어로 텍스트, `app/fonts/` 로컬 파일).
- **생년월일 형식**: `YYMMDD` 또는 `YYYY-MM-DD`, `lib/validation.ts`에서 검증/정규화. 세기 구분: 00-30 → 2000년대, 31-99 → 1900년대.
- **빌드 참고**: `next.config.ts`에서 TypeScript와 ESLint 빌드 에러를 무시함. `pnpm typecheck`과 `pnpm lint`는 수동으로 실행할 것.

## 커밋 컨벤션

- Conventional Commits 접두사 + 한글 설명: `docs: CLAUDE.md 추가`, `fix: 이미지 최적화 활성화`
- 모든 문서, 주석, 설명은 한글로 작성

## 커스텀 도구

### 에이전트 (`.claude/agents/`)

| 에이전트 | 모델 | 용도 |
|---|---|---|
| `build-validator` | haiku | 타입체크 → 린트 → 빌드 순차 검증 및 에러 보고 |
| `sheets-inspector` | haiku | Google Sheets 4개 시트 데이터 조회/분석/정합성 검사 |
| `page-scaffolder` | sonnet | 새 페이지/컴포넌트를 기존 패턴에 맞게 스캐폴딩 |
| `config-editor` | haiku | `config.ts` 사이트 콘텐츠(회칙, 네비, 연락처 등) 수정 |
| `dead-code-eliminator` | sonnet | 미사용 코드, 불필요한 import 탐지 및 제거 |

### 커맨드 (`.claude/commands/`)

| 커맨드 | 용도 |
|---|---|
| `/sheet` | Google Sheets 시트 조회 |
| `/build-check` | 타입체크 + 린트 + 빌드 전체 검사 |
| `/add-page` | 기존 패턴에 맞는 새 페이지 생성 |
| `/sync-data` | 4개 시트 전체 조회 후 현황 요약 |
| `/add-ui` | shadcn/ui 컴포넌트 설치 |
| `/pr` | PR 생성 자동화 |

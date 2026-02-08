# 기강 (GIGANG) 웹사이트

기강 러닝크루 공식 웹사이트입니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui + Radix UI
- **Language**: TypeScript
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics
- **Data**: Google Sheets (CSV export) + Google Apps Script

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build
```

http://localhost:3000 에서 확인할 수 있습니다.

## 프로젝트 구조

```
app/
├── layout.tsx          # 루트 레이아웃 (Pretendard 폰트, Analytics)
├── page.tsx            # 메인 페이지 (/)
├── rules/page.tsx      # 회칙 페이지 (/rules)
├── join/page.tsx       # 가입안내 페이지 (/join)
├── races/page.tsx      # 대회참여 페이지 (/races)
├── fonts/              # 로컬 폰트 (나눔명조, Pretendard)
└── globals.css         # 글로벌 스타일

components/
├── hero-section.tsx        # 히어로 섹션 (캐러셀 + 네비게이션)
├── hero-typography.tsx     # 히어로 타이포그래피
├── join-form.tsx           # 가입 신청 폼 + 환영 메시지
├── race-card.tsx           # 대회 카드 (코스별 참가자 표시)
├── race-participation.tsx  # 대회참여 메인 컴포넌트
├── race-signup-dialog.tsx  # 참가 신청 다이얼로그
└── ui/                     # shadcn/ui 컴포넌트
    ├── button.tsx
    ├── carousel.tsx
    ├── checkbox.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── label.tsx
    ├── radio-group.tsx
    ├── sheet.tsx
    └── textarea.tsx

config.ts               # 사이트 콘텐츠 및 네비게이션 설정
lib/
├── csv.ts              # CSV 파서 (따옴표 필드 처리)
├── fonts.ts            # 폰트 설정
├── hero-lqip.json      # 히어로 이미지 블러 플레이스홀더
├── sheets.ts           # Google Sheets CSV fetch 헬퍼
├── types.ts            # 타입 정의
├── utils.ts            # 유틸리티 (cn 헬퍼)
└── validation.ts       # 생년월일 검증 및 정규화

google-apps-script/
└── Code.js             # Apps Script (가입신청서 + 대회참여)

scripts/
└── fetch-sheet.mjs     # Google Sheets 시트 조회 스크립트
```

## 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 (히어로 캐러셀, 크루 소개) |
| `/rules` | 회칙 페이지 |
| `/join` | 가입안내 페이지 (폼 제출 → Google Sheets 저장) |
| `/races` | 대회참여 페이지 (대회 목록, 참가 신청) |

## 대회참여 페이지 (/races)

Google Sheets에서 4개 시트를 CSV로 읽어와 대회 참여 현황을 표시합니다.

### 사용하는 시트

| 시트 | gid | 용도 |
|------|-----|------|
| 대회현황 | 267782969 | 대회 목록 (날짜, 대회명, 구분, 코스) |
| 대회참여현황 | 573958893 | 참가 신청 내역 (대회, 코스, 이름) |
| 가입신청서 | 0 | 회원 명부 (본인확인용) |
| 대회기록 | 1638315503 | 완주 기록 (이름, 대회, 코스, 기록) |

### 기능

- **다가오는 대회**: 날짜 오름차순, 참가 신청 가능
- **최근 대회**: 지난 60일, 완주 기록 표시
- **참가 신청**: 본인확인(이름+생년월일) → 코스 선택 → Google Sheets에 저장
- **중복 신청**: 같은 대회에 다시 신청하면 마지막 신청 기준으로 표시

## 가입안내 페이지 (/join)

### 폼 필드

**필수 항목**
- 이름 (텍스트)
- 성별 (라디오 버튼)
- 생년월일 (텍스트, `YYYY-MM-DD` 또는 `YYMMDD` 형식 검증)
- 사는곳 - 가까운 지하철역 (텍스트)
- 인스타 팔로우 여부 (라디오 버튼)

**선택 항목**
- 러닝경력 (라디오 버튼)
- 연락처 (텍스트)
- 계좌번호 (텍스트)
- 개인정보 수집동의 (체크박스, 필수)

## Google Sheets 연동

제출된 데이터는 Google Apps Script를 통해 Google Sheets에 자동 저장됩니다.
Apps Script 코드는 `google-apps-script/Code.js`에 있습니다.

### 환경변수

Vercel 또는 `.env.local`에 설정:

```
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

## 히어로 이미지

`public/images/hero/` 디렉토리에 `hero1.jpeg` ~ `hero10.jpeg` 파일이 있습니다.
블러 플레이스홀더는 빌드 시 자동 생성됩니다:

```bash
pnpm lqip:hero
```

## 배포

Vercel에 연결되어 있으며, `main` 브랜치에 push하면 자동 배포됩니다.

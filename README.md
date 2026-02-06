# 기강 (GIGANG) 웹사이트

기강 러닝크루 공식 웹사이트입니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4
- **UI**: shadcn/ui + Radix UI
- **Language**: TypeScript
- **Deployment**: Vercel
- **Analytics**: Vercel Analytics

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
├── fonts/              # 로컬 폰트 (나눔명조, Pretendard)
└── globals.css         # 글로벌 스타일

components/
├── hero-section.tsx    # 히어로 섹션 (캐러셀 + 네비게이션)
├── hero-typography.tsx # 히어로 타이포그래피
├── join-form.tsx       # 가입 신청 폼 + 환영 메시지
└── ui/                 # shadcn/ui 컴포넌트
    ├── button.tsx
    ├── carousel.tsx
    ├── checkbox.tsx
    ├── input.tsx
    ├── label.tsx
    ├── radio-group.tsx
    ├── sheet.tsx
    └── textarea.tsx

config.ts               # 사이트 콘텐츠 및 네비게이션 설정
lib/
├── fonts.ts            # 폰트 설정
├── utils.ts            # 유틸리티 (cn 헬퍼)
└── hero-lqip.json      # 히어로 이미지 블러 플레이스홀더
```

## 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 (히어로 캐러셀, 크루 소개) |
| `/rules` | 회칙 페이지 |
| `/join` | 가입안내 페이지 (폼 제출 → Google Sheets 저장) |

## 가입안내 페이지 (/join)

### 폼 필드

**필수 항목**
- 이름 (텍스트)
- 생년월일 (텍스트, `YYYY-MM-DD` 또는 `YYMMDD` 형식 검증)
- 사는곳 - 가까운 지하철역 (텍스트)
- 인스타 팔로우 여부 (라디오 버튼)

**선택 항목**
- 러닝경력 (라디오 버튼)
- 연락처 (텍스트)
- 계좌번호 (텍스트)
- 개인정보 수집동의 (체크박스, 필수)

### Google Sheets 연동

제출된 데이터는 Google Apps Script를 통해 Google Sheets에 자동 저장됩니다.

**설정 방법**

1. [Google Sheets](https://docs.google.com/spreadsheets/d/16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw) 열기
2. 확장 프로그램 → Apps Script
3. 아래 코드 붙여넣기 → 저장:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp,
    data.name,
    data.birthDate,
    data.nearestStation,
    data.instagramFollow,
    data.runningExperience,
    data.phone,
    data.bankAccount,
    data.privacyAgreed
  ]);

  return ContentService.createTextOutput("OK");
}
```

4. 배포 → 새 배포 → 웹 앱
   - 실행 계정: 나
   - 액세스: 모든 사용자
5. 배포 URL 복사

**시트 헤더 (첫 번째 행)**

| 제출시간 | 이름 | 생년월일 | 지하철역 | 인스타팔로우 | 러닝경력 | 연락처 | 계좌번호 | 개인정보동의 |

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

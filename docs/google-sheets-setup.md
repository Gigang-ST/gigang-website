# Google Sheets 연동 가이드

## 개요

가입 신청 폼(`/join`)에서 제출된 데이터가 Google Apps Script를 통해 Google Sheets에 자동 기록됩니다.

## 구조

```
[사용자 브라우저] → fetch(POST) → [Google Apps Script] → [Google Sheets]
```

- 프론트엔드: `components/join-form.tsx`
- Apps Script 코드: `google-apps-script/Code.js`
- 환경변수: `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`

---

## Google Sheets 설정

### 1. 스프레드시트 준비

- 현재 사용 중인 시트: https://docs.google.com/spreadsheets/d/16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw
- 시트 이름: `가입신청서` (정확히 일치해야 함)

### 2. 헤더 (첫 번째 행)

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| 제출시간 | 이름 | 성별 | 생년월일 | 지하철역 | 인스타팔로우 | 러닝경력 | 연락처 | 계좌번호 | 개인정보동의 |

---

## Google Apps Script 배포

### 1. Apps Script 열기

스프레드시트에서 **확장 프로그램 > Apps Script** 클릭

### 2. 코드 붙여넣기

`google-apps-script/Code.js` 파일의 `doPost` 함수와 `testDoPost` 함수를 복사하여 붙여넣기

### 3. 배포

1. **배포 > 새 배포** 클릭
2. 유형: **웹 앱**
3. 설정:
   - 실행 계정: **나**
   - 액세스: **모든 사용자**
4. **배포** 클릭 후 URL 복사

### 4. 코드 수정 후 재배포

코드를 수정한 경우 **배포 > 배포 관리 > 연필 아이콘 > 새 버전**으로 재배포해야 반영됩니다.

---

## Vercel 환경변수 설정

Vercel 대시보드에서:

1. **Settings > Environment Variables**
2. 추가:
   - Key: `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`
   - Value: Apps Script 배포 URL (예: `https://script.google.com/macros/s/xxxxx/exec`)
   - Environment: **Production**, **Preview**, **Development** 모두 체크

로컬 개발 시에는 `.env` 파일에 추가:

```
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/xxxxx/exec
```

---

## 전송 데이터 형식

프론트엔드에서 POST로 전송하는 JSON:

```json
{
  "timestamp": "2025. 2. 6. 오후 3:00:00",
  "name": "홍길동",
  "gender": "남",
  "birthDate": "950315",
  "nearestStation": "강남역",
  "instagramFollow": "Yes",
  "runningExperience": "런린이(입문 이하)",
  "phone": "010-1234-5678",
  "bankAccount": "국민 123-456",
  "privacyAgreed": "동의"
}
```

### 필드 설명

| 필드 | 필수 | 설명 |
|------|------|------|
| timestamp | 자동 | 제출 시간 (한국 시간) |
| name | O | 이름 |
| gender | O | 남 / 여 |
| birthDate | O | YYMMDD 또는 YYYY-MM-DD |
| nearestStation | O | 가까운 지하철역 |
| instagramFollow | O | Yes / 나는 인스타가 없다 |
| runningExperience | X | 런린이 / 입문 / 초보 이상 |
| phone | X | 연락처 |
| bankAccount | X | 계좌번호 |
| privacyAgreed | 자동 | 동의 / 미동의 |

---

## 주의사항

- `mode: "no-cors"`로 요청하므로 응답 본문을 읽을 수 없습니다. 성공/실패 판별이 제한적입니다.
- Apps Script URL이 변경되면 Vercel 환경변수도 반드시 업데이트해야 합니다.
- 스프레드시트 ID(`16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw`)가 Apps Script 코드에 하드코딩되어 있으므로, 시트를 변경하려면 Apps Script도 수정 후 재배포해야 합니다.

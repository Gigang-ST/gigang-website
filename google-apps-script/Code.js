// ============================================
// Google Apps Script - 기강 가입신청서
// ============================================
//
// 설정 방법:
// 1. Google Sheets 열기
//    https://docs.google.com/spreadsheets/d/16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw
//
// 2. 시트 이름을 "가입신청서"로 설정
//
// 3. 첫 번째 행(헤더)에 아래 순서대로 입력:
//    | 제출시간 | 이름 | 성별 | 생년월일 | 지하철역 | 인스타팔로우 | 러닝경력 | 연락처 | 계좌번호 | 개인정보동의 |
//
// 4. 확장 프로그램 → Apps Script 열기
//
// 5. 아래 코드 전체를 복사해서 붙여넣기 → 저장
//
// 6. 배포 → 새 배포 → 웹 앱
//    - 실행 계정: 나
//    - 액세스: 모든 사용자
//
// 7. 배포 URL 복사 → Vercel 환경변수에 설정
//    NEXT_PUBLIC_GOOGLE_SCRIPT_URL=복사한_URL
//
// ============================================


// ----- 여기부터 Apps Script에 붙여넣기 -----

function doPost(e) {
  var ss = SpreadsheetApp.openById("16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw");
  var sheet = ss.getSheetByName("가입신청서");
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    data.timestamp,
    data.name,
    data.gender,
    data.birthDate,
    data.nearestStation,
    data.instagramFollow,
    data.runningExperience,
    data.phone,
    data.bankAccount,
    data.privacyAgreed
  ]);

  return ContentService.createTextOutput(JSON.stringify({ result: "OK" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 테스트용 함수 (Apps Script 편집기에서 직접 실행 가능)
function testDoPost() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        timestamp: "2025/2/6 테스트",
        name: "테스트",
        gender: "남",
        birthDate: "950315",
        nearestStation: "강남역",
        instagramFollow: "Yes",
        runningExperience: "런린이(입문 이하)",
        phone: "010-1234-5678",
        bankAccount: "국민 123-456",
        privacyAgreed: "동의"
      })
    }
  };

  doPost(fakeEvent);
}

// ----- 여기까지 Apps Script에 붙여넣기 -----

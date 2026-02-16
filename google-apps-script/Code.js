// ============================================
// Google Apps Script - 기강 가입신청서 + 대회참여 + 대회기록
// ============================================
//
// 설정 방법:
// 1. Google Sheets 열기
//    /* 취약점 점검 20260216 junmink 시트 ID 노출 삭제 */
//    https://docs.google.com/spreadsheets/d/____
// 2. 시트 이름을 "가입신청서"로 설정
//
// 3. 첫 번째 행(헤더)에 아래 순서대로 입력:
//    | 제출시간 | 이름 | 성별 | 생년월일 | 지하철역 | 인스타팔로우 | 러닝경력 | 연락처 | 계좌번호 | 개인정보동의 |
//
// 4. "대회참여현황" 시트 헤더:
//    | 작성일 | 대회 | 코스 | 이름 | 각오 |
//
// 4-1. "대회기록" 시트 헤더:
//    | record_id | record_type | member_name | competition_id | competition_name | competition_class | record | competition_date | swim_time | bike_time | run_time | utmb_slug | utmb_index | created_at | updated_at |
//
// 5. 확장 프로그램 → Apps Script 열기
//
// 6. 아래 코드 전체를 복사해서 붙여넣기 → 저장
//
// 7. 배포 → 새 배포 → 웹 앱 (기존 배포 업데이트도 가능)
//    - 실행 계정: 나
//    - 액세스: 모든 사용자
//
// 8. 배포 URL 복사 → Vercel 환경변수에 설정
//    NEXT_PUBLIC_GOOGLE_SCRIPT_URL=복사한_URL
//
// ============================================


// ----- 여기부터 Apps Script에 붙여넣기 -----

function doPost(e) {
  /* 취약점 점검 20260216 junmink 시트 ID 노출 삭제 */
  var ss = SpreadsheetApp.openById("____");
  var data = JSON.parse(e.postData.contents);

  if (data.action === "raceParticipation") {
    // 대회 참가 신청
    var sheet = ss.getSheetByName("대회참여현황");
    sheet.appendRow([
      data.registeredDate,
      data.raceName,
      data.course,
      data.memberName,
      data.resolution || ""
    ]);

  } else if (data.action === "recordSubmit") {
    // 대회 기록 제출
    var sheet = ss.getSheetByName("대회기록");
    var lastRow = sheet.getLastRow();
    var nextId = "rec_" + ("000" + lastRow).slice(-3);
    var now = new Date();
    var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      nextId,                          // record_id
      data.recordType || "",           // record_type
      data.memberName || "",           // member_name
      data.competitionId || "",        // competition_id
      data.competitionName || "",      // competition_name
      data.competitionClass || "",     // competition_class
      data.record || "",               // record
      data.competitionDate || "",      // competition_date
      data.swimTime || "",             // swim_time
      data.bikeTime || "",             // bike_time
      data.runTime || "",              // run_time
      data.utmbSlug || "",             // utmb_slug
      data.utmbIndex || "",            // utmb_index
      timestamp,                       // created_at
      timestamp                        // updated_at
    ]);

  } else {
    // 기존 가입신청서 로직 (하위 호환)
    var sheet = ss.getSheetByName("가입신청서");
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
  }

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

function testRaceParticipation() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        action: "raceParticipation",
        registeredDate: "2026. 2. 8",
        raceName: "고구려마라톤",
        course: "마라톤-FULL",
        memberName: "테스트",
        resolution: "서브3!"
      })
    }
  };
  doPost(fakeEvent);
}

function testRecordSubmit() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        action: "recordSubmit",
        recordType: "marathon",
        memberName: "테스트",
        competitionId: "comp_055",
        competitionName: "JTBC 마라톤",
        competitionClass: "Full",
        record: "3:25:10",
        competitionDate: "2025-11-02",
        swimTime: "",
        bikeTime: "",
        runTime: "",
        utmbSlug: "",
        utmbIndex: ""
      })
    }
  };
  doPost(fakeEvent);
}

// ----- 여기까지 Apps Script에 붙여넣기 -----

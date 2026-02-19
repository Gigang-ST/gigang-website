// ============================================
// Google Apps Script - 기강 가입신청서 + 대회참여 + 대회기록 + UTMB 자동갱신
// ============================================
//
// 설정 방법:
// 1. Google Sheets 열기
//    /* 취약점 점검 20260216 junmink 시트 ID 노출 삭제 */
//    https://docs.google.com/spreadsheets/d/____
// 2. 시트 이름을 "가입신청서"로 설정
//
// 3. 첫 번째 행(헤더)에 아래 순서대로 입력:
//    | member_id | full_name | gender | birthday | phone | status | account_number | admin | joined_at | created_at | updated_at | note |
//
// 4. "대회참여현황" 시트 헤더:
//    | member_id | member_name | competition_id | competition_name | competition_class | status | pledge | created_at | updated_at |
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
    var status = (data.competitionClass === "응원") ? "cheering" : "applied";
    var now = new Date();
    var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      data.memberId || "",             // member_id
      data.memberName || "",           // member_name
      data.competitionId || "",        // competition_id
      data.competitionName || "",      // competition_name
      data.competitionClass || "",     // competition_class
      status,                          // status
      data.pledge || "",               // pledge
      timestamp,                       // created_at
      timestamp                        // updated_at
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

  } else if (data.action === "join") {
    // 가입신청서
    var sheet = ss.getSheetByName("가입신청서");
    var lastRow = sheet.getLastRow();
    var nextId = "mem_" + ("000" + lastRow).slice(-3);
    var now = new Date();
    var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      nextId,                          // member_id
      data.name || "",                 // full_name
      data.gender || "",               // gender
      data.birthDate || "",            // birthday
      data.phone || "",                // phone
      "active",                        // status
      data.accountNumber || "",        // account_number
      "",                              // admin
      "",                              // joined_at
      timestamp,                       // created_at
      timestamp,                       // updated_at
      data.note || ""                  // note
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
        action: "join",
        name: "테스트",
        gender: "male",
        birthDate: "1995-03-15",
        phone: "010-1234-5678",
        accountNumber: "국민 123-456",
        note: "거주지역: 강남역, 러닝경력: 런린이(입문 이하)"
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
        memberId: "mem_001",
        memberName: "테스트",
        competitionId: "comp_025",
        competitionName: "고구려마라톤",
        competitionClass: "FULL",
        pledge: "서브3!"
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

// ============================================
// UTMB Index 자동 갱신
// ============================================
//
// 설정 방법:
// 1. Apps Script 편집기 → 트리거 (시계 아이콘)
// 2. + 트리거 추가
//    - 실행할 함수: updateAllUtmbIndexes
//    - 이벤트 소스: 시간 기반
//    - 트리거 유형: 주 단위 타이머 (매주 월요일 등)
// 3. 저장
//
// ============================================

/**
 * UTMB 프로필 페이지에서 general 인덱스 점수를 가져온다.
 * @param {string} slug - UTMB 프로필 슬러그 (예: "7477568.hyeongeun.lee")
 * @returns {number|null} 인덱스 점수 또는 null
 */
function fetchUtmbIndex(slug) {
  var url = "https://utmb.world/en/runner/" + encodeURIComponent(slug);
  try {
    var res = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html"
      }
    });
    if (res.getResponseCode() !== 200) return null;

    var html = res.getContentText();
    var match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    var nextData = JSON.parse(match[1]);
    var indexes = nextData.props.pageProps.performanceIndexes || [];
    for (var i = 0; i < indexes.length; i++) {
      if (indexes[i].piCategory === "general") {
        return indexes[i].index;
      }
    }
    return null;
  } catch (e) {
    Logger.log("UTMB fetch 실패 (" + slug + "): " + e.message);
    return null;
  }
}

/**
 * 대회기록 시트에서 trail 레코드의 UTMB Index를 일괄 갱신한다.
 * 시간 트리거로 주 1회 실행 권장.
 */
function updateAllUtmbIndexes() {
  var ss = SpreadsheetApp.openById("16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw");
  var sheet = ss.getSheetByName("대회기록");
  var data = sheet.getDataRange().getValues();

  // 헤더 기준 컬럼 인덱스 (0-based)
  // record_type=1, utmb_slug=11, utmb_index=12, updated_at=14
  var COL_TYPE = 1;
  var COL_SLUG = 11;
  var COL_INDEX = 12;
  var COL_UPDATED = 14;

  var now = new Date();
  var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  // 이미 조회한 slug는 캐싱
  var cache = {};
  var updateCount = 0;

  for (var row = 1; row < data.length; row++) {
    if (data[row][COL_TYPE] !== "trail") continue;
    var slug = String(data[row][COL_SLUG]).trim();
    if (!slug) continue;

    var newIndex;
    if (slug in cache) {
      newIndex = cache[slug];
    } else {
      newIndex = fetchUtmbIndex(slug);
      cache[slug] = newIndex;
      // UTMB 서버 부담 방지
      Utilities.sleep(2000);
    }

    if (newIndex !== null) {
      var sheetRow = row + 1; // 1-based
      sheet.getRange(sheetRow, COL_INDEX + 1).setValue(newIndex);
      sheet.getRange(sheetRow, COL_UPDATED + 1).setValue(timestamp);
      updateCount++;
    }
  }

  Logger.log("UTMB Index 갱신 완료: " + updateCount + "건 업데이트");
}

// ----- 여기까지 Apps Script에 붙여넣기 -----

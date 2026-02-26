// ============================================
// Google Apps Script - 기강 스프레드시트 자동화
// ============================================
//
// 파일 구조:
//   Code.js       — 공통 상수, doPost (웹 앱 엔드포인트)
//   Utmb.js       — UTMB Index 자동 갱신
//   Dues.js       — 회비장부 member_id 자동 채우기
//   Tests.js      — 테스트용 함수
//
// 시트 헤더:
//   가입신청서:     | member_id | full_name | gender | birthday | phone | status | account_number | admin | joined_at | created_at | updated_at | note |
//   대회참여현황:   | member_id | member_name | competition_id | competition_name | competition_class | status | pledge | created_at | updated_at |
//   대회기록:       | record_id | record_type | member_name | competition_id | competition_name | competition_class | record | competition_date | swim_time | bike_time | run_time | utmb_slug | utmb_index | created_at | updated_at |
//   회비장부:       | member_id | member_name | type | amount | date | note |
//
// 배포:
//   1. 확장 프로그램 → Apps Script 열기
//   2. 4개 파일 각각 생성하여 코드 붙여넣기 → 저장
//   3. 배포 → 새 배포 → 웹 앱
//      - 실행 계정: 나 / 액세스: 모든 사용자
//   4. 배포 URL → Vercel 환경변수 NEXT_PUBLIC_GOOGLE_SCRIPT_URL에 설정
//
// ============================================
function testSimpleEdit() {
    Logger.log("테스트 성공");
  }


var SPREADSHEET_ID = "16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw";

function doPost(e) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var data = JSON.parse(e.postData.contents);

  if (data.action === "raceParticipation") {
    var sheet = ss.getSheetByName("대회참여현황");
    var status = (data.competitionClass === "응원") ? "cheering" : "applied";
    var now = new Date();
    var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    sheet.appendRow([
      data.memberId || "",
      data.memberName || "",
      data.competitionId || "",
      data.competitionName || "",
      data.competitionClass || "",
      status,
      data.pledge || "",
      timestamp,
      timestamp
    ]);

  } else if (data.action === "recordSubmit") {
    var sheet = ss.getSheetByName("대회기록");
    var lastRow = sheet.getLastRow();
    var nextId = "rec_" + ("000" + lastRow).slice(-3);
    var now = new Date();
    var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      nextId,
      data.recordType || "",
      data.memberName || "",
      data.competitionId || "",
      data.competitionName || "",
      data.competitionClass || "",
      data.record || "",
      data.competitionDate || "",
      data.swimTime || "",
      data.bikeTime || "",
      data.runTime || "",
      data.utmbSlug || "",
      data.utmbIndex || "",
      timestamp,
      timestamp
    ]);

  } else if (data.action === "join") {
    var sheet = ss.getSheetByName("가입신청서");
    var lastRow = sheet.getLastRow();
    var nextId = "mem_" + ("000" + lastRow).slice(-3);
    var now = new Date();
    var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
      nextId,
      data.name || "",
      data.gender || "",
      data.birthDate || "",
      data.phone || "",
      "active",
      data.accountNumber || "",
      "",
      "",
      timestamp,
      timestamp,
      data.note || ""
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ result: "OK" }))
    .setMimeType(ContentService.MimeType.JSON);
}

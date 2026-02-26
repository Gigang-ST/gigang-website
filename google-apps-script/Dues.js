// ============================================
// 회비장부 member_id 자동 채우기
// ============================================
//
// 설정:
//   1. Apps Script 편집기에서 installDuesTrigger 함수를 한 번 실행
//   2. 권한 승인
//   3. 이후 회비장부 B열 편집 시 자동 동작
//
// 동작:
//   회비장부 시트에서 B열(이름) 입력 시, A열이 비어있으면 자동 채움
//   - 가입신청서에서 active 회원 중 이름 매칭
//   - 1명 매칭 → member_id 자동 입력
//   - 2명 이상 → "double"
//   - 0명 → FALSE
//
// ============================================

/**
 * 설치형 트리거 등록 — 한 번만 실행하면 됨
 */
function installDuesTrigger() {
  // 기존 onDuesEdit 트리거 제거 (중복 방지)
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "onDuesEdit") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ScriptApp.newTrigger("onDuesEdit")
    .forSpreadsheet(ss)
    .onEdit()
    .create();

  Logger.log("회비장부 트리거 등록 완료");
}

/**
 * 회비장부 B열 편집 시 A열 member_id 자동 채우기
 */
function onDuesEdit(e) {
  if (!e || !e.source) return;

  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== "회비장부") return;

  var range = e.range;
  var col = range.getColumn();
  var row = range.getRow();

  // C열(3번째 컬럼, member_name) 편집 시에만 동작, 헤더(1행) 제외
  if (col !== 3 || row <= 1) return;

  // A열이 이미 수동 입력되어 있으면 무시
  var cellA = sheet.getRange(row, 1);
  var existingId = cellA.getValue();
  if (existingId !== "" && existingId !== false && existingId !== "double" && existingId !== "FALSE") return;

  var memberName = String(range.getValue()).trim();
  if (!memberName) {
    cellA.setValue("");
    return;
  }

  // 가입신청서에서 active 회원 검색
  var membersSheet = e.source.getSheetByName("가입신청서");
  if (!membersSheet) return;

  var data = membersSheet.getDataRange().getValues();
  var matches = [];

  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][1]).trim();    // B열: full_name
    var status = String(data[i][5]).trim();  // F열: status
    if (name === memberName && status === "active") {
      matches.push(String(data[i][0]).trim()); // A열: member_id
    }
  }

  if (matches.length === 1) {
    cellA.setValue(matches[0]);
  } else if (matches.length > 1) {
    cellA.setValue("double");
  } else {
    cellA.setValue(false);
  }
}

/**
 * 회비장부 A열이 빈 행을 일괄 스캔하여 member_id 채우기
 * 수동 실행용 (한 번 돌리면 끝)
 */
function fillDuesIds() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var duesSheet = ss.getSheetByName("회비장부");
  var membersSheet = ss.getSheetByName("가입신청서");
  if (!duesSheet || !membersSheet) return;

  var membersData = membersSheet.getDataRange().getValues();
  var duesData = duesSheet.getDataRange().getValues();
  var fillCount = 0;

  for (var row = 1; row < duesData.length; row++) {
    var existingId = duesData[row][0];
    if (existingId !== "" && existingId !== false && existingId !== "double" && existingId !== "FALSE") continue;

    var memberName = String(duesData[row][1]).trim();
    if (!memberName) continue;

    var matches = [];
    for (var i = 1; i < membersData.length; i++) {
      var name = String(membersData[i][1]).trim();
      var status = String(membersData[i][5]).trim();
      if (name === memberName && status === "active") {
        matches.push(String(membersData[i][0]).trim());
      }
    }

    var sheetRow = row + 1;
    if (matches.length === 1) {
      duesSheet.getRange(sheetRow, 1).setValue(matches[0]);
      fillCount++;
    } else if (matches.length > 1) {
      duesSheet.getRange(sheetRow, 1).setValue("double");
      fillCount++;
    } else {
      duesSheet.getRange(sheetRow, 1).setValue(false);
      fillCount++;
    }
  }

  Logger.log("일괄 채우기 완료: " + fillCount + "건 처리");
}

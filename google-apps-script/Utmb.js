// ============================================
// UTMB Index 자동 갱신
// ============================================
//
// 트리거 설정:
//   Apps Script 편집기 → 트리거 (시계 아이콘) → + 트리거 추가
//   - 실행할 함수: updateAllUtmbIndexes
//   - 이벤트 소스: 시간 기반
//   - 트리거 유형: 주 단위 타이머 (매주 월요일 등)
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
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName("대회기록");
  var data = sheet.getDataRange().getValues();

  var COL_TYPE = 1;
  var COL_SLUG = 11;
  var COL_INDEX = 12;
  var COL_UPDATED = 14;

  var now = new Date();
  var timestamp = Utilities.formatDate(now, "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

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
      Utilities.sleep(2000);
    }

    if (newIndex !== null) {
      var sheetRow = row + 1;
      sheet.getRange(sheetRow, COL_INDEX + 1).setValue(newIndex);
      sheet.getRange(sheetRow, COL_UPDATED + 1).setValue(timestamp);
      updateCount++;
    }
  }

  Logger.log("UTMB Index 갱신 완료: " + updateCount + "건 업데이트");
}

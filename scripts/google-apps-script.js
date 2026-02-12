/**
 * Google Apps Script — 기강 웹사이트 웹훅
 *
 * 이 파일은 참고용입니다. Google Apps Script 편집기에 붙여넣기 하세요.
 * 스프레드시트 ID: 16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw
 *
 * 가입신청서 시트 컬럼:
 * member_id | full_name | gender | birthday | phone | status | account_number | admin | joined_at | created_at | updated_at | note
 *
 * 대회참여현황 시트 컬럼:
 * member_id | full_name | competition_id | competition_name | competition_class | status | pledge | created_at | updated_at
 */

const SPREADSHEET_ID = '16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'join') {
      handleJoin(data);
    } else if (action === 'raceParticipation') {
      handleRaceParticipation(data);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: 'ok' })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: 'error', message: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 가입 신청 처리
 * 새 member_id를 자동 생성하고 가입신청서 시트에 행 추가
 */
function handleJoin(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('가입신청서');
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');
  const timestamp = Utilities.formatDate(
    new Date(),
    'Asia/Seoul',
    "yyyy. M. d a h:mm:ss"
  );

  // 마지막 member_id에서 다음 번호 생성
  const lastRow = sheet.getLastRow();
  let nextNum = 1;
  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 1).getValue().toString();
    const match = lastId.match(/(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  const memberId = 'mem_' + String(nextNum).padStart(3, '0');

  // 가입신청서 시트 컬럼 순서:
  // member_id, full_name, gender, birthday, phone, status, account_number, admin, joined_at, created_at, updated_at, note
  sheet.appendRow([
    memberId,
    data.name,
    data.gender,           // "male" | "female"
    data.birthDate,        // "YYYY-MM-DD"
    data.phone || '',
    'active',
    data.accountNumber || '',
    'FALSE',
    now,
    timestamp,
    timestamp,
    data.note || '',
  ]);
}

/**
 * 대회 참가 신청 처리
 * 대회참여현황 시트에 행 추가
 */
function handleRaceParticipation(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('대회참여현황');
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd');

  // 대회참여현황 시트 컬럼 순서:
  // member_id, full_name, competition_id, competition_name, competition_class, status, pledge, created_at, updated_at
  sheet.appendRow([
    data.memberId || '',
    data.memberName,
    data.competitionId || '',
    data.competitionName,
    data.competitionClass,
    data.competitionClass === '응원' ? 'cheering' : 'applied',
    data.pledge || '',
    timestamp,
    timestamp,
  ]);
}

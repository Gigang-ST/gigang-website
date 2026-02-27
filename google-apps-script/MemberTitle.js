// ============================================
// [Title System] 멤버 칭호 산출 시스템
// 파일명: MemberTitle.gs
// ============================================

var SPREADSHEET_ID = "16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw";

function runTitleUpdate() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  var members      = loadMembers(ss);
  var pbMap        = loadPBMap(ss);
  var trailMap     = loadTrailCompletionMap(ss);
  var triathlonMap = loadTriathlonCompletionMap(ss);

  Logger.log("멤버 수: " + members.length);

  var results = calculateTitles(members, pbMap, trailMap, triathlonMap);
  saveTitleSheet(ss, results);

  Logger.log("=== 칭호 업데이트 완료 ===");
}

// ============================================
// 칭호 계산 메인 로직
// ============================================

function calculateTitles(members, pbMap, trailMap, triathlonMap) {

  var titleDefs = [
    // marathon
    { group: 'marathon', name: '런린이',           priority: 1,  criteria: 'manual' },
    { group: 'marathon', name: '입문',             priority: 2,  criteria: 'record', key: '5k',   limit: 1800  },
    { group: 'marathon', name: '초보',             priority: 3,  criteria: 'record', key: '10k',  limit: 3600  },
    { group: 'marathon', name: '중수',             priority: 4,  criteria: 'record', key: 'half', limit: 7200  },
    { group: 'marathon', name: '고수',             priority: 5,  criteria: 'record', key: 'full', limit: 18000 },
    { group: 'marathon', name: '고인물',           priority: 6,  criteria: 'record', key: 'full', limit: 14400 },
    { group: 'marathon', name: '신세계',           priority: 7,  criteria: 'record', key: 'full', limit: 12600 },
    { group: 'marathon', name: '서브현근',         priority: 80, criteria: 'dynamic' },
    { group: 'marathon', name: '천상천하유아독존', priority: 81, criteria: 'record', key: 'full', limit: 11400 },
    { group: 'marathon', name: '최고존엄',         priority: 82, criteria: 'record', key: 'full', limit: 10800 },
    // trail_run
    { group: 'trail_run', name: '트린이', priority: 11, criteria: 'trail', level: 1 },
    { group: 'trail_run', name: 'T20K',   priority: 12, criteria: 'trail', level: 2 },
    { group: 'trail_run', name: 'T50K',   priority: 13, criteria: 'trail', level: 3 },
    { group: 'trail_run', name: 'T100K',  priority: 14, criteria: 'trail', level: 4 },
    { group: 'trail_run', name: 'T100M',  priority: 15, criteria: 'trail', level: 5 },
    // triathlon
    { group: 'triathlon', name: '제로철인', priority: 21, criteria: 'tri', level: 1 },
    { group: 'triathlon', name: '쿼터철인', priority: 22, criteria: 'tri', level: 2 },
    { group: 'triathlon', name: '하프철인', priority: 23, criteria: 'tri', level: 3 },
    { group: 'triathlon', name: '킹철인',   priority: 24, criteria: 'tri', level: 4 },
  ];

  // 하드코딩 Crew Role
  var crewRoles = {
    'mem_001': [{ name: '단장',         priority: 100 }],
    'mem_002': [{ name: '훈련부장',     priority: 90  }],
    'mem_033': [{ name: '산악구보부장', priority: 90  }],
    'mem_013': [{ name: '포토',         priority: 50  }],
    'mem_068': [{ name: '포토',         priority: 50  }],
  };

  // 서브현근 기준: 이현근 Full PB
  var standardFullPB = 999999;
  var standard = members.find(function(m) { return m.full_name === '이현근'; });
  if (standard && pbMap[standard.member_id] && pbMap[standard.member_id]['full']) {
    standardFullPB = pbMap[standard.member_id]['full'];
  }

  var resultRows = [];
  var counter = 1;
  var now = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  members.forEach(function(mem) {
    var memId   = mem.member_id;
    var memName = mem.full_name;
    var myPBs   = pbMap[memId]        || {};
    var myTrail = trailMap[memId]     || 0;
    var myTri   = triathlonMap[memId] || 0;

    var candidatesByGroup = {};

    titleDefs.forEach(function(def) {
      var eligible = false;
      var ref      = '';

      if (def.criteria === 'manual') {
        eligible = true;
        ref = 'Basic';

      } else if (def.criteria === 'record') {
        var pb = myPBs[def.key];
        if (pb !== undefined && pb <= def.limit) {
          eligible = true;
          ref = def.key.toUpperCase() + ' PB: ' + secondsToTimeString(pb);
        }

      } else if (def.criteria === 'dynamic') {
        if (myPBs['full'] !== undefined && myPBs['full'] < standardFullPB) {
          eligible = true;
          ref = 'Beat Standard (' + secondsToTimeString(standardFullPB) + ')';
        }

      } else if (def.criteria === 'trail') {
        if (myTrail >= def.level) {
          eligible = true;
          ref = 'Trail Level ' + def.level + ' Completed';
        }

      } else if (def.criteria === 'tri') {
        if (myTri >= def.level) {
          eligible = true;
          ref = 'Triathlon Level ' + def.level + ' Completed';
        }
      }

      if (eligible) {
        if (!candidatesByGroup[def.group]) candidatesByGroup[def.group] = [];
        candidatesByGroup[def.group].push({ def: def, ref: ref });
      }
    });

    // 그룹별 최고 priority 1개만 선택
    for (var group in candidatesByGroup) {
      var candidates = candidatesByGroup[group];
      candidates.sort(function(a, b) { return b.def.priority - a.def.priority; });
      var winner = candidates[0];

      var mtId = 'mt_' + String(counter++).padStart(4, '0');
      resultRows.push([
        mtId,
        memId,
        memName,
        winner.def.group,
        winner.def.name,
        winner.ref,
        now
      ]);
    }

    // Crew Role 하드코딩
    if (crewRoles[memId]) {
      crewRoles[memId].forEach(function(role) {
        var mtId = 'mt_' + String(counter++).padStart(4, '0');
        resultRows.push([
          mtId,
          memId,
          memName,
          'crew_role',
          role.name,
          'Hardcoded Role',
          now
        ]);
      });
    }
  });

  return resultRows;
}

// ============================================
// 데이터 로드 함수
// ============================================

function loadMembers(ss) {
  var data = ss.getSheetByName("가입신청서").getDataRange().getDisplayValues();
  var members = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[5]).toLowerCase().trim() === 'active') {
      members.push({
        member_id: String(row[0]).trim(),
        full_name: String(row[1]).trim(),
        gender:    String(row[2]).trim()
      });
    }
  }
  return members;
}

/**
 * personal_best 시트에서 멤버별 PB (초) 로드
 * pbMap[member_id] = { full: 초, half: 초, '10k': 초, '5k': 초 }
 */
function loadPBMap(ss) {
  var data = ss.getSheetByName("personal_best").getDataRange().getDisplayValues();
  // member_id(0) | member_name(1) | gender(2) | record_type(3) |
  // competition_name(4) | competition_class(5) | record(6) | ...

  var pbMap = {};

  for (var i = 1; i < data.length; i++) {
    var row       = data[i];
    var memId     = String(row[0]).trim();
    var recType   = String(row[3]).trim();
    var compClass = String(row[5]).trim().toLowerCase();
    var recordStr = String(row[6]).trim();

    if (recType !== 'marathon') continue;

    var seconds = timeStringToSeconds(recordStr);
    if (seconds <= 0) continue;

    var key = normalizeClass(compClass);
    if (!key) continue;

    if (!pbMap[memId]) pbMap[memId] = {};
    if (pbMap[memId][key] === undefined || seconds < pbMap[memId][key]) {
      pbMap[memId][key] = seconds;
    }
  }

  return pbMap;
}

/**
 * 대회기록에서 트레일 완주 이력 로드
 * trailMap[member_id] = 최고 trail level (1~5)
 */
function loadTrailCompletionMap(ss) {
  var data     = ss.getSheetByName("대회기록").getDataRange().getDisplayValues();
  var nameToId = buildNameToIdMap(ss);
  var trailMap = {};

  for (var i = 1; i < data.length; i++) {
    var row     = data[i];
    var recType = String(row[1]).trim();
    if (recType !== 'trail') continue;

    var name      = String(row[2]).trim();
    var compName  = String(row[4]).trim();
    var compClass = String(row[5]).trim();
    var memId     = nameToId[name];
    if (!memId) continue;

    var level = getTrailLevel(compName, compClass);
    if (level === 0) continue;

    if (!trailMap[memId] || level > trailMap[memId]) {
      trailMap[memId] = level;
    }
  }

  return trailMap;
}

/**
 * 대회기록에서 트라이애슬론 완주 이력 로드
 * triathlonMap[member_id] = 최고 tri level (1~4)
 */
function loadTriathlonCompletionMap(ss) {
  var data     = ss.getSheetByName("대회기록").getDataRange().getDisplayValues();
  var nameToId = buildNameToIdMap(ss);
  var triMap   = {};

  for (var i = 1; i < data.length; i++) {
    var row     = data[i];
    var recType = String(row[1]).trim();
    if (recType !== 'triathlon') continue;

    var name      = String(row[2]).trim();
    var compClass = String(row[5]).trim().toLowerCase();
    var memId     = nameToId[name];
    if (!memId) continue;

    var level = getTriathlonLevel(compClass);
    if (level === 0) continue;

    if (!triMap[memId] || level > triMap[memId]) {
      triMap[memId] = level;
    }
  }

  return triMap;
}

// ============================================
// 시트 저장
// ============================================

function saveTitleSheet(ss, rows) {
  var sheetName = "member_title";
  var sheet = ss.getSheetByName(sheetName);

  var headers = [
    "member_title_id",
    "member_id",
    "full_name",
    "title_group",
    "title_name",
    "source_ref_id",
    "assigned_at"
  ];

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clearContents();
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }

  Logger.log("저장된 칭호 행 수: " + rows.length);
}

// ============================================
// 유틸리티 함수
// ============================================

function buildNameToIdMap(ss) {
  var data = ss.getSheetByName("가입신청서").getDataRange().getDisplayValues();
  var map  = {};
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[5]).toLowerCase().trim() === 'active') {
      map[String(row[1]).trim()] = String(row[0]).trim();
    }
  }
  return map;
}

function normalizeClass(cls) {
  var c = cls.toLowerCase().trim();
  if (c === 'full') return 'full';
  if (c === 'half') return 'half';
  if (c === '10k')  return '10k';
  if (c === '5k')   return '5k';
  return null;
}

function getTrailLevel(compName, compClass) {
  var text = (compName + ' ' + compClass).toLowerCase();
  if (text.match(/100\s*m(ile)?/))                                            return 5;
  if (text.match(/100\s*k/))                                                  return 4;
  if (text.match(/50\s*k/))                                                   return 3;
  if (text.match(/30\s*k/) || text.match(/20\s*k/) || text.match(/half/))    return 2;
  return 1; // 기록이 있으면 최소 트린이
}

function getTriathlonLevel(cls) {
  var c = cls.toLowerCase();
  if (c.includes('king') || c.includes('ironman') || c.includes('iron man')) return 4;
  if (c.includes('half') || c.includes('middle'))                             return 3;
  if (c.includes('olympic') || c.includes('oly'))                             return 2;
  return 0;
}

function timeStringToSeconds(str) {
  var parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function secondsToTimeString(sec) {
  var h = Math.floor(sec / 3600);
  var m = Math.floor((sec % 3600) / 60);
  var s = sec % 60;
  return h + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2);
}
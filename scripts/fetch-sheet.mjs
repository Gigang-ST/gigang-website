#!/usr/bin/env node

const SPREADSHEET_ID = "16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw";

/** 기본 시트 (빠른 조회용 캐시) */
const KNOWN_SHEETS = {
  "가입신청서": 0,
  "트레일러닝 인덱스": 1696056824,
  "칭호시스템": 1320659061,
  "회비장부": 671485688,
  "대회참여현황": 573958893,
  "대회현황": 267782969,
  "대회기록": 1638315503,
};

/** 스프레드시트 HTML에서 모든 시트 이름+gid를 동적으로 가져옴 */
async function fetchAllSheets() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`;
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();

  const sheets = {};
  const regex = /#gid=(\d+)[^"]*"[^>]*>([^<]+)/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    sheets[m[2].trim()] = parseInt(m[1], 10);
  }
  // KNOWN_SHEETS 에 없던 시트도 포함
  for (const [name, gid] of Object.entries(KNOWN_SHEETS)) {
    if (!sheets[name]) sheets[name] = gid;
  }
  return sheets;
}

/** 이름으로 gid 찾기 (동적 조회 포함) */
async function resolveGid(nameOrGid) {
  // 숫자면 gid 직접 사용
  if (/^\d+$/.test(nameOrGid)) {
    return parseInt(nameOrGid, 10);
  }
  // 기본 맵에서 찾기
  if (KNOWN_SHEETS[nameOrGid] !== undefined) {
    return KNOWN_SHEETS[nameOrGid];
  }
  // 동적으로 모든 시트 조회
  const all = await fetchAllSheets();
  if (all[nameOrGid] !== undefined) {
    return all[nameOrGid];
  }
  // 부분 매칭 시도
  const lower = nameOrGid.toLowerCase();
  const match = Object.entries(all).find(([name]) => name.toLowerCase().includes(lower));
  if (match) {
    console.error(`"${nameOrGid}" → "${match[0]}" (gid=${match[1]}) 로 매칭`);
    return match[1];
  }
  return null;
}

async function fetchSheet(nameOrGid, { rows } = {}) {
  const gid = await resolveGid(nameOrGid);
  if (gid === null) {
    console.error(`시트를 찾을 수 없습니다: "${nameOrGid}"`);
    const all = await fetchAllSheets();
    console.error(`사용 가능한 시트:\n${Object.entries(all).map(([n, g]) => `  - ${n} (gid=${g})`).join("\n")}`);
    process.exit(1);
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(csvUrl, { redirect: "follow" });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: 시트를 가져올 수 없습니다 (gid=${gid})`);
    process.exit(1);
  }

  const text = await res.text();
  const lines = text.split("\n");

  if (rows && rows > 0) {
    console.log(lines.slice(0, rows + 1).join("\n"));
    console.log(`\n... (총 ${lines.length - 1}행 중 ${Math.min(rows, lines.length - 1)}행 표시)`);
  } else {
    console.log(text);
  }
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`사용법: node fetch-sheet.mjs <시트이름|gid> [--rows N]

옵션:
  --rows N    처음 N행만 표시 (헤더 제외)
  --list      스프레드시트의 모든 시트 목록 표시

예시:
  node fetch-sheet.mjs 가입신청서          # 이름으로 조회
  node fetch-sheet.mjs 가입신청서 --rows 5 # 처음 5행만
  node fetch-sheet.mjs 2136190190         # gid로 직접 조회
  node fetch-sheet.mjs temp               # 부분 매칭도 지원
  node fetch-sheet.mjs --list             # 모든 시트 목록`);
  process.exit(0);
}

if (args.includes("--list")) {
  const all = await fetchAllSheets();
  console.log("시트 목록:");
  for (const [name, gid] of Object.entries(all)) {
    console.log(`  - ${name} (gid=${gid})`);
  }
  process.exit(0);
}

const sheetName = args[0];
const rowsIdx = args.indexOf("--rows");
const rows = rowsIdx !== -1 ? parseInt(args[rowsIdx + 1], 10) : 0;

await fetchSheet(sheetName, { rows });

#!/usr/bin/env node

const SPREADSHEET_ID = "16Z3GOjYhPLx4UYxg5B-BeQ_LHmtDX7xP4_VwgDsASIw";

const SHEETS = {
  "가입신청서": 0,
  "트레일러닝 인덱스": 1696056824,
  "칭호시스템": 1320659061,
  "회비장부": 671485688,
  "대회참여현황": 573958893,
  "대회현황": 267782969,
  "대회기록": 1638315503,
};

async function resolveGids() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/htmlview`;
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();

  for (const name of Object.keys(SHEETS)) {
    if (SHEETS[name] !== null) continue;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`#gid=(\\d+)[^"]*"[^>]*>${escaped}`));
    if (match) SHEETS[name] = parseInt(match[1], 10);
  }
}

async function fetchSheet(nameOrGid, { rows } = {}) {
  let gid;
  if (/^\d+$/.test(nameOrGid)) {
    gid = parseInt(nameOrGid, 10);
  } else {
    if (SHEETS[nameOrGid] === undefined || SHEETS[nameOrGid] === null) {
      await resolveGids();
    }
    gid = SHEETS[nameOrGid];
    if (gid === undefined || gid === null) {
      console.error(`시트를 찾을 수 없습니다: "${nameOrGid}"`);
      console.error(`사용 가능한 시트: ${Object.keys(SHEETS).join(", ")}`);
      process.exit(1);
    }
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

시트 목록:
${Object.entries(SHEETS).map(([name, gid]) => `  - ${name} (gid=${gid ?? "auto"})`).join("\n")}

옵션:
  --rows N    처음 N행만 표시 (헤더 제외)
  --list      시트 목록만 표시

예시:
  node fetch-sheet.mjs 가입신청서
  node fetch-sheet.mjs 가입신청서 --rows 5
  node fetch-sheet.mjs 0`);
  process.exit(0);
}

if (args.includes("--list")) {
  await resolveGids();
  console.log("시트 목록:");
  for (const [name, gid] of Object.entries(SHEETS)) {
    console.log(`  - ${name} (gid=${gid ?? "?"})`);
  }
  process.exit(0);
}

const sheetName = args[0];
const rowsIdx = args.indexOf("--rows");
const rows = rowsIdx !== -1 ? parseInt(args[rowsIdx + 1], 10) : 0;

await fetchSheet(sheetName, { rows });

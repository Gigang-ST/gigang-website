/**
 * CSV 파서 — 쉼표 포함 따옴표 필드를 올바르게 처리
 * RFC 4180 기본 규칙 준수
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;

  while (i < text.length) {
    const row: string[] = [];
    // 한 행 파싱
    while (i < text.length) {
      let field = "";

      if (text[i] === '"') {
        // 따옴표 필드
        i++; // opening quote
        while (i < text.length) {
          if (text[i] === '"') {
            if (i + 1 < text.length && text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // closing quote
              break;
            }
          } else {
            field += text[i];
            i++;
          }
        }
      } else {
        // 일반 필드
        while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i];
          i++;
        }
      }

      row.push(field.trim());

      if (i < text.length && text[i] === ',') {
        i++; // skip comma
        continue;
      }
      // 줄 끝
      if (i < text.length && text[i] === '\r') i++;
      if (i < text.length && text[i] === '\n') i++;
      break;
    }

    if (row.length > 0 && !(row.length === 1 && row[0] === "")) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * 생년월일 입력 유효성 검사
 * 지원 형식: YYMMDD, YYYY-MM-DD
 */
export function validateBirthDate(value: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();

  // YYMMDD (6자리)
  if (/^\d{6}$/.test(trimmed)) {
    const yy = parseInt(trimmed.slice(0, 2), 10);
    const mm = parseInt(trimmed.slice(2, 4), 10);
    const dd = parseInt(trimmed.slice(4, 6), 10);
    if (mm < 1 || mm > 12) return "월은 01~12 사이여야 합니다.";
    if (dd < 1 || dd > 31) return "일은 01~31 사이여야 합니다.";
    const year = yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy;
    const date = new Date(year, mm - 1, dd);
    if (date.getMonth() !== mm - 1 || date.getDate() !== dd)
      return "유효하지 않은 날짜입니다.";
    return null;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [yyyy, mm, dd] = trimmed.split("-").map(Number);
    if (yyyy < 1900 || yyyy > new Date().getFullYear())
      return "연도를 확인해주세요.";
    if (mm < 1 || mm > 12) return "월은 01~12 사이여야 합니다.";
    if (dd < 1 || dd > 31) return "일은 01~31 사이여야 합니다.";
    const date = new Date(yyyy, mm - 1, dd);
    if (date.getMonth() !== mm - 1 || date.getDate() !== dd)
      return "유효하지 않은 날짜입니다.";
    return null;
  }

  return "형식: 1995-03-15 또는 950315";
}

/**
 * 다양한 생년월일 형식을 YYYYMMDD 8자리로 정규화
 * "1994. 10. 17" / "941017" / "1994-10-17" / "19941017" → "19941017"
 */
export function normalizeBirthDate(value: string): string {
  const trimmed = value.trim();

  // "1994. 10. 17" 형식 (한국식 공백 포함)
  const dotMatch = trimmed.match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})$/);
  if (dotMatch) {
    return `${dotMatch[1]}${dotMatch[2].padStart(2, "0")}${dotMatch[3].padStart(2, "0")}`;
  }

  // YYYYMMDD (8자리)
  if (/^\d{8}$/.test(trimmed)) {
    return trimmed;
  }

  // YYMMDD (6자리)
  if (/^\d{6}$/.test(trimmed)) {
    const yy = parseInt(trimmed.slice(0, 2), 10);
    const year = yy >= 0 && yy <= 30 ? 2000 + yy : 1900 + yy;
    return `${year}${trimmed.slice(2)}`;
  }

  // YYYY-MM-DD
  const dashMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dashMatch) {
    return `${dashMatch[1]}${dashMatch[2]}${dashMatch[3]}`;
  }

  return trimmed;
}

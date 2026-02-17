/**
 * 텍스트 입력에서 제어 문자, HTML 태그, 스크립트 패턴 제거
 * 폼 제출 전 사용자 입력을 정리하는 용도
 */
export function sanitizeText(value: string, maxLength = 200): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // 제어 문자 제거
    .replace(/<[^>]*>/g, "") // HTML 태그 제거
    .trim()
    .slice(0, maxLength);
}

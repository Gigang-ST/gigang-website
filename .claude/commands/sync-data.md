Google Sheets 4개 시트의 데이터를 전체 조회하여 현황을 요약합니다.

아래 명령어를 **병렬로** 실행하세요:

1. `node scripts/fetch-sheet.mjs "대회현황"`
2. `node scripts/fetch-sheet.mjs "대회참여현황"`
3. `node scripts/fetch-sheet.mjs "가입신청서"`
4. `node scripts/fetch-sheet.mjs "대회기록"`

결과를 다음 형태로 요약해주세요:

- **회원**: 총 N명 (활동 N명 / 탈퇴 N명)
- **대회**: 총 N개 (예정 N개 / 종료 N개)
- **참가 신청**: 총 N건
- **완주 기록**: 총 N건

추가로 다가오는 대회가 있으면 대회명, 날짜, 신청 현황을 표로 보여주세요.

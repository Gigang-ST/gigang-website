Google Sheets 시트를 조회합니다.

사용자가 시트 이름이나 gid를 지정하면 해당 시트를, 지정하지 않으면 시트 목록을 보여줍니다.

다음 명령어를 Bash로 실행해서 결과를 사용자에게 보여주세요:

- 시트 목록 확인: `node scripts/fetch-sheet.mjs --list`
- 시트 조회: `node scripts/fetch-sheet.mjs "<시트이름>" --rows 10`
- 전체 조회: `node scripts/fetch-sheet.mjs "<시트이름>"`
- gid로 조회: `node scripts/fetch-sheet.mjs <gid>`

사용자 입력: $ARGUMENTS

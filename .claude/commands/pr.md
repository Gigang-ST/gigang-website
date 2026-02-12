현재 브랜치의 변경사항으로 Pull Request를 생성합니다.

사용자 입력: $ARGUMENTS

## 작업 순서

1. `git status`와 `git log main..HEAD --oneline`으로 변경 내역 파악
2. 커밋되지 않은 변경사항이 있으면 커밋 먼저 진행
3. `git push -u origin <현재브랜치>`로 원격에 푸시
4. `gh pr create`로 PR 생성:
   - 제목: 한글, 70자 이내
   - 본문: 변경 요약 + 테스트 계획
   - 베이스 브랜치: main

사용자가 PR 제목이나 설명을 지정하면 그대로 사용하고, 지정하지 않으면 커밋 내역을 기반으로 자동 작성하세요.

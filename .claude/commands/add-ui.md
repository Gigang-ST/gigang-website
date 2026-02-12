shadcn/ui 컴포넌트를 프로젝트에 추가합니다.

사용자 입력: $ARGUMENTS

## 설치 방법

```bash
pnpm dlx shadcn@latest add <컴포넌트명>
```

## 프로젝트 설정 (components.json)
- 스타일: new-york
- RSC: true
- 경로: `components/ui/`
- 유틸: `lib/utils.ts`의 `cn()`

## 작업 순서

1. 사용자가 지정한 컴포넌트를 설치
2. 설치 후 `pnpm typecheck`으로 타입 검사
3. 사용 예시를 간단히 보여주기

사용자가 컴포넌트명을 지정하지 않으면 shadcn/ui 문서를 안내하세요.

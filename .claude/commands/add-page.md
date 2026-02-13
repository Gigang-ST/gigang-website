새 페이지를 기존 패턴에 맞게 생성합니다.

사용자 입력: $ARGUMENTS

## 기존 페이지 패턴

이 프로젝트의 페이지는 두 가지 패턴을 따릅니다:

### 패턴 1: 히어로 배경 + 오버레이 (예: /rules)
```tsx
import HeroSection from "@/components/hero-section";

export default function PageName() {
  return (
    <HeroSection showHeroContent={false} showSliderNav={false} overlay={
      <div className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl text-white">
          {/* 페이지 콘텐츠 */}
        </div>
      </div>
    } />
  );
}
```

### 패턴 2: 독립 페이지 (예: /)
- `app/page.tsx` 참고

## 작업 순서

1. 사용자에게 페이지 경로와 콘텐츠 유형 확인
2. `app/<경로>/page.tsx` 생성
3. 인터랙티브 요소가 있으면 별도 클라이언트 컴포넌트를 `components/`에 생성
4. 네비게이션 추가가 필요하면 `config.ts`의 `navigation.items`에 항목 추가
5. `pnpm typecheck`으로 타입 검사

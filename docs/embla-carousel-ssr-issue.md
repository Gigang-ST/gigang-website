# Embla Carousel + Fade Plugin SSR 이슈

## 증상

- **Vercel(프로덕션)**: 정상 동작
- **로컬 dev / `pnpm start`**: 페이지 로드 시 슬라이드가 촤라락 지나가고 흰 슬라이드가 뜸

## 원인

**Embla Carousel은 공식적으로 SSR을 지원하지 않는다.**

Next.js App Router는 `"use client"` 컴포넌트도 서버에서 HTML을 먼저 렌더링한다. 이 시점에서 Embla는 초기화되지 않은 상태이고, `embla-carousel-fade` 플러그인의 opacity 스타일도 적용되지 않는다.

클라이언트에서 JS가 로드되면 Embla가 초기화되면서 모든 슬라이드의 위치와 opacity를 재조정하는데, 이 전환 과정에서 슬라이드가 순간적으로 모두 보이거나 (촤라락) 빈 슬라이드가 표시된다.

### Vercel에서는 왜 괜찮은가?

Vercel은 CDN + 엣지 서버 덕분에 JS 번들이 극히 빠르게 로드된다. SSR 렌더링 → Embla 초기화 사이의 시간이 1~2 프레임 수준이라 눈에 보이지 않는다. 로컬에서는 그 전환 시간이 길어서 육안으로 확인된다.

### 관련 공식 이슈

- [Loop: true causes layout shift · Issue #970](https://github.com/davidjerleke/embla-carousel/issues/970)
- [Fade | Embla Carousel 공식 문서](https://www.embla-carousel.com/plugins/fade/)

## 적용한 해결책

`hero-section.tsx`에 `mounted` 상태를 추가해, 클라이언트 마운트 이후에만 캐러셀을 표시한다.

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

// Carousel에 opacity 적용
<Carousel
  className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
  ...
>
```

- 마운트 전: `opacity-0` → 검은 배경만 보임 (`bg-black`)
- 마운트 후: 0.5초 페이드인으로 캐러셀 등장 → 촤라락 플래시 없음

## 참고: 더 강한 대안 (미적용)

`next/dynamic`으로 캐러셀 자체를 SSR에서 완전히 제외하는 방법도 있다.

```tsx
// page.tsx 또는 HeroSection을 사용하는 곳
import dynamic from 'next/dynamic'

const HeroSection = dynamic(() => import('@/components/hero-section'), {
  ssr: false,
  loading: () => <div className="h-screen w-full bg-black" />,
})
```

단점: 서버에서 hero 컴포넌트를 전혀 렌더링하지 않으므로 초기 HTML에 내용이 없어 SEO에 불리할 수 있다.

import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  if (!slug || !/^[\w.-]+$/.test(slug)) {
    return NextResponse.json(
      { error: "유효하지 않은 UTMB 슬러그입니다." },
      { status: 400 },
    );
  }

  const url = `https://utmb.world/en/runner/${encodeURIComponent(slug)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "러너를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const html = await res.text();
    const match = html.match(
      /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!match) {
      return NextResponse.json(
        { error: "UTMB 데이터를 파싱할 수 없습니다." },
        { status: 500 },
      );
    }

    const nextData = JSON.parse(match[1]);
    const pageProps = nextData?.props?.pageProps;

    if (!pageProps) {
      return NextResponse.json(
        { error: "UTMB 페이지 데이터가 없습니다." },
        { status: 500 },
      );
    }

    // UTMB Index: performanceIndexes 배열에서 general 카테고리
    const indexes = pageProps.performanceIndexes ?? [];
    const general = (indexes as { piCategory: string; index: number | null }[])
      .find((i) => i.piCategory === "general");
    const generalScore = general?.index ?? null;

    // 카테고리별 점수
    const scores = (indexes as { piCategory: string; index: number | null }[])
      .filter((i) => i.piCategory !== "general");

    // 최근 대회 결과: results.results 배열 (최대 5개)
    const resultsList = pageProps.results?.results ?? [];
    const recentRaces = (Array.isArray(resultsList) ? resultsList : [])
      .slice(0, 5)
      .map(
        (r: {
          race?: string;
          date?: string;
          dateIso?: string;
          distance?: string | number;
          elevationGain?: string | number;
          time?: string;
          rank?: number;
          totalRanked?: number;
        }) => ({
          eventName: r.race ?? "",
          date: r.dateIso ?? r.date ?? "",
          distance: r.distance ?? "",
          elevation: r.elevationGain ?? "",
          time: r.time ?? "",
          rank: r.rank ?? null,
          participants: r.totalRanked ?? null,
        }),
      );

    return NextResponse.json({
      name: pageProps.fullname ?? "",
      utmbIndex: generalScore,
      scores,
      recentRaces,
    });
  } catch {
    return NextResponse.json(
      { error: "UTMB 서버에 연결할 수 없습니다." },
      { status: 502 },
    );
  }
}

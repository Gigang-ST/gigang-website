"use server";

type UtmbProfile = {
	name: string;
	utmbIndex: number | null;
	scores: { piCategory: string; index: number | null }[];
	recentRaces: {
		eventName: string;
		date: string;
		distance: string | number;
		elevation: string | number;
		time: string;
		rank: number | null;
		participants: number | null;
	}[];
};

export async function getUtmbProfile(slug: string): Promise<UtmbProfile> {
	if (!slug || !/^[\w.-]+$/.test(slug)) {
		throw new Error("유효하지 않은 UTMB 슬러그입니다.");
	}

	const url = `https://utmb.world/en/runner/${encodeURIComponent(slug)}`;

	const res = await fetch(url, {
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			Accept: "text/html",
		},
		next: { revalidate: 86400 },
	});

	if (!res.ok) {
		throw new Error("러너를 찾을 수 없습니다.");
	}

	const html = await res.text();
	const match = html.match(
		/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
	);
	if (!match) {
		throw new Error("UTMB 데이터를 파싱할 수 없습니다.");
	}

	const nextData = JSON.parse(match[1]);
	const pageProps = nextData?.props?.pageProps;

	if (!pageProps) {
		throw new Error("UTMB 페이지 데이터가 없습니다.");
	}

	const indexes = pageProps.performanceIndexes ?? [];
	const general = (indexes as { piCategory: string; index: number | null }[]).find(
		(i) => i.piCategory === "general",
	);

	const scores = (indexes as { piCategory: string; index: number | null }[]).filter(
		(i) => i.piCategory !== "general",
	);

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

	return {
		name: pageProps.fullname ?? "",
		utmbIndex: general?.index ?? null,
		scores,
		recentRaces,
	};
}

import type {
	Member,
	MemberCreate,
	Competition,
	CompApplication,
	CompApplicationCreate,
	ActivityLog,
	ActivityLogCreate,
	PersonalBest,
	MemberUtmb,
	MemberUtmbCreate,
} from "./types";

const GAS_API_URL = process.env.GAS_API_URL;

type QueryParams = Record<string, string | number | boolean | undefined>;

type ListResponse<T> = { data: T[]; count: number };
type ItemResponse<T> = { data: T; message?: string };

async function gasGet<T>(
	table: string,
	params?: QueryParams,
	options?: { noCache?: boolean },
): Promise<ListResponse<T>> {
	if (!GAS_API_URL) {
		throw new Error("GAS_API_URL environment variable is not configured");
	}

	const url = new URL(GAS_API_URL);
	url.searchParams.set("table", table);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	const requestUrl = url.toString();
	console.log(`[GAS GET] ${requestUrl}`);

	const res = await fetch(requestUrl,
		options?.noCache
			? { cache: "no-store" }
			: { next: { revalidate: 300 } },
	);

	console.log(`[GAS GET] status=${res.status} redirected=${res.redirected} url=${res.url}`);

	if (!res.ok) {
		const raw = await res.text().catch(() => "");
		console.error(`[GAS GET] error response body:\n${raw}`);
		const parsed = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
		throw new Error(parsed.error || `API error: ${res.status} — ${raw.slice(0, 200)}`);
	}

	const json = await res.json();
	console.log(`[GAS GET] OK — count=${json.count ?? "n/a"}, data keys=${Object.keys(json)}`);

	// GAS API는 200 상태로 에러를 반환할 수 있음
	if (json.error) {
		throw new Error(json.error);
	}

	return json;
}

async function gasCreate<T>(
	table: string,
	data: unknown,
): Promise<ItemResponse<T>> {
	if (!GAS_API_URL) {
		throw new Error("GAS_API_URL environment variable is not configured");
	}

	const url = new URL(GAS_API_URL);
	url.searchParams.set("table", table);

	const requestUrl = url.toString();
	console.log(`[GAS CREATE] ${requestUrl}`, JSON.stringify(data));

	const res = await fetch(requestUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	console.log(`[GAS CREATE] status=${res.status} redirected=${res.redirected} url=${res.url}`);

	if (!res.ok) {
		const raw = await res.text().catch(() => "");
		console.error(`[GAS CREATE] error response body:\n${raw}`);
		const parsed = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
		throw new Error(parsed.error || `API error: ${res.status} — ${raw.slice(0, 200)}`);
	}

	const json = await res.json();
	if (json.error) {
		throw new Error(json.error);
	}

	return json;
}

// ── Member ──

export async function listMembers(params?: QueryParams) {
	return gasGet<Member>("member", params);
}

export async function createMember(data: MemberCreate) {
	return gasCreate<Member>("member", data);
}

// ── Competition ──

export async function listCompetitions(params?: QueryParams) {
	return gasGet<Competition>("competition", params);
}

// ── CompApplication ──

export async function listCompApplications(params?: QueryParams) {
	return gasGet<CompApplication>("comp_application", params);
}

export async function createCompApplication(data: CompApplicationCreate) {
	return gasCreate<CompApplication>("comp_application", data);
}

// ── ActivityLog ──

export async function listActivityLogs(params?: QueryParams) {
	return gasGet<ActivityLog>("activity_log", params);
}

export async function createActivityLog(data: ActivityLogCreate) {
	return gasCreate<ActivityLog>("activity_log", data);
}

// ── PersonalBest ──

export async function listPersonalBests(params?: QueryParams) {
	return gasGet<PersonalBest>("personal_best", params);
}

// ── MemberUtmb ──

export async function listMemberUtmbs(params?: QueryParams) {
	return gasGet<MemberUtmb>("member_utmb", params, { noCache: true });
}

export async function createMemberUtmb(data: MemberUtmbCreate) {
	return gasCreate<MemberUtmb>("member_utmb", data);
}

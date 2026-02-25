import type {
	Member,
	MemberCreate,
	Competition,
	CompApplication,
	CompApplicationCreate,
	ActivityLog,
	ActivityLogCreate,
	PersonalBest,
} from "./types";

const GAS_API_URL = process.env.GAS_API_URL;

type QueryParams = Record<string, string | number | boolean | undefined>;

type ListResponse<T> = { data: T[]; count: number };
type ItemResponse<T> = { data: T; message?: string };

async function gasGet<T>(
	table: string,
	params?: QueryParams,
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

	const res = await fetch(requestUrl, {
		next: { revalidate: 300 },
	});

	console.log(`[GAS GET] status=${res.status} redirected=${res.redirected} url=${res.url}`);

	if (!res.ok) {
		const raw = await res.text().catch(() => "");
		console.error(`[GAS GET] error response body:\n${raw}`);
		const parsed = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
		throw new Error(parsed.error || `API error: ${res.status} — ${raw.slice(0, 200)}`);
	}

	const json = await res.json();
	console.log(`[GAS GET] OK — count=${json.count ?? "n/a"}, data keys=${Object.keys(json)}`);
	return json;
}

async function gasGetById<T>(
	table: string,
	id: string,
	params?: QueryParams,
): Promise<ItemResponse<T>> {
	if (!GAS_API_URL) {
		throw new Error("GAS_API_URL environment variable is not configured");
	}

	const url = new URL(GAS_API_URL);
	url.searchParams.set("table", table);
	url.searchParams.set("id", id);
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) {
				url.searchParams.set(key, String(value));
			}
		}
	}

	const requestUrl = url.toString();
	console.log(`[GAS GET_BY_ID] ${requestUrl}`);

	const res = await fetch(requestUrl, {
		next: { revalidate: 300 },
	});

	console.log(`[GAS GET_BY_ID] status=${res.status} redirected=${res.redirected} url=${res.url}`);

	if (!res.ok) {
		const raw = await res.text().catch(() => "");
		console.error(`[GAS GET_BY_ID] error response body:\n${raw}`);
		const parsed = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
		throw new Error(parsed.error || `API error: ${res.status} — ${raw.slice(0, 200)}`);
	}

	return res.json();
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

	return res.json();
}

async function gasPatch<T>(
	table: string,
	id: string,
	data: unknown,
): Promise<ItemResponse<T>> {
	if (!GAS_API_URL) {
		throw new Error("GAS_API_URL environment variable is not configured");
	}

	const url = new URL(GAS_API_URL);
	url.searchParams.set("table", table);
	url.searchParams.set("id", id);
	url.searchParams.set("_method", "PATCH");

	const requestUrl = url.toString();
	console.log(`[GAS PATCH] ${requestUrl}`, JSON.stringify(data));

	const res = await fetch(requestUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	console.log(`[GAS PATCH] status=${res.status} redirected=${res.redirected} url=${res.url}`);

	if (!res.ok) {
		const raw = await res.text().catch(() => "");
		console.error(`[GAS PATCH] error response body:\n${raw}`);
		const parsed = (() => { try { return JSON.parse(raw); } catch { return {}; } })();
		throw new Error(parsed.error || `API error: ${res.status} — ${raw.slice(0, 200)}`);
	}

	return res.json();
}

// ── Member ──

export async function listMembers(params?: QueryParams) {
	return gasGet<Member>("member", params);
}

export async function getMember(id: string) {
	return gasGetById<Member>("member", id);
}

export async function createMember(data: MemberCreate) {
	return gasCreate<Member>("member", data);
}

// ── Competition ──

export async function listCompetitions(params?: QueryParams) {
	return gasGet<Competition>("competition", params);
}

export async function getCompetition(id: string) {
	return gasGetById<Competition>("competition", id);
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

export async function patchActivityLog(
	id: string,
	data: Partial<ActivityLog>,
) {
	return gasPatch<ActivityLog>("activity_log", id, data);
}

// ── PersonalBest ──

export async function listPersonalBests(params?: QueryParams) {
	return gasGet<PersonalBest>("personal_best", params);
}

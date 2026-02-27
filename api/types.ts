// ──────────────────────────────────────────────
// API Entity Types (matching schema2sheet OpenAPI)
// ──────────────────────────────────────────────

export type Member = {
	id: string;
	full_name: string;
	gender: string;
	birthday: string;
	phone: string;
	status: string;
	account_number?: string;
	admin: boolean;
	joined_at: string;
	created_at: string;
	updated_at: string;
	note?: string;
};

export type Competition = {
	id: string;
	competition_type: string;
	competition_name: string;
	competition_class: string;
	distance_km: number;
	pb_key: string;
	competition_date: string;
	created_at: string;
	updated_at: string;
};

export type CompApplication = {
	id: string;
	member_id: string;
	full_name: string;
	competition_id: string;
	competition_name: string;
	competition_class: string;
	status: string;
	pledge?: string;
	created_at: string;
	updated_at: string;
};

export type ActivityLog = {
	id: string;
	member_id: string;
	full_name: string;
	activity_date: string;
	activity_type: string;
	distance_km: number;
	duration_sec: number;
	duration_hhmmss: string;
	event_id?: string;
	event_name?: string;
	competition_id?: string;
	competition_name?: string;
	competition_class?: string;
	elevation_gain_m?: number;
	created_at: string;
	updated_at: string;
};

export type PersonalBest = {
	id: string;
	member_id: string;
	full_name: string;
	pb_key: string;
	best_time_sec: number;
	best_time_hhmmss: string;
	best_date: string;
	source_type: string;
	source_ref_id?: string;
	competition_name?: string;
	updated_at: string;
};

export type MemberUtmb = {
	member_id: string;
	utmb_key: string;
};

// ──────────────────────────────────────────────
// Create input types (for POST)
// ──────────────────────────────────────────────

export type MemberCreate = {
	full_name: string;
	gender: string;
	birthday: string;
	phone: string;
	status: string;
	account_number?: string;
	admin?: boolean;
	joined_at?: string;
	note?: string;
};

export type CompApplicationCreate = {
	member_id: string;
	full_name: string;
	competition_id: string;
	competition_name: string;
	competition_class: string;
	status: string;
	pledge?: string;
};

export type ActivityLogCreate = {
	member_id: string;
	full_name: string;
	activity_date: string;
	activity_type: string;
	distance_km: number;
	duration_sec: number;
	duration_hhmmss: string;
	event_id?: string;
	event_name?: string;
	competition_id?: string;
	competition_name?: string;
	competition_class?: string;
	elevation_gain_m?: number;
};

export type MemberUtmbCreate = {
	member_id: string;
	utmb_key: string;
};

// ──────────────────────────────────────────────
// UI Composite Types (derived, not from API)
// ──────────────────────────────────────────────

export type RaceCourse = {
	competition_id: string;
	competition_class: string;
};

export type Race = {
	id: string;
	date: string;
	name: string;
	type: string;
	courses: RaceCourse[];
	participants: CompApplication[];
	records: ActivityLog[];
	isPast: boolean;
};

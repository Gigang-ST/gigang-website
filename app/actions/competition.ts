"use server";

import { listCompetitions } from "@/api/client";
import type { Competition } from "@/api/types";

export async function getCompetitions(): Promise<Competition[]> {
	const res = await listCompetitions();
	return res.data;
}

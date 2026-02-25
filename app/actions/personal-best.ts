"use server";

import { listPersonalBests } from "@/api/client";
import type { PersonalBest } from "@/api/types";

export async function getPersonalBests(): Promise<PersonalBest[]> {
	const res = await listPersonalBests();
	return res.data;
}

"use server";

import {
	listCompApplications,
	createCompApplication as apiCreate,
} from "@/api/client";
import type { CompApplication, CompApplicationCreate } from "@/api/types";

export async function getCompApplications(): Promise<CompApplication[]> {
	const res = await listCompApplications();
	return res.data;
}

export async function createCompApplication(
	data: CompApplicationCreate,
): Promise<CompApplication> {
	const res = await apiCreate(data);
	return res.data;
}

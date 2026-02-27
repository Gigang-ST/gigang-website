"use server";

import {
	listActivityLogs,
	createActivityLog as apiCreate,
} from "@/api/client";
import type { ActivityLog, ActivityLogCreate } from "@/api/types";

export async function getActivityLogs(): Promise<ActivityLog[]> {
	const res = await listActivityLogs();
	return res.data;
}

export async function createActivityLog(
	data: ActivityLogCreate,
): Promise<ActivityLog> {
	const res = await apiCreate(data);
	return res.data;
}

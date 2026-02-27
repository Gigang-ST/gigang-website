"use server";

import {
	listMemberUtmbs,
	createMemberUtmb as apiCreateMemberUtmb,
} from "@/api/client";
import type { MemberUtmb, MemberUtmbCreate } from "@/api/types";

export async function getMemberUtmbs(): Promise<MemberUtmb[]> {
	const res = await listMemberUtmbs();
	return res.data;
}

export async function createMemberUtmb(
	data: MemberUtmbCreate,
): Promise<MemberUtmb> {
	const res = await apiCreateMemberUtmb(data);
	return res.data;
}

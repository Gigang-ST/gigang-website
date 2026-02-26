"use server";

import {
	listMemberUtmbs,
	getMemberUtmb as apiGetMemberUtmb,
	createMemberUtmb as apiCreateMemberUtmb,
} from "@/api/client";
import type { MemberUtmb, MemberUtmbCreate } from "@/api/types";

export async function getMemberUtmbs(): Promise<MemberUtmb[]> {
	const res = await listMemberUtmbs();
	return res.data;
}

export async function getMemberUtmb(memberId: string): Promise<MemberUtmb> {
	const res = await apiGetMemberUtmb(memberId);
	return res.data;
}

export async function createMemberUtmb(
	data: MemberUtmbCreate,
): Promise<MemberUtmb> {
	const res = await apiCreateMemberUtmb(data);
	return res.data;
}

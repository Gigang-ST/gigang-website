"use server";

import { listMembers, createMember as apiCreateMember } from "@/api/client";
import type { Member, MemberCreate } from "@/api/types";

export async function getMembers(): Promise<Member[]> {
	const res = await listMembers();
	return res.data;
}

export async function createMember(data: MemberCreate): Promise<Member> {
	const res = await apiCreateMember(data);
	return res.data;
}

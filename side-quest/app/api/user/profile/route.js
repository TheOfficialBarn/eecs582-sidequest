/*
	Name: User Profile API endpoint
	Description: Retrieves and updates authenticated user profile information.
	Programmers: Liam Aga
	Date: 2/15/2026
	Revisions: Initial profile fetch and update - 2/15/2026
	Errors: 401 Unauthorized, 404 User not found, 500 Update failure

	Input:
		GET: Authenticated request (session cookie "sid")
		PATCH: JSON { profile_picture_url }

	Output:
		GET: { user }
		PATCH: { ok: true }
*/

import { verifyToken } from "../../../../lib/auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

export async function PATCH(req) {
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));
	const token = match?.split("=")[1];

	const userPayload = token ? verifyToken(token) : null;

	if (!userPayload) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
	}

	const body = await req.json();
	const { profile_picture_url } = body;

	const supabase = createAdminClient();

	const { error } = await supabase
		.from("users")
		.update({ profile_picture_url })
		.eq("user_id", userPayload.id);

	if (error) {
		console.error("Error updating profile:", error);
		return new Response(JSON.stringify({ message: "Failed to update profile" }), { status: 500 });
	}

	return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function GET(req) {
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));
	const token = match?.split("=")[1];

	const userPayload = token ? verifyToken(token) : null;

	if (!userPayload) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
	}

	const supabase = createAdminClient();
	const { data: user, error } = await supabase
		.from("users")
		.select("profile_picture_url, name, email")
		.eq("user_id", userPayload.id)
		.single();

	if (error) {
		return new Response(JSON.stringify({ message: "User not found" }), { status: 404 });
	}

	return new Response(JSON.stringify({ user }), { status: 200 });
}


import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));
	const token = match?.split("=")[1];
	const user = token ? verifyToken(token) : null;

	if (!user || !user.is_admin) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { user_email, points } = await req.json().catch(() => ({}));

	if (!user_email || points === undefined) {
		return NextResponse.json({ error: "Missing user_email or points" }, { status: 400 });
	}

	const supabase = createAdminClient();

	// Find user by email
	const { data: targetUser, error: userError } = await supabase
		.from("users")
		.select("user_id, points")
		.eq("email", user_email)
		.single();

	if (userError || !targetUser) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	// Update points
	await supabase.rpc('increment_points', {
		user_id: targetUser.user_id,
		amount: parseInt(points)
	});

	return NextResponse.json({ success: true, new_points: (targetUser.points || 0) + parseInt(points) });
}

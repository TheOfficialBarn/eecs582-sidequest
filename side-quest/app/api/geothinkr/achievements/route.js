/*
	Name: geothinkr/achievements/route.js
	Description: Returns the authenticated user's earned GeoThinkr achievements.
	Programmers: Pashia Vang
	Date: 2/19/2026
	Revisions: N/A
	Errors: 401 Unauthorized, 500 Server error
	Input: GET request with authenticated session cookie
	Output: JSON array of { achievement_id, key, name, description, icon, earned_at }
*/

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/auth";

/*
	Function: getUser
	Description: Extracts and verifies the user from the session cookie.
	Arguments: req - incoming request
	Returns: user object or null
*/
function getUser(req) {
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));
	const token = match?.split("=")[1];
	return token ? verifyToken(token) : null;
}

/*
	Function: GET
	Description: Returns all achievements with earned status for the user.
	Arguments: req - incoming GET request
	Returns: JSON array of achievements with earned_at (null if not yet earned)
*/
export async function GET(req) {
	const user = getUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const supabase = createAdminClient();

	// Get all achievements
	const { data: allAchievements, error: achError } = await supabase
		.from("achievements")
		.select("achievement_id, key, name, description, icon");

	if (achError) return NextResponse.json({ error: achError.message }, { status: 500 });

	// Get user's earned achievements
	const { data: earned, error: earnedError } = await supabase
		.from("user_achievements")
		.select("achievement_id, earned_at")
		.eq("user_id", user.id);

	if (earnedError) return NextResponse.json({ error: earnedError.message }, { status: 500 });

	const earnedMap = {};
	earned?.forEach(e => { earnedMap[e.achievement_id] = e.earned_at; });

	const result = allAchievements.map(a => ({
		...a,
		earned_at: earnedMap[a.achievement_id] || null
	}));

	return NextResponse.json(result);
}

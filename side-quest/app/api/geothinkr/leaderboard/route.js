/*
	Name: geothinkr/leaderboard/route.js
	Description: Returns GeoThinkr leaderboard - top players by total points earned.
	Programmers: Pashia Vang
	Date: 2/19/2026
	Revisions: N/A
	Errors: 401 Unauthorized, 500 Server error
	Input: GET request with authenticated session cookie
	Output: JSON array of { user_id, name, total_points, total_games, spot_ons }
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
	Description: Returns top GeoThinkr players ranked by total points.
	Arguments: req - incoming GET request
	Returns: JSON array of leaderboard entries
*/
export async function GET(req) {
	const user = getUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const supabase = createAdminClient();

	// Fetch all history with user names
	const { data: history, error } = await supabase
		.from("geothinkr_history")
		.select("user_id, points_awarded, users(name, profile_picture_url)");

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	// Aggregate by user
	const userMap = {};
	history?.forEach(h => {
		const uid = h.user_id;
		if (!userMap[uid]) {
			const u = Array.isArray(h.users) ? h.users[0] : h.users;
			userMap[uid] = {
				user_id: uid,
				name: u?.name || "Unknown",
				profile_picture_url: u?.profile_picture_url || null,
				total_points: 0,
				total_games: 0,
				spot_ons: 0
			};
		}
		userMap[uid].total_points += h.points_awarded;
		userMap[uid].total_games += 1;
		if (h.points_awarded >= 500) userMap[uid].spot_ons += 1;
	});

	const leaderboard = Object.values(userMap)
		.sort((a, b) => b.total_points - a.total_points)
		.slice(0, 50);

	return NextResponse.json(leaderboard);
}

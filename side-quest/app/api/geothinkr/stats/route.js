/*
	Name: geothinkr/stats/route.js
	Description: Returns GeoThinkr statistics for the authenticated user.
	Programmers: Pashia Vang
	Date: 2/19/2026
	Revisions: N/A
	Errors: 401 Unauthorized, 500 Server error
	Input: GET request with authenticated session cookie
	Output: JSON { total_games, spot_ons, total_points, accuracy_percent }
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
	Description: Fetches aggregated GeoThinkr stats for the authenticated user.
	Arguments: req - incoming GET request
	Returns: JSON with total_games, spot_ons, total_points, accuracy_percent
*/
export async function GET(req) {
	const user = getUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const supabase = createAdminClient();

	const { data: history, error } = await supabase
		.from("geothinkr_history")
		.select("points_awarded")
		.eq("user_id", user.id);

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	const totalGames = history?.length || 0;
	const spotOns = history?.filter(h => h.points_awarded >= 500).length || 0;
	const totalPoints = history?.reduce((sum, h) => sum + h.points_awarded, 0) || 0;
	const accuracyPercent = totalGames > 0 ? Math.round((spotOns / totalGames) * 100) : 0;

	return NextResponse.json({
		total_games: totalGames,
		spot_ons: spotOns,
		total_points: totalPoints,
		accuracy_percent: accuracyPercent
	});
}

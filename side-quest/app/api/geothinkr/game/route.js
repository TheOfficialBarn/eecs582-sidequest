/*
	Name: GeoThinkr Game API endpoint
	Description: Serves random unplayed photos and processes user guesses with scoring,
	             hints deduction, difficulty-based thresholds, and achievement checks.
	Programmers: Liam Aga
	Date: 2/15/2025
	Revisions: Integrated scoring + history tracking - 11/06/2025,
	           Added difficulty filter, hints, verified filter, achievements - 2/19/2026
	Errors: 401 Unauthorized, 404 Not found, 409 Already played, 500 Server error

	Input:
		GET: Authenticated request (session cookie "sid")
		POST: JSON { photo_id, x, y, hints_used?, difficulty? }

	Output:
		GET: { photo_id, image_url, location_name, category }
		POST: { distance, points, tier, correct_x, correct_y, location_name, category, achievements_earned }
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
	Function: getScoringThresholds
	Description: Returns scoring distance thresholds based on difficulty level.
	Arguments: difficulty - "easy", "medium", or "hard"
	Returns: { spotOnRadius, closeRadius } in pixels
*/
function getScoringThresholds(difficulty) {
	switch (difficulty) {
		case "easy": return { spotOnRadius: 100, closeRadius: 300 };
		case "medium": return { spotOnRadius: 75, closeRadius: 200 };
		case "hard": return { spotOnRadius: 50, closeRadius: 150 };
		default: return { spotOnRadius: 100, closeRadius: 300 };
	}
}

/*
	Function: checkAndAwardAchievements
	Description: Checks achievement conditions and awards any newly earned achievements.
	Arguments: supabase - admin client, userId - user UUID, latestTier - tier from current guess, hintsUsed - number of hints used
	Returns: array of newly earned achievement names
*/
async function checkAndAwardAchievements(supabase, userId, latestTier, hintsUsed) {
	const newlyEarned = [];

	// Get all achievements
	const { data: allAchievements } = await supabase
		.from("achievements")
		.select("achievement_id, key");

	if (!allAchievements) return newlyEarned;

	// Get already-earned achievements
	const { data: earned } = await supabase
		.from("user_achievements")
		.select("achievement_id")
		.eq("user_id", userId);

	const earnedIds = new Set(earned?.map(e => e.achievement_id) || []);
	const achievementByKey = {};
	allAchievements.forEach(a => { achievementByKey[a.key] = a; });

	// Get user's full history for counting
	const { data: history } = await supabase
		.from("geothinkr_history")
		.select("points_awarded, created_at, photo_id, geothinkr_photos(category)")
		.eq("user_id", userId)
		.order("created_at", { ascending: true });

	const totalGames = history?.length || 0;
	const spotOns = history?.filter(h => h.points_awarded >= 500).length || 0;

	// Helper to award if not already earned
	async function tryAward(key) {
		const ach = achievementByKey[key];
		if (!ach || earnedIds.has(ach.achievement_id)) return;
		await supabase.from("user_achievements").insert([{
			user_id: userId,
			achievement_id: ach.achievement_id
		}]);
		newlyEarned.push(ach.key);
		earnedIds.add(ach.achievement_id);
	}

	// first_guess: completed first round
	if (totalGames >= 1) await tryAward("first_guess");

	// games_10
	if (totalGames >= 10) await tryAward("games_10");

	// games_50
	if (totalGames >= 50) await tryAward("games_50");

	// spot_on_5
	if (spotOns >= 5) await tryAward("spot_on_5");

	// spot_on_10
	if (spotOns >= 10) await tryAward("spot_on_10");

	// no_hints: got spot-on without using any hints
	if (latestTier === "Spot-on!" && hintsUsed === 0) await tryAward("no_hints");

	// perfect_streak_3: last 3 games all spot-on
	if (history && history.length >= 3) {
		const lastThree = history.slice(-3);
		if (lastThree.every(h => h.points_awarded >= 500)) {
			await tryAward("perfect_streak_3");
		}
	}

	// all_categories: played at least one photo from every category
	if (history) {
		const playedCategories = new Set();
		history.forEach(h => {
			const photos = Array.isArray(h.geothinkr_photos) ? h.geothinkr_photos : [h.geothinkr_photos];
			photos.forEach(p => { if (p?.category) playedCategories.add(p.category); });
		});
		const allCategories = ["landmark", "building", "nature", "statue", "other"];
		if (allCategories.every(c => playedCategories.has(c))) {
			await tryAward("all_categories");
		}
	}

	return newlyEarned;
}

/*
	Function: GET
	Description: Returns a random unplayed verified photo.
	Arguments: req - incoming GET request
	Returns: JSON with photo data
*/
export async function GET(req) {
	const user = getUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const supabase = createAdminClient();

	// 1. Get user's play history
	const { data: history, error: historyError } = await supabase
		.from("geothinkr_history")
		.select("photo_id")
		.eq("user_id", user.id);

	if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 });

	const playedIds = new Set(history.map(h => h.photo_id));

	// 2. Get all verified photos (difficulty only affects scoring/zoom, not photo selection)
	const { data: photos, error } = await supabase
		.from("geothinkr_photos")
		.select("photo_id, image_url, location_name, category")
		.eq("verified", true);

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	const unplayedPhotos = photos.filter(p => !playedIds.has(p.photo_id));

	if (!unplayedPhotos || unplayedPhotos.length === 0) {
		return NextResponse.json({ error: "No photos available" }, { status: 404 });
	}

	const randomPhoto = unplayedPhotos[Math.floor(Math.random() * unplayedPhotos.length)];
	return NextResponse.json(randomPhoto);
}

/*
	Function: POST
	Description: Processes a user's guess, calculates score with hint deductions,
	             records history, and checks for new achievements.
	Arguments: req - incoming POST request with JSON body
	Returns: JSON with result data including achievements earned
*/
export async function POST(req) {
	const user = getUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json().catch(() => ({}));
	const { photo_id, x, y, hints_used = 0, difficulty = "easy" } = body;

	if (!photo_id || x === undefined || y === undefined) {
		return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
	}

	const supabase = createAdminClient();

	// Check if already played (prevent double submission)
	const { data: existing } = await supabase
		.from("geothinkr_history")
		.select("history_id")
		.eq("user_id", user.id)
		.eq("photo_id", photo_id)
		.single();

	if (existing) {
		return NextResponse.json({ error: "Already played" }, { status: 409 });
	}

	// Fetch the target photo to get real coords
	const { data: photo, error } = await supabase
		.from("geothinkr_photos")
		.select("x_coordinate, y_coordinate, location_name, category")
		.eq("photo_id", photo_id)
		.single();

	if (error || !photo) {
		return NextResponse.json({ error: "Photo not found" }, { status: 404 });
	}

	// Calculate distance
	const dx = photo.x_coordinate - x;
	const dy = photo.y_coordinate - y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	// Scoring with difficulty-based thresholds
	const { spotOnRadius, closeRadius } = getScoringThresholds(difficulty);

	let basePoints = 0;
	let tier = "Nope";

	if (distance <= spotOnRadius) {
		basePoints = 500;
		tier = "Spot-on!";
	} else if (distance <= closeRadius) {
		basePoints = 200;
		tier = "Close enough";
	} else {
		basePoints = 0;
		tier = "Nope";
	}

	// Deduct hint cost: each hint costs 100 points from base score
	const hintDeduction = Math.min(hints_used * 100, basePoints);
	const points = Math.max(basePoints - hintDeduction, 0);

	// Award points if > 0
	if (points > 0) {
		await supabase.rpc('increment_points', {
			user_id: user.id,
			amount: points
		});
	}

	// Record history
	await supabase.from("geothinkr_history").insert([{
		user_id: user.id,
		photo_id: photo_id,
		points_awarded: points
	}]);

	// Check and award achievements
	const achievementsEarned = await checkAndAwardAchievements(supabase, user.id, tier, hints_used);

	// Return result including the correct location so client can draw the line
	return NextResponse.json({
		distance,
		points,
		tier,
		correct_x: photo.x_coordinate,
		correct_y: photo.y_coordinate,
		location_name: photo.location_name,
		category: photo.category,
		achievements_earned: achievementsEarned
	});
}

/*
	Name: Progress API endpoint
	Description: Gets and saves user quest progress.
	Programmers: Pashia Vang
	Date: 11/06/2025
	Revisions: Comment engineering - Aiden 11/23/2025
	Errors: N/A
	Input:  User authentication cookie and quest progress data  
	Output:  Updated or retrieved quest progress information
*/

import { verifyToken } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";

// Helper function to get user from request
function getUserFromRequest(req) {
	// Read the raw cookie header (if present) and find the `sid` cookie.
	// The code expects a session token stored as `sid=<token>`.
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));

	// Extract the token value and verify it. `verifyToken` returns the
	// decoded user object on success or null/throws on failure depending
	// on implementation in `lib/auth`.
	const token = match?.split("=")[1];
	return token ? verifyToken(token) : null;
}

// GET: Retrieve all progress for the current user
export async function GET(req) {
	const user = getUserFromRequest(req);

	if (!user) {
		return new Response(
			JSON.stringify({ message: "Unauthorized" }),
			{ status: 401, headers: { "Content-Type": "application/json" } }
		);
	}

	const supabase = createAdminClient();

	// Get all progress records for this user, including quest and location info
	const { data: progress, error } = await supabase
		.from("progress")
		.select(`
			progress_id,
			quest_id,
			completed,
			completed_at,
			quests (
				quest_id,
				text,
				location_id,
				locations (
					location_id,
					name
				)
			)
		`)
		.eq("user_id", user.id);

	if (error) {
		return new Response(
			JSON.stringify({ message: "Failed to fetch progress", error: error.message }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}

	// Supabase returns joined relationships in nested structures. Convert
	// the DB representation into a simpler, deterministic map for the
	// client UI: { [locationName]: { [questText]: { completed, completed_at, quest_id }}}.
	const progressMap = {};
	progress?.forEach(p => {
		// Depending on how the relationship was returned, `p.quests` may be
		// an array (when using `.select()` with relationships) or a single
		// object. Prefer the first element when an array is present.
		const quest = Array.isArray(p.quests) ? p.quests[0] : p.quests;
		if (!quest) return;

		// Same for nested `locations` relationship.
		const location = Array.isArray(quest.locations) ? quest.locations[0] : quest.locations;
		if (!location) return;

		const locationName = location.name;
		const questText = quest.text;

		if (!progressMap[locationName]) {
			progressMap[locationName] = {};
		}

		// Store only the fields the client needs. Using `quest_id` lets the
		// client refer back to the specific quest when needed.
		progressMap[locationName][questText] = {
			completed: p.completed,
			completed_at: p.completed_at,
			quest_id: p.quest_id
		};
	});

	return new Response(
		JSON.stringify({ progress: progressMap }),
		{ status: 200, headers: { "Content-Type": "application/json" } }
	);
}

// POST: Save or update quest progress
export async function POST(req) {
	const user = getUserFromRequest(req);

	if (!user) {
		return new Response(
			JSON.stringify({ message: "Unauthorized" }),
			{ status: 401, headers: { "Content-Type": "application/json" } }
		);
	}

	const body = await req.json();
	const { location_name, quest_text, completed } = body;

	if (!location_name || !quest_text || typeof completed !== "boolean") {
		return new Response(
			JSON.stringify({ message: "Missing required fields: location_name, quest_text, completed" }),
			{ status: 400, headers: { "Content-Type": "application/json" } }
		);
	}

	const supabase = createAdminClient();

	// First, find the location_id by name
	const { data: location, error: locationError } = await supabase
		.from("locations")
		.select("location_id")
		.eq("name", location_name)
		.single();

	if (locationError || !location) {
		return new Response(
			JSON.stringify({ message: "Location not found", error: locationError?.message }),
			{ status: 404, headers: { "Content-Type": "application/json" } }
		);
	}

	// Then find the quest_id by location_id and quest text
	const { data: quest, error: questError } = await supabase
		.from("quests")
		.select("quest_id, is_multiplayer, reward_points")
		.eq("location_id", location.location_id)
		.eq("text", quest_text)
		.single();

	if (questError || !quest) {
		return new Response(
			JSON.stringify({ message: "Quest not found", error: questError?.message }),
			{ status: 404, headers: { "Content-Type": "application/json" } }
		);
	}

	// Check if progress record already exists
	const { data: existingProgress } = await supabase
		.from("progress")
		.select("progress_id")
		.eq("user_id", user.id)
		.eq("quest_id", quest.quest_id)
		.single();

	const now = new Date().toISOString();
	const progressData = {
		user_id: user.id,
		quest_id: quest.quest_id,
		completed: completed,
		updated_at: now
	};

	if (completed) {
		progressData.completed_at = now;
	} else {
		progressData.completed_at = null;
	}

	let result;
	if (existingProgress) {
		// Update existing progress
		const { data, error } = await supabase
			.from("progress")
			.update(progressData)
			.eq("progress_id", existingProgress.progress_id)
			.select()
			.single();

		result = { data, error };
	} else {
		// Insert new progress
		const { data, error } = await supabase
			.from("progress")
			.insert([progressData])
			.select()
			.single();

		result = { data, error };
	}

	// Send error response if something went wrong. The client will see a notification.
	if (result.error) {
		return new Response(
			JSON.stringify({ message: "Failed to save progress", error: result.error.message }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}

	// Try to claim quest (handles multiplayer logic)
	// If it's a multiplayer quest, this RPC returns false if already claimed.
	// If it's a normal quest, it returns true immediately.
	const { data: claimSuccess, error: claimError } = await supabase.rpc('claim_quest', {
		p_quest_id: quest.quest_id,
		p_user_id: user.id
	});

	if (claimError) {
		console.error("RPC Error:", claimError);
		// If RPC fails (e.g. function doesn't exist), fall back to normal flow below
	} else if (claimSuccess === false) {
		// Only happens if multiplayer quest is already won by someone else
		return new Response(
			JSON.stringify({ message: "This quest has already been claimed by another player!" }),
			{ status: 409, headers: { "Content-Type": "application/json" } }
		);
	}

	// Calculate points to award (default 100 if not specified in quest)
	const pointsToAward = quest.reward_points || 100;

	// Award points if completing the quest for the first time
	// Note: If claim_quest RPC succeeded for a multiplayer quest, points are ALREADY awarded by the RPC.
	// We need to avoid double counting.
	const isMultiplayer = quest.is_multiplayer;

	if (!isMultiplayer && completed && (!existingProgress || !existingProgress.completed)) {
		// Increment points for NORMAL quests
		const { error: pointsError } = await supabase.rpc('increment_points', {
			user_id: user.id,
			amount: pointsToAward
		});

		// Fallback to direct update if RPC doesn't exist
		if (pointsError) {
			const { data: userData } = await supabase
				.from('users')
				.select('points')
				.eq('user_id', user.id)
				.single();

			const currentPoints = userData?.points || 0;
			await supabase
				.from('users')
				.update({ points: currentPoints + pointsToAward })
				.eq('user_id', user.id);
		}
	}

	// Success.
	return new Response(
		JSON.stringify({ success: true, progress: result.data }),
		{ status: 200, headers: { "Content-Type": "application/json" } }
	);
}



import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/auth";

// Helper to get user
function getUser(req) {
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));
	const token = match?.split("=")[1];
	return token ? verifyToken(token) : null;
}

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

	// 2. Get all photos and filter out played ones
	const { data: photos, error } = await supabase
		.from("geothinkr_photos")
		.select("photo_id, image_url, location_name");

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	const unplayedPhotos = photos.filter(p => !playedIds.has(p.photo_id));

	if (!unplayedPhotos || unplayedPhotos.length === 0) {
		return NextResponse.json({ error: "No photos available" }, { status: 404 });
	}

	const randomPhoto = unplayedPhotos[Math.floor(Math.random() * unplayedPhotos.length)];
	return NextResponse.json(randomPhoto);
}

export async function POST(req) {
	const user = getUser(req);
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await req.json().catch(() => ({}));
	const { photo_id, x, y } = body;

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
		.select("x_coordinate, y_coordinate, location_name")
		.eq("photo_id", photo_id)
		.single();

	if (error || !photo) {
		return NextResponse.json({ error: "Photo not found" }, { status: 404 });
	}

	// Calculate distance
	const dx = photo.x_coordinate - x;
	const dy = photo.y_coordinate - y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	// Scoring logic (pixels)
	// Map is ~1600px wide.
	// Spot on: within 100px?
	// Close: within 300px?
	// Nope: > 300

	let points = 0;
	let tier = "Nope";

	if (distance <= 100) {
		points = 500;
		tier = "Spot-on!";
	} else if (distance <= 300) {
		points = 200;
		tier = "Close enough";
	} else {
		points = 0;
		tier = "Nope";
	}

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

	// Return result including the correct location so client can draw the line
	return NextResponse.json({
		distance,
		points,
		tier,
		correct_x: photo.x_coordinate,
		correct_y: photo.y_coordinate,
		location_name: photo.location_name
	});
}

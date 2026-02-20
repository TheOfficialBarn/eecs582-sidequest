/*
	Name: page.js
	Description: Page to view leaderboard of global user progress with Quest and GeoThinkr tabs.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: Update UI style - 10/26/2025, Add functional list of user rankings - 11/22/2025,
	           Merged GeoThinkr leaderboard into tabbed view - 2/19/2026
	Errors: N/A
	Input: Global user progress data and GeoThinkr history from the server
	Output: Leaderboard page displaying user rankings for quests and GeoThinkr

*/
import { createAdminClient } from "@/lib/supabase/admin";
import LeaderboardTabs from "./LeaderboardTabs";

export default async function LeaderboardsPage() {
	const supabase = createAdminClient();

	// --- Quest Leaderboard Data ---
	const { data: rows, error: rowsErr } = await supabase
		.from("progress")
		.select("user_id")
		.eq("completed", true);

	if (rowsErr) {
		console.error("Failed to load progress:", rowsErr);
		return (
			<div className="max-w-6xl mx-auto p-8">
				<h2 className="text-3xl font-bold mb-4 text-[#FF7A00]">Leaderboard</h2>
				<p className="text-red-600">Failed to load leaderboard data.</p>
			</div>
		);
	}

	// Count completed quests per user
	const counts = {};
	for (const r of rows || []) {
		const id = String(r.user_id ?? "unknown");
		counts[id] = (counts[id] || 0) + 1;
	}

	// Create sorted top-20 list
	const sorted = Object.entries(counts)
		.map(([userId, completedCount]) => ({ userId, completedCount }))
		.sort((a, b) => b.completedCount - a.completedCount)
		.slice(0, 20);

	// Fetch user names for quest leaderboard
	const questUserIds = sorted.map(s => s.userId);
	let questUsers = [];
	if (questUserIds.length > 0) {
		const { data: profiles } = await supabase
			.from("users")
			.select("user_id, name")
			.in("user_id", questUserIds);
		questUsers = profiles?.map(p => ({
			id: p.user_id,
			name: p.name || p.id,
		})) || [];
	}

	const usersById = Object.fromEntries(questUsers.map(u => [String(u.id), u]));

	const questLeaders = sorted.map(row => ({
		userId: row.userId,
		displayName: usersById[row.userId]?.name || row.userId,
		completedCount: row.completedCount,
	}));

	// --- GeoThinkr Leaderboard Data ---
	const { data: geoHistory, error: geoErr } = await supabase
		.from("geothinkr_history")
		.select("user_id, points_awarded, users(name)");

	let geoLeaders = [];
	if (!geoErr && geoHistory) {
		const userMap = {};
		geoHistory.forEach(h => {
			const uid = h.user_id;
			if (!userMap[uid]) {
				const u = Array.isArray(h.users) ? h.users[0] : h.users;
				userMap[uid] = {
					userId: uid,
					name: u?.name || "Unknown",
					totalPoints: 0,
					totalGames: 0,
					spotOns: 0,
				};
			}
			userMap[uid].totalPoints += h.points_awarded;
			userMap[uid].totalGames += 1;
			if (h.points_awarded >= 500) userMap[uid].spotOns += 1;
		});

		geoLeaders = Object.values(userMap)
			.sort((a, b) => b.totalPoints - a.totalPoints)
			.slice(0, 50);
	}

	return (
		<div className="max-w-6xl mx-auto p-8">
			<h2 className="text-3xl font-bold mb-6 text-[#FF7A00]">Leaderboard</h2>
			<LeaderboardTabs questLeaders={questLeaders} geoLeaders={geoLeaders} />
		</div>
	);
}

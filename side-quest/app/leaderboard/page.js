/*
	Name: page.js
	Description: Page to view leaderboard of global user progress with Quest and GeoThinkr tabs.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions:
		Update UI style – 10/26/2025
		Add functional list of user rankings – 11/22/2025
		Merged GeoThinkr leaderboard into tabbed view – 2/19/2026
		3/15/2026 – feat: merge GeoThinkr leaderboard into main leaderboard page
		3/29/2026 – feat: add daily/weekly/all-time tabs for GeoThinkr leaderboard
	Errors: N/A
	Input: Global user progress data and GeoThinkr history from the server
	Output: Leaderboard page displaying user rankings for quests and GeoThinkr
*/
import { createAdminClient } from "@/lib/supabase/admin";
import LeaderboardTabs from "./LeaderboardTabs";

export default async function LeaderboardsPage() {
	const supabase = createAdminClient();

	// Quest progress and GeoThinkr history have no dependency on each other,
	// so fetch them in parallel.
	const [
		{ data: rows, error: rowsErr },
		{ data: geoHistory, error: geoErr },
	] = await Promise.all([
		supabase
			.from("progress")
			.select("user_id")
			.eq("completed", true),
		supabase
			.from("geothinkr_history")
			.select("user_id, points_awarded, created_at, users(name)"),
	]);

	if (rowsErr) {
		console.error("Failed to load progress:", rowsErr);
		return (
			<div className="flex-1 bg-gradient-to-br from-[#1a0d05] via-[#0a0e14] to-[#1a0d05]">
				<div className="max-w-6xl mx-auto p-8">
					<h2 className="text-3xl font-mono font-bold uppercase tracking-[0.15em] text-white mb-4">
						Leaderboard
					</h2>
					<p className="font-mono text-red-400 uppercase tracking-wider">Failed to load leaderboard data.</p>
				</div>
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

	// Aggregate GeoThinkr history into leaderboard entries for a given time filter
	function buildGeoLeaders(rows) {
		const userMap = {};
		rows.forEach(h => {
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

		return Object.values(userMap)
			.sort((a, b) => b.totalPoints - a.totalPoints || b.spotOns - a.spotOns)
			.slice(0, 50);
	}

	const now = new Date();
	const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
	const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

	let geoAllTime = [];
	let geoWeekly = [];
	let geoDaily = [];
	if (!geoErr && geoHistory) {
		geoAllTime = buildGeoLeaders(geoHistory);
		geoWeekly = buildGeoLeaders(geoHistory.filter(h => h.created_at >= weekAgo));
		geoDaily = buildGeoLeaders(geoHistory.filter(h => h.created_at >= dayAgo));
	}

	return (
		<div className="relative flex-1 bg-gradient-to-br from-[#1a0d05] via-[#0a0e14] to-[#1a0d05] overflow-hidden">
			{/* Ambient orange glow — anchors the warm side of the gradient */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse at 15% 0%, rgba(255,122,0,0.18), transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(0,174,239,0.10), transparent 55%)",
				}}
			/>
			{/* Faint tactical grid overlay */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.04]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
					backgroundSize: "44px 44px",
				}}
			/>

			<div className="relative max-w-6xl mx-auto p-8">
				<div className="mb-6">
					<div className="font-mono text-[11px] uppercase tracking-[0.4em] text-[#FF7A00] mb-1">
						{"// Global Standings"}
					</div>
					<h2 className="text-4xl font-mono font-bold uppercase tracking-[0.15em] text-white">
						Leaderboard
					</h2>
				</div>
				<LeaderboardTabs questLeaders={questLeaders} geoAllTime={geoAllTime} geoWeekly={geoWeekly} geoDaily={geoDaily} />
			</div>
		</div>
	);
}

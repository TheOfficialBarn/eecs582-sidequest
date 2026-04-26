/*
	Name: account/page.js
	Description: Account configuration page with completed quests dashboard.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions:
		Added completed quests display – 10/26/2025
		Added GeoThinkr stats + achievements – 2/19/2026
		3/15/2026 – feat: display GeoThinkr achievements and stats on user profile
	Errors: N/A
	Input: email, username, user information from server
	Output: Account page showing user info
*/

import { requireAuthOrRedirect } from "@/lib/requireAuth";
import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import { createAdminClient } from "../../lib/supabase/admin";
import { CheckCircle2, MapPin, Trophy, Edit2, Coins, Target, Award, Eye, GraduationCap, Repeat, Flame, Shield, Compass, Lock } from "lucide-react";
import Link from "next/link";

export default async function AccountPage() {
	// redirect if not authenticated
	requireAuthOrRedirect();

	// read token from cookie and verify
	const cookieStore = await cookies();
	const token = cookieStore.get("sid")?.value;
	const user = token ? verifyToken(token) : null;

	// If the user isn't logged in or the token fails verification,
	// show a simple message prompting them to log in
	if (!user) {
		return (
			<div className="max-w-4xl mx-auto p-8">
				<h2 className="text-xl font-semibold">Not logged in</h2>
				<p>Please <a href="/login" className="text-blue-600">login</a>.</p>
			</div>
		);
	}

	const supabase = createAdminClient();

	// All six queries are independent — fan them out in parallel so the page
	// only blocks for the slowest one rather than the sum of all six.
	const [
		{ data: dbUser },
		{ data: allQuests },
		{ data: progress },
		{ data: geoHistory },
		{ data: allAchievements },
		{ data: earnedAchievements },
	] = await Promise.all([
		supabase
			.from("users")
			.select("profile_picture_url, points")
			.eq("user_id", user.id)
			.single(),
		supabase
			.from("quests")
			.select("quest_id, text, location_id, locations(name)"),
		supabase
			.from("progress")
			.select(`
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
			.eq("user_id", user.id)
			.eq("completed", true),
		supabase
			.from("geothinkr_history")
			.select("points_awarded")
			.eq("user_id", user.id),
		supabase
			.from("achievements")
			.select("achievement_id, key, name, description, icon"),
		supabase
			.from("user_achievements")
			.select("achievement_id, earned_at")
			.eq("user_id", user.id),
	]);

	const profilePicture = dbUser?.profile_picture_url || "https://api.dicebear.com/9.x/avataaars/svg?seed=Default";
	const points = dbUser?.points || 0;

	const geoTotalGames = geoHistory?.length || 0;
	const geoSpotOns = geoHistory?.filter(h => h.points_awarded >= 500).length || 0;
	const geoTotalPoints = geoHistory?.reduce((sum, h) => sum + h.points_awarded, 0) || 0;
	const geoAccuracy = geoTotalGames > 0 ? Math.round((geoSpotOns / geoTotalGames) * 100) : 0;

	const earnedMap = {};
	earnedAchievements?.forEach(e => { earnedMap[e.achievement_id] = e.earned_at; });

	const achievements = allAchievements?.map(a => ({
		...a,
		earned_at: earnedMap[a.achievement_id] || null
	})) || [];

	// Organize completed quests by location
	const completedByLocation = {};
	let totalCompleted = 0;

	progress?.forEach(p => {
		// normalize nested quest data
		const quest = Array.isArray(p.quests) ? p.quests[0] : p.quests;
		if (!quest) return;

		// normalize nested location data
		const location = Array.isArray(quest.locations) ? quest.locations[0] : quest.locations;
		if (!location) return;

		const locationName = location.name;

		// initialize location group if it doesn't exist
		if (!completedByLocation[locationName]) {
			completedByLocation[locationName] = [];
		}

		// store quest info under its location
		completedByLocation[locationName].push({
			text: quest.text,
			completed_at: p.completed_at
		});
		totalCompleted++;
	});

	// calculate total quests and completion percentage
	const totalQuests = allQuests?.length || 0;
	const completionPercentage = totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0;

	// If the user is authenticated, display their account info
	// along with completed quests dashboard
	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 relative overflow-hidden">
			{/* Background — notebook-dot grid + sticker shapes */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: 'radial-gradient(circle, rgba(255,122,0,0.18) 1.5px, transparent 1.5px)',
						backgroundSize: '28px 28px',
					}}
				/>
				<div className="absolute top-[8%] left-[6%] w-6 h-6 bg-[#FF7A00] rotate-12 shadow-[3px_3px_0_#FFDA00]" />
				<div className="absolute top-[14%] right-[8%] w-8 h-8 bg-[#00AEEF] rounded-full shadow-[3px_3px_0_#FF7A00]" />
				<div className="absolute top-[42%] left-[4%] w-5 h-5 bg-[#FFDA00] rotate-45 shadow-[3px_3px_0_#00AEEF]" />
				<div className="absolute top-[50%] right-[5%] w-7 h-7 bg-[#FF7A00] rounded-full shadow-[3px_3px_0_#FFDA00]" />
				<div className="absolute bottom-[18%] left-[14%] w-7 h-7 bg-[#00AEEF] rotate-45 shadow-[3px_3px_0_#FF7A00]" />
				<div className="absolute bottom-[10%] right-[22%] w-6 h-6 bg-[#FFDA00] rotate-12 shadow-[3px_3px_0_#00AEEF]" />
				<div className="absolute bottom-[28%] right-[40%] w-5 h-5 bg-[#FF7A00] rounded-full shadow-[3px_3px_0_#FFDA00]" />
			</div>

			<div className="max-w-4xl mx-auto p-8 relative z-10">
				{/* Account Info Section */}
				<div className="mb-8 text-[#FF7A00]">
					<h2 className="text-4xl font-extrabold text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-4">Account</h2>
					<div className="bg-white rounded-2xl border-4 border-[#FF7A00] shadow-[8px_8px_0_#00AEEF] p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
					<div className="relative group">
						<img
							src={profilePicture}
							alt="Profile"
							className="w-32 h-32 rounded-full border-4 border-[#FF7A00] object-cover bg-gray-100"
						/>
						<Link
							href="/shop"
							className="absolute bottom-0 right-0 bg-[#00AEEF] text-white p-2 rounded-full shadow-lg hover:bg-[#0096D6] transition-transform hover:scale-110"
							title="Customize Avatar"
						>
							<Edit2 className="w-4 h-4" />
						</Link>
					</div>

					<div className="flex-1 text-center md:text-left">
						<div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4">
							<div>
								<p className="mb-2 text-lg text-gray-800"><strong>Email:</strong> {user.email}</p>
								<p className="mb-4 text-lg text-gray-800"><strong>Name:</strong> {user.name || "-"}</p>
							</div>
							<div className="bg-[#FFF6D8] p-4 rounded-2xl border-4 border-[#FFDA00] shadow-[4px_4px_0_#FF7A00] flex flex-col items-center min-w-[120px]">
								<div className="text-[#FF7A00] font-bold text-sm uppercase tracking-wide">Balance</div>
								<div className="flex items-center gap-2 text-2xl font-black text-gray-800 mt-1">
									<Coins className="w-6 h-6 text-[#FFDA00]" fill="#FFDA00" />
									{points}
								</div>
							</div>
						</div>

						<div className="mt-4 flex justify-center md:justify-start">
							<form action="/api/auth/logout" method="post">
								<button className="px-6 py-2 bg-white border-4 border-[#FF7A00] rounded-2xl cursor-pointer shadow-[4px_4px_0_#00AEEF] hover:shadow-[6px_6px_0_#00AEEF] hover:scale-105 transition-all font-bold text-[#FF7A00]">
									Logout
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			{/* Quest Progress Dashboard */}
			<div className="mb-8">
				<h2 className="text-4xl font-extrabold mb-4 text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] flex items-center gap-2">
					<Trophy className="w-8 h-8" />
					Quest Progress
				</h2>

				{/* Statistics Card */}
				<div className="bg-gradient-to-r from-[#00AEEF] to-[#0096D6] text-white rounded-2xl border-4 border-[#00AEEF] shadow-[6px_6px_0_#FF7A00] p-6 mb-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-4xl font-extrabold drop-shadow-[2px_2px_#0096D6]">{totalCompleted}</div>
							<div className="text-sm opacity-90 font-semibold">Completed</div>
						</div>
						<div className="text-center">
							<div className="text-4xl font-extrabold drop-shadow-[2px_2px_#0096D6]">{totalQuests}</div>
							<div className="text-sm opacity-90 font-semibold">Total Quests</div>
						</div>
						<div className="text-center">
							<div className="text-4xl font-extrabold drop-shadow-[2px_2px_#0096D6]">{completionPercentage}%</div>
							<div className="text-sm opacity-90 font-semibold">Complete</div>
						</div>
					</div>
				</div>

				{/* GeoThinkr Stats */}
				<div className="bg-gradient-to-r from-[#FF7A00] to-[#FF9500] text-white rounded-2xl border-4 border-[#FF7A00] shadow-[6px_6px_0_#00AEEF] p-6 mb-6">
					<div className="flex items-center gap-2 mb-4">
						<Target className="w-6 h-6" />
						<span className="font-extrabold text-lg drop-shadow-[2px_2px_#FF9500]">GeoThinkr Stats</span>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div className="text-center">
							<div className="text-3xl font-extrabold drop-shadow-[2px_2px_#FF9500]">{geoTotalGames}</div>
							<div className="text-sm opacity-90 font-semibold">Games Played</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-extrabold drop-shadow-[2px_2px_#FF9500]">{geoSpotOns}</div>
							<div className="text-sm opacity-90 font-semibold">Spot-ons</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-extrabold drop-shadow-[2px_2px_#FF9500]">{geoTotalPoints}</div>
							<div className="text-sm opacity-90 font-semibold">Points Earned</div>
						</div>
						<div className="text-center">
							<div className="text-3xl font-extrabold drop-shadow-[2px_2px_#FF9500]">{geoAccuracy}%</div>
							<div className="text-sm opacity-90 font-semibold">Accuracy</div>
						</div>
					</div>
				</div>

				{/* Achievements */}
				{achievements.length > 0 && (
					<div className="mb-6">
						<h3 className="text-2xl font-extrabold text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-3 flex items-center gap-2">
							<Award className="w-6 h-6" /> Achievements
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{achievements.map(a => (
								<div
									key={a.achievement_id}
									className={`rounded-2xl p-4 text-center border-4 transition-all ${
										a.earned_at
											? 'bg-[#FFF6D8] border-[#FFDA00] shadow-[4px_4px_0_#FF7A00] hover:shadow-[6px_6px_0_#FF7A00] hover:scale-105'
											: 'bg-gray-100 border-gray-200 opacity-50'
									}`}
								>
									<div className="flex justify-center mb-2">
										{a.earned_at
											? <Trophy className="w-8 h-8 text-[#FFDA00]" fill="#FFDA00" />
											: <Lock className="w-8 h-8 text-gray-400" />}
									</div>
									<div className="font-bold text-sm text-gray-800">{a.name}</div>
									<div className="text-xs text-gray-500 mt-1">{a.description}</div>
									{a.earned_at && (
										<div className="text-xs text-green-600 mt-1 font-semibold">
											Earned {new Date(a.earned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{totalCompleted > 0 ? (
					<div className="space-y-4">
						<h3 className="text-2xl font-extrabold text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-4">Completed Quests</h3>
						{Object.entries(completedByLocation).map(([locationName, quests], index) => {
							const palettes = [
								{ border: '#00AEEF', shadow: '#FF7A00' },
								{ border: '#FF7A00', shadow: '#00AEEF' },
								{ border: '#FFDA00', shadow: '#FF7A00' },
								{ border: '#00AEEF', shadow: '#FFDA00' }
							];
							const colors = palettes[index % palettes.length];
							return (
								<div
									key={locationName}
									className="bg-white rounded-2xl border-4 p-6 transform hover:scale-[1.02] transition-all"
									style={{ borderColor: colors.border, boxShadow: `6px 6px 0 ${colors.shadow}` }}
								>
									<div className="flex items-center gap-2 mb-4">
										<MapPin className="w-6 h-6" style={{ color: colors.border }} />
										<h4 className="text-xl font-extrabold text-[#FF7A00] drop-shadow-[1px_1px_#FFDA00]">{locationName}</h4>
										<span className="text-sm font-semibold text-[#00AEEF]">({quests.length} completed)</span>
									</div>
									<ul className="space-y-2">
										{quests.map((quest, qIndex) => (
											<li key={qIndex} className="flex items-start gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl shadow-[3px_3px_0_#10b981]">
												<CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
												<div className="flex-1">
													<div className="font-semibold text-green-700">{quest.text}</div>
													{quest.completed_at && (
														<div className="text-xs text-green-600 mt-1 font-semibold">
															Completed: {new Date(quest.completed_at).toLocaleDateString('en-US', {
																year: 'numeric',
																month: 'short',
																day: 'numeric',
																hour: '2-digit',
																minute: '2-digit'
															})}
														</div>
													)}
												</div>
											</li>
										))}
									</ul>
								</div>
							);
						})}
					</div>
				) : (
					// display when no quests completed
					<div className="bg-white rounded-2xl border-4 border-[#00AEEF] shadow-[6px_6px_0_#FF7A00] p-8 text-center">
						<Trophy className="w-16 h-16 text-[#FFDA00] mx-auto mb-4" />
						<p className="text-lg font-bold text-[#FF7A00] drop-shadow-[1px_1px_#FFDA00] mb-2">No quests completed yet!</p>
						<p className="text-sm text-gray-600 font-semibold">Start exploring the map to complete your first quest.</p>
						<Link
							href="/map"
							className="inline-block mt-4 px-6 py-3 bg-[#FF7A00] text-white rounded-2xl border-4 border-[#FF7A00] shadow-[4px_4px_0_#00AEEF] hover:shadow-[6px_6px_0_#00AEEF] hover:scale-105 transition-all font-bold"
						>
							Go to Map
						</Link>
					</div>
				)}
				</div>
			</div>
		</div>
	);
}

/*
	Name: account/page.js
	Description: Account configuration page with completed quests dashboard.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: Added completed quests display - 10/26/2025
	Errors: N/A
	Input: email, username, user information from server
	Output: Account page showing user info
*/

import { requireAuthOrRedirect } from "@/lib/requireAuth";
import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import { createAdminClient } from "../../lib/supabase/admin";
import { CheckCircle2, MapPin, Trophy, Edit2, Coins } from "lucide-react";
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

	// Fetch refreshed user data to get profile picture and points
	const { data: dbUser } = await supabase
		.from("users")
		.select("profile_picture_url, points")
		.eq("user_id", user.id)
		.single();

	const profilePicture = dbUser?.profile_picture_url || "https://api.dicebear.com/9.x/avataaars/svg?seed=Default";
	const points = dbUser?.points || 0;

	// Get all quests to calculate total
	const { data: allQuests } = await supabase
		.from("quests")
		.select("quest_id, text, location_id, locations(name)");

	// Get user's completed progress
	const { data: progress } = await supabase
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
		.eq("completed", true);

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
		<div className="max-w-4xl mx-auto p-8">
			{/* Account Info Section */}
			<div className="mb-8 text-[#FF7A00]">
				<h2 className="text-3xl font-bold mb-4">Account</h2>
				<div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
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
							<div className="bg-[#FFF6D8] p-4 rounded-xl border-2 border-[#FFDA00] flex flex-col items-center min-w-[120px]">
								<div className="text-[#FF7A00] font-bold text-sm uppercase tracking-wide">Balance</div>
								<div className="flex items-center gap-2 text-2xl font-black text-gray-800 mt-1">
									<Coins className="w-6 h-6 text-[#FFDA00]" fill="#FFDA00" />
									{points}
								</div>
							</div>
						</div>

						<div className="mt-4 flex justify-center md:justify-start">
							<form action="/api/auth/logout" method="post">
								<button className="px-6 py-2 border-2 border-[#FF7A00] rounded-lg cursor-pointer hover:bg-[#FF7A00] hover:text-white transition-all duration-200 font-semibold text-[#FF7A00]">
									Logout
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>

			{/* Quest Progress Dashboard */}
			<div className="mb-8">
				<h2 className="text-3xl font-bold mb-4 text-[#FF7A00] flex items-center gap-2">
					<Trophy className="w-8 h-8" />
					Quest Progress
				</h2>

				{/* Statistics Card */}
				<div className="bg-gradient-to-r from-[#00AEEF] to-[#0096D6] text-white rounded-lg shadow-lg p-6 mb-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center">
							<div className="text-4xl font-bold">{totalCompleted}</div>
							<div className="text-sm opacity-90">Completed</div>
						</div>
						<div className="text-center">
							<div className="text-4xl font-bold">{totalQuests}</div>
							<div className="text-sm opacity-90">Total Quests</div>
						</div>
						<div className="text-center">
							<div className="text-4xl font-bold">{completionPercentage}%</div>
							<div className="text-sm opacity-90">Complete</div>
						</div>
					</div>
				</div>

				{/* Completed Quests by Location */}
				{totalCompleted > 0 ? (
					<div className="space-y-4">
						<h3 className="text-2xl font-semibold text-[#FF7A00] mb-4">Completed Quests</h3>
						{Object.entries(completedByLocation).map(([locationName, quests]) => (
							<div key={locationName} className="bg-white rounded-lg shadow-md p-6">
								<div className="flex items-center gap-2 mb-4 text-[#00AEEF]">
									<MapPin className="w-5 h-5" />
									<h4 className="text-xl font-bold">{locationName}</h4>
									<span className="text-sm text-gray-500">({quests.length} completed)</span>
								</div>
								<ul className="space-y-2">
									{quests.map((quest, index) => (
										<li key={index} className="flex items-start gap-3 p-3 bg-[#FFF6D8] rounded-lg">
											<CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
											<div className="flex-1">
												<div className="font-medium text-gray-800">{quest.text}</div>
												{quest.completed_at && (
													<div className="text-xs text-gray-500 mt-1">
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
						))}
					</div>
				) : (
					// display when no quests completed
					<div className="bg-white rounded-lg shadow-md p-8 text-center">
						<Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<p className="text-lg text-gray-600 mb-2">No quests completed yet!</p>
						<p className="text-sm text-gray-500">Start exploring the map to complete your first quest.</p>
						<a
							href="/map"
							className="inline-block mt-4 px-6 py-2 bg-[#00AEEF] text-white rounded-lg hover:bg-[#0096D6] transition-colors font-semibold"
						>
							Go to Map
						</a>
					</div>
				)}
			</div>
		</div>
	);
}

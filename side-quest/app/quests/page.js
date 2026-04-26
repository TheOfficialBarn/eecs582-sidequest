/*
	Name: quests/page.js
	Description: Quests page showing all quests with completion status.
	Programmers: Pashia Vang
	Date: 11/06/2025
	Revisions: N/A
	Errors: N/A
	Input: 
		- User auth token (cookie)
		- Quest data from database (locations, quests)
		- User progress data (completed quests)
	Output: 
		- Rendered page showing quests by location
		- Completion statistics
		- progress bars, notifications
*/

import { requireAuthOrRedirect } from "@/lib/requireAuth";
import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import { createAdminClient } from "../../lib/supabase/admin";
import Link from "next/link";
import { CheckCircle2, MapPin, Trophy, Compass, ArrowRight, Star, Sparkles } from "lucide-react";
import AnimatedProgressBar from "./progress-bar";

export default async function QuestsPage() {
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

	// Get all quests with location info, and user's progress, in parallel
	const [{ data: allQuests }, { data: progress }] = await Promise.all([
		supabase
			.from("quests")
			.select(`
				quest_id,
				text,
				location_id,
				locations (
					location_id,
					name
				)
			`)
			.order("location_id"),
		supabase
			.from("progress")
			.select(`
				quest_id,
				completed,
				completed_at,
				quests (
					quest_id,
					text,
					location_id
				)
			`)
			.eq("user_id", user.id),
	]);

	// Create a map of quest_id -> completion status
	const progressMap = {};
	progress?.forEach(p => {
		const quest = Array.isArray(p.quests) ? p.quests[0] : p.quests;
		if (quest) {
			progressMap[quest.quest_id] = {
				completed: p.completed,
				completed_at: p.completed_at
			};
		}
	});

	// Organize all quests by location
	const questsByLocation = {};
	let totalCompleted = 0;
	let totalQuests = 0;

	allQuests?.forEach(quest => {
		// Find quest
		const location = Array.isArray(quest.locations) ? quest.locations[0] : quest.locations;
		if (!location) return;
		// Get quest information
		const locationName = location.name;
		if (!questsByLocation[locationName]) {
			questsByLocation[locationName] = [];
		}

		const questProgress = progressMap[quest.quest_id];
		const isCompleted = questProgress?.completed || false;
		
		// Gather stats to calculate total progression
		if (isCompleted) {
			totalCompleted++;
		}
		totalQuests++;

		questsByLocation[locationName].push({
			quest_id: quest.quest_id,
			text: quest.text,
			completed: isCompleted,
			completed_at: questProgress?.completed_at
		});
	});

	// Calculate total quest completion percentage based on stats from above.
	const completionPercentage = totalQuests > 0 ? Math.round((totalCompleted / totalQuests) * 100) : 0;

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 p-6 relative overflow-hidden">
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

			<div className="max-w-5xl mx-auto relative z-10">
				{/* Header */}
				<div className="mb-6 text-center">
					<div className="flex items-center justify-center gap-3 mb-3">
						<Compass className="w-8 h-8 text-[#00AEEF]" />
						<Star className="w-7 h-7 text-[#FF7A00]" />
						<Trophy className="w-8 h-8 text-[#00AEEF]" />
					</div>
					<h1 className="text-4xl font-extrabold text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-2">
						Your Quests
					</h1>
					<p className="text-base text-[#00AEEF] font-semibold">Track your epic campus adventures!</p>
				</div>

				{/* Statistics Cards - Fun Style */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<div className="bg-white rounded-2xl p-4 border-4 border-[#00AEEF] shadow-[6px_6px_0_#FF7A00] hover:shadow-[8px_8px_0_#FF7A00] transform hover:scale-105 transition-all text-center">
						<CheckCircle2 className="w-8 h-8 text-[#00AEEF] mx-auto mb-2" />
						<div className="text-3xl font-bold text-[#FF7A00] mb-1">{totalCompleted}</div>
						<div className="text-sm font-semibold text-gray-700">Completed</div>
					</div>
					<div className="bg-white rounded-2xl p-4 border-4 border-[#FF7A00] shadow-[6px_6px_0_#00AEEF] hover:shadow-[8px_8px_0_#00AEEF] transform hover:scale-105 transition-all text-center">
						<Compass className="w-8 h-8 text-[#FF7A00] mx-auto mb-2" />
						<div className="text-3xl font-bold text-[#00AEEF] mb-1">{totalQuests}</div>
						<div className="text-sm font-semibold text-gray-700">Total Quests</div>
					</div>
					<div className="bg-white rounded-2xl p-4 border-4 border-[#FFDA00] shadow-[6px_6px_0_#FF7A00] hover:shadow-[8px_8px_0_#FF7A00] transform hover:scale-105 transition-all text-center">
						<Trophy className="w-8 h-8 text-[#FF7A00] mx-auto mb-2" />
						<div className="text-3xl font-bold text-[#00AEEF] mb-1">{completionPercentage}%</div>
						<div className="text-sm font-semibold text-gray-700">Complete</div>
					</div>
				</div>

				{/* Quests by Location */}
				{totalQuests > 0 ? (
					<div className="space-y-4">
						{Object.entries(questsByLocation).map(([locationName, quests]) => {
							const locationCompleted = quests.filter(q => q.completed).length;
							const locationTotal = quests.length;
							const locationPercentage = locationTotal > 0 ? Math.round((locationCompleted / locationTotal) * 100) : 0;

							return (
								<div
									key={locationName}
									className="bg-white rounded-2xl p-4 border-4 border-[#00AEEF] shadow-[6px_6px_0_#FF7A00] transform hover:scale-[1.01] transition-all group"
								>
									{/* Location Header */}
									<div className="flex items-center justify-between mb-3">
										<div className="flex items-center gap-2">
											<MapPin className="w-5 h-5 text-[#00AEEF]" />
											<h3 className="text-xl font-bold text-gray-900">
												{locationName}
											</h3>
										</div>
										<div className="text-right">
											<div className="text-base font-bold text-gray-900 leading-tight">
												{locationCompleted} / {locationTotal}
											</div>
											<div className="text-xs font-semibold text-gray-500">{locationPercentage}%</div>
										</div>
									</div>

									{/* Progress Bar - Animated on Scroll */}
									<AnimatedProgressBar
										percentage={locationPercentage}
										color="#00AEEF"
										shadowColor="#FF7A00"
									/>

									{/* Quest List */}
									<ul className="space-y-1.5">
										{quests.map((quest) => (
											<li
												key={quest.quest_id}
												className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${
													quest.completed
														? "bg-green-50 border border-green-200"
														: "bg-gray-50 border border-gray-200 hover:bg-gray-100"
												}`}
											>
												{quest.completed && (
													<CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
												)}
												<div className="flex-1">
													<div className={`text-sm font-medium ${
														quest.completed
															? "text-green-800 line-through decoration-green-500"
															: "text-gray-800"
													}`}>
														{quest.text}
													</div>
													{quest.completed && quest.completed_at && (
														<div className="text-[11px] text-green-600 mt-0.5">
															Completed {new Date(quest.completed_at).toLocaleDateString('en-US', {
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
					<div className="bg-white rounded-2xl p-8 text-center border-4 border-[#00AEEF] shadow-[6px_6px_0_#FF7A00]">
						<Compass className="w-14 h-14 text-gray-300 mx-auto mb-3" />
						<p className="text-lg font-bold text-gray-600 mb-1">No quests available yet!</p>
						<p className="text-sm text-gray-500">Check back later for new quests.</p>
					</div>
				)}

				{/* Call to Action - Fun Style */}
				{totalQuests > 0 && totalCompleted < totalQuests && (
					<div className="mt-6 bg-white rounded-2xl p-6 text-center border-4 border-[#FF7A00] shadow-[8px_8px_0_#00AEEF] hover:shadow-[10px_10px_0_#00AEEF] transform hover:scale-[1.02] transition-all">
						<div className="flex items-center justify-center gap-2 mb-3">
							<Trophy className="w-8 h-8 text-[#FF7A00]" />
							<Star className="w-7 h-7 text-[#FFDA00] animate-pulse" />
							<Sparkles className="w-8 h-8 text-[#00AEEF]" />
						</div>
						<h3 className="text-2xl font-bold text-[#FF7A00] mb-2 drop-shadow-[1px_1px_#FFDA00]">
							Continue Your Epic Journey!
						</h3>
						<p className="text-base text-[#00AEEF] mb-4 font-semibold flex items-center justify-center gap-2">
							You&apos;ve completed <span className="text-[#FF7A00] font-bold">{totalCompleted}</span> of <span className="text-[#FF7A00] font-bold">{totalQuests}</span> quests. Keep exploring! <Sparkles className="w-4 h-4 text-[#FF7A00]" />
						</p>
						<Link
							href="/map"
							className="group relative inline-flex items-center gap-2 px-7 py-3 bg-[#FF7A00] text-white font-bold text-base rounded-2xl shadow-[6px_6px_0_#00AEEF] hover:shadow-[8px_8px_0_#00AEEF] transform hover:scale-105 transition-all duration-200 overflow-hidden"
						>
							<span className="relative z-10">Go to Map</span>
							<ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
							<div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						</Link>
					</div>
				)}

				{/* Completion Celebration */}
				{totalQuests > 0 && totalCompleted === totalQuests && (
					<div className="mt-6 bg-gradient-to-r from-[#FFDA00] via-[#FF7A00] to-[#FFDA00] rounded-2xl p-6 text-center border-4 border-[#00AEEF] shadow-[8px_8px_0_#FF7A00] animate-pulse">
						<div className="flex items-center justify-center gap-3 mb-3">
							<Trophy className="w-10 h-10 text-white" />
							<Star className="w-9 h-9 text-white animate-spin" />
							<Sparkles className="w-10 h-10 text-white" />
						</div>
						<h3 className="text-2xl font-bold text-white mb-2 drop-shadow-[2px_2px_#00AEEF] flex items-center justify-center gap-2">
							<Sparkles className="w-7 h-7" /> QUEST MASTER! <Sparkles className="w-7 h-7" />
						</h3>
						<p className="text-base text-white font-bold mb-1">
							You&apos;ve completed ALL {totalQuests} quests!
						</p>
						<p className="text-sm text-white opacity-90 flex items-center justify-center gap-2">
							You&apos;re a true campus explorer! <Trophy className="w-4 h-4" />
						</p>
					</div>
				)}
			</div>
		</div>
	);
}


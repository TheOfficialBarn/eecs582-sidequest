
import { requireAuthOrRedirect } from "@/lib/requireAuth";
import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import { createAdminClient } from "../../lib/supabase/admin";
import Link from "next/link";
import { Trophy, Shield, Swords, Crown, User, ArrowRight, Star } from "lucide-react";

export const metadata = {
	title: "Multiplayer Quests",
	description: "Compete with others for exclusive rewards!",
};

export default async function MultiplayerPage() {
	requireAuthOrRedirect();

	const cookieStore = await cookies();
	const token = cookieStore.get("sid")?.value;
	const user = token ? verifyToken(token) : null;

	if (!user) return null;

	const supabase = createAdminClient();

	// Fetch active multiplayer quests
	const { data: activeQuests } = await supabase
		.from("quests")
		.select(`
            quest_id, text, reward_points,
            location:locations(name)
        `)
		.eq("is_multiplayer", true)
		.is("winner_id", null);

	// Fetch winners of claimed quests
	const { data: claimedQuests } = await supabase
		.from("quests")
		.select(`
            quest_id, text, reward_points,
            location:locations(name),
            winner:users(name, profile_picture_url)
        `)
		.eq("is_multiplayer", true)
		.not("winner_id", "is", null)
		.order("quest_id", { ascending: false }); // Show most recent claims top? (using id as proxy)

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 p-8 relative overflow-hidden">
			{/* Background blobs */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-20 h-20 bg-[#00AEEF] opacity-20 rounded-full blur-xl"></div>
				<div className="absolute top-40 right-20 w-32 h-32 bg-[#FF7A00] opacity-20 rounded-full blur-xl"></div>
			</div>

			<div className="text-center space-y-4 mb-12 relative z-10">
				<div className="inline-block p-4 bg-white rounded-full mb-4 shadow-[4px_4px_0_#FF7A00] border-2 border-[#FF7A00]">
					<Swords className="w-12 h-12 text-[#FF7A00]" />
				</div>
				<h1 className="text-6xl font-extrabold text-[#FF7A00] drop-shadow-[3px_3px_#FFDA00]">
					Featured Sidequests
				</h1>
				<p className="text-xl text-[#00AEEF] font-bold max-w-2xl mx-auto italic">
					High stakes. One winner. Exclusive rewards.
				</p>
				<p className="text-gray-600">Be the first to complete a quest to claim victory!</p>
			</div>

			{/* Active Quests Section */}
			<section className="max-w-5xl mx-auto mb-16 relative z-10">
				<h2 className="text-3xl font-bold text-[#FF7A00] mb-8 flex items-center gap-3 drop-shadow-[2px_2px_#FFDA00]">
					<Shield className="w-8 h-8 text-[#00AEEF]" />
					Active Challenges
				</h2>

				{activeQuests && activeQuests.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{activeQuests.map(quest => (
							<div key={quest.quest_id} className="group relative bg-white rounded-2xl p-8 border-4 border-[#00AEEF] shadow-[8px_8px_0_#FF7A00] hover:shadow-[12px_12px_0_#FF7A00] hover:scale-[1.02] transition-all duration-300">
								<div className="absolute top-0 right-0 bg-[#FFDA00] text-[#FF7A00] text-sm font-black px-4 py-2 rounded-bl-2xl border-l-4 border-b-4 border-[#FF7A00] flex items-center gap-1">
									<Star className="w-4 h-4" fill="currentColor" />
									{quest.reward_points} PTS
								</div>

								<div className="mb-4">
									<span className="text-xs font-black uppercase tracking-widest text-white bg-[#FF7A00] px-3 py-1 rounded-full shadow-sm">
										{quest.location?.name || "Unknown Location"}
									</span>
								</div>

								<h3 className="text-2xl font-bold text-gray-800 mb-6 group-hover:text-[#00AEEF] transition-colors leading-tight">
									{quest.text}
								</h3>

								<div className="flex items-center justify-between mt-auto">
									<div className="flex items-center gap-2">
										<div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
										<span className="text-sm font-bold text-green-600 uppercase tracking-wide">Live Now</span>
									</div>
									<Link href="/map" className="inline-flex items-center gap-2 text-md font-bold text-[#00AEEF] hover:text-[#008CC1] transition-colors group/link">
										Go to Map <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
									</Link>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="bg-white rounded-2xl p-12 text-center border-4 border-dashed border-[#FFDA00]">
						<Swords className="w-16 h-16 text-gray-300 mx-auto mb-4" />
						<h3 className="text-xl font-bold text-gray-500 mb-2">No Active Challenges</h3>
						<p className="text-gray-400 font-medium">The realm is peaceful... for now.</p>
					</div>
				)}
			</section>

			{/* Hall of Fame (Claimed Quests) */}
			<section className="max-w-4xl mx-auto relative z-10">
				<h2 className="text-3xl font-bold text-[#FF7A00] mb-8 flex items-center gap-3 drop-shadow-[2px_2px_#FFDA00]">
					<Crown className="w-8 h-8 text-[#FFDA00] drop-shadow-sm" fill="#FFDA00" />
					Hall of Victory
				</h2>

				<div className="bg-white rounded-3xl p-8 border-4 border-[#FFDA00] shadow-[8px_8px_0_#FF7A00]">
					<div className="space-y-4">
						{claimedQuests && claimedQuests.length > 0 ? (
							claimedQuests.map(quest => (
								<div key={quest.quest_id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-[#FFF6D8] rounded-2xl border-2 border-transparent hover:border-[#FFDA00] transition-colors">
									<div className="flex items-center gap-4 flex-1">
										<div className="relative">
											<img
												src={quest.winner?.profile_picture_url || "https://api.dicebear.com/9.x/avataaars/svg?seed=Default"}
												alt={quest.winner?.name}
												className="w-14 h-14 rounded-full border-4 border-[#FFDA00] object-cover bg-white"
											/>
											<Crown className="w-6 h-6 text-[#FFDA00] absolute -top-3 -right-2 drop-shadow-md transform rotate-12" fill="#FFDA00" />
										</div>

										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-x-2 mb-1">
												<span className="font-extrabold text-lg text-gray-800">
													{quest.winner?.name || "Unknown Warrior"}
												</span>
												<span className="text-xs font-bold text-[#00AEEF] uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-full">
													{quest.location?.name}
												</span>
											</div>
											<div className="text-sm font-semibold text-gray-600 truncate">
												Conquered: <span className="text-gray-800">{quest.text}</span>
											</div>
										</div>
									</div>

									<div className="flex items-center justify-end gap-2 sm:border-l sm:border-[#FFDA00]/50 sm:pl-6">
										<div className="text-right">
											<div className="text-2xl font-black text-[#FF7A00]">+{quest.reward_points}</div>
											<div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Points</div>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="text-center py-12">
								<Trophy className="w-16 h-16 mx-auto mb-4 text-gray-200" />
								<p className="text-gray-400 font-bold text-lg">No champions yet.</p>
								<p className="text-gray-400">Be the first to claim glory!</p>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}


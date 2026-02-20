/*
	Name: LeaderboardTabs.js
	Description: Client component providing tabbed navigation between Quest and GeoThinkr leaderboards.
	Programmers: Pashia Vang
	Date: 2/19/2026
	Revisions: N/A
	Errors: N/A
	Input: questLeaders - array of quest leaderboard entries, geoLeaders - array of GeoThinkr leaderboard entries
	Output: Tabbed leaderboard UI with Quest and GeoThinkr sections
*/

"use client";

import { useState } from "react";
import { Trophy, Medal, Lightbulb } from "lucide-react";

/*
	Component: LeaderboardTabs
	Description: Renders a tabbed interface switching between Quest and GeoThinkr leaderboards.
	Props:
		questLeaders - array of { userId, displayName, completedCount }
		geoLeaders - array of { userId, name, totalPoints, totalGames, spotOns }
	Returns: JSX element for tabbed leaderboard
*/
export default function LeaderboardTabs({ questLeaders, geoLeaders }) {
	const [activeTab, setActiveTab] = useState("quests");

	/*
		Function: getRankStyle
		Description: Returns styling classes for top-3 rank badges.
		Arguments: index - 0-based rank index
		Returns: CSS class string
	*/
	function getRankStyle(index) {
		if (index === 0) return "bg-yellow-400 text-white";
		if (index === 1) return "bg-gray-300 text-white";
		if (index === 2) return "bg-amber-600 text-white";
		return "bg-gray-100 text-gray-600";
	}

	return (
		<div>
			{/* Tab Buttons */}
			<div className="flex gap-2 mb-6">
				<button
					onClick={() => setActiveTab("quests")}
					className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${
						activeTab === "quests"
							? "bg-[#FF7A00] text-white shadow-lg"
							: "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
					}`}
				>
					<Trophy className="w-5 h-5" /> Quests
				</button>
				<button
					onClick={() => setActiveTab("geothinkr")}
					className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all ${
						activeTab === "geothinkr"
							? "bg-[#FF7A00] text-white shadow-lg"
							: "bg-white text-gray-600 hover:bg-gray-50 shadow-md"
					}`}
				>
					<Lightbulb className="w-5 h-5" /> GeoThinkr
				</button>
			</div>

			{/* Quest Leaderboard */}
			{activeTab === "quests" && (
				<div>
					{questLeaders.length === 0 ? (
						<p className="text-gray-600">No completed quests yet.</p>
					) : (
						<ol className="space-y-2">
							{questLeaders.map((row, i) => (
								<li
									key={row.userId}
									className="flex items-center justify-between gap-4 bg-white rounded-lg p-4 shadow-lg"
								>
									<div className="flex items-center gap-4">
										<div className="w-10 text-xl font-bold text-gray-700">{i + 1}.</div>
										<div>
											<div className="font-medium text-gray-900">{row.displayName}</div>
										</div>
									</div>
									<div className="text-lg font-semibold text-[#FF7A00]">{`Completed quests: ${row.completedCount}`}</div>
								</li>
							))}
						</ol>
					)}
				</div>
			)}

			{/* GeoThinkr Leaderboard */}
			{activeTab === "geothinkr" && (
				<div>
					{geoLeaders.length === 0 ? (
						<div className="bg-white rounded-lg shadow-lg p-8 text-center">
							<Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
							<h2 className="text-xl font-bold text-gray-800 mb-2">No scores yet!</h2>
							<p className="text-gray-500">Be the first to play GeoThinkr.</p>
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-lg overflow-hidden">
							<div className="bg-gradient-to-r from-[#FF7A00] to-[#FF9500] p-4 text-white flex items-center gap-2">
								<Trophy className="w-6 h-6" />
								<span className="font-bold text-lg">Top Players</span>
							</div>
							<div className="divide-y">
								{geoLeaders.map((player, index) => (
									<div key={player.userId} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50">
										<div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankStyle(index)}`}>
											{index < 3 ? <Medal className="w-4 h-4" /> : index + 1}
										</div>
										<div className="flex-1 min-w-0">
											<div className="font-bold text-gray-800 truncate">{player.name}</div>
											<div className="text-xs text-gray-500">
												{player.totalGames} games · {player.spotOns} spot-ons
											</div>
										</div>
										<div className="text-right">
											<div className="font-bold text-[#FF7A00]">{player.totalPoints}</div>
											<div className="text-xs text-gray-500">points</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

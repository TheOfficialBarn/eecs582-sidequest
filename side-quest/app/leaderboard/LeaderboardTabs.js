/*
	Name: LeaderboardTabs.js
	Description: Client component providing tabbed navigation between Quest and GeoThinkr leaderboards.
	Programmers: Pashia Vang
	Date: 2/19/2026
	Revisions:
		3/15/2026 – feat: merge GeoThinkr leaderboard into main leaderboard page
		3/29/2026 – feat: add daily/weekly/all-time sub-tabs for GeoThinkr
		3/29/2026 – feat: add staggered row animations on load and tab switch
		4/26/2026 – feat: unified card layout across Quests and GeoThinkr leaderboards
		4/26/2026 – feat: tactical FPS-style HUD redesign with hex badges and column headers
	Errors: N/A
	Input: questLeaders - array of quest leaderboard entries, geoLeaders - array of GeoThinkr leaderboard entries
	Output: Tabbed leaderboard UI with Quest and GeoThinkr sections
*/

"use client";

import { useState } from "react";
import { Trophy, Lightbulb, Crown, Medal, Award, Target, Crosshair } from "lucide-react";
import { motion } from "framer-motion";

// Hexagon for tactical rank badges
const HEX_CLIP = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";

// Cut-corner panel — top-right and bottom-left chamfered for HUD look
const PANEL_CLIP = "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))";

/*
	Function: getRankAccent
	Description: Per-rank accent palette for badges and the row's left stripe.
	Arguments: index - 0-based rank index
	Returns: object of class fragments
*/
function getRankAccent(index) {
	if (index === 0) {
		return {
			text: "text-yellow-300",
			border: "border-yellow-400",
			stripe: "bg-yellow-400",
			glow: "shadow-[0_0_18px_rgba(250,204,21,0.55)]",
			rowBg: "bg-yellow-500/[0.04]",
		};
	}
	if (index === 1) {
		return {
			text: "text-gray-200",
			border: "border-gray-300",
			stripe: "bg-gray-300",
			glow: "shadow-[0_0_14px_rgba(209,213,219,0.4)]",
			rowBg: "",
		};
	}
	if (index === 2) {
		return {
			text: "text-amber-500",
			border: "border-amber-500",
			stripe: "bg-amber-500",
			glow: "shadow-[0_0_14px_rgba(217,119,6,0.4)]",
			rowBg: "",
		};
	}
	return {
		text: "text-[#FF7A00]",
		border: "border-[#FF7A00]/50",
		stripe: "bg-[#FF7A00]/40",
		glow: "",
		rowBg: "",
	};
}

/*
	Function: getRankIcon
	Description: Icon for top-3, two-digit padded rank for the rest.
	Arguments: index - 0-based rank index
	Returns: JSX element
*/
function getRankIcon(index) {
	if (index === 0) return <Crown className="w-4 h-4" />;
	if (index === 1) return <Medal className="w-4 h-4" />;
	if (index === 2) return <Award className="w-4 h-4" />;
	return <span>{String(index + 1).padStart(2, "0")}</span>;
}

/*
	Component: LeaderboardCard
	Description: Tactical HUD container — dark cut-corner panel with header,
	             scoreboard column labels, and a divided list of rows.
	Props:
		title, icon - header content
		statLabel - column label for the right-side stat
		emptyTitle / emptyMessage - shown when items is empty
		items - rows to render
		getName(item), getSecondary(item) - row text
		renderRow(item, index) - returns the right-side stat content
		animationKey - changes when the list should re-animate
	Returns: JSX element
*/
function LeaderboardCard({
	title,
	icon,
	statLabel,
	emptyTitle,
	emptyMessage,
	items,
	getName,
	getSecondary,
	renderRow,
	animationKey,
}) {
	if (items.length === 0) {
		return (
			<div
				className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-[#FF7A00]/20 p-12 text-center"
				style={{ clipPath: PANEL_CLIP }}
			>
				<Target className="w-16 h-16 text-[#FF7A00]/40 mx-auto mb-4" strokeWidth={1.5} />
				<h3 className="font-mono uppercase tracking-[0.25em] text-white text-base font-bold mb-2">{emptyTitle}</h3>
				<p className="font-mono text-xs uppercase tracking-widest text-gray-500">{emptyMessage}</p>
			</div>
		);
	}

	return (
		<div
			className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-[#FF7A00]/30 shadow-[0_0_50px_rgba(255,122,0,0.12)] overflow-hidden"
			style={{ clipPath: PANEL_CLIP }}
		>
			{/* Header bar with top accent stripe */}
			<div className="relative px-6 py-4 border-b border-[#FF7A00]/25 bg-gradient-to-r from-slate-950 via-[#FF7A00]/[0.08] to-slate-950">
				<div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF7A00] to-transparent" />
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3 text-[#FF7A00]">
						{icon}
						<h3 className="font-mono uppercase tracking-[0.25em] text-white text-base sm:text-lg font-bold">
							{title}
						</h3>
					</div>
					<div className="hidden sm:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[#FF7A00]/80">
						<Crosshair className="w-3 h-3" />
						<span>LIVE</span>
					</div>
				</div>
			</div>

			{/* Scoreboard column labels */}
			<div className="px-6 py-2 bg-black/40 border-b border-white/5 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.25em] text-gray-500">
				<div className="w-10">Rank</div>
				<div className="flex-1">Operator</div>
				<div className="text-right min-w-[64px]">{statLabel}</div>
			</div>

			{/* Rows */}
			<ol className="divide-y divide-white/[0.06]" key={animationKey}>
				{items.map((item, index) => {
					const accent = getRankAccent(index);
					return (
						<motion.li
							key={item.userId}
							initial={{ opacity: 0, x: -12 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.25, delay: index * 0.035 }}
							className={`relative flex items-center gap-4 px-6 py-3 transition-colors hover:bg-[#FF7A00]/[0.06] ${accent.rowBg}`}
						>
							{/* Left rank stripe */}
							<div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accent.stripe}`} />

							{/* Hex rank badge */}
							<div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
								<div
									className={`absolute inset-0 ${accent.border} border-2 ${accent.glow}`}
									style={{ clipPath: HEX_CLIP }}
								/>
								<div className={`relative font-mono font-bold text-sm ${accent.text}`}>
									{getRankIcon(index)}
								</div>
							</div>

							{/* Name + secondary */}
							<div className="flex-1 min-w-0">
								<div className="font-mono uppercase tracking-wider text-white font-semibold truncate text-sm">
									{getName(item)}
								</div>
								{getSecondary(item) && (
									<div className="font-mono text-[10px] uppercase tracking-[0.15em] text-gray-500 truncate mt-0.5">
										{getSecondary(item)}
									</div>
								)}
							</div>

							{/* Right-side stat */}
							<div className="text-right flex-shrink-0 min-w-[64px]">
								{renderRow(item, index)}
							</div>
						</motion.li>
					);
				})}
			</ol>
		</div>
	);
}

/*
	Component: LeaderboardTabs
	Description: Tabbed HUD-style leaderboard with Quest and GeoThinkr sections,
	             daily/weekly/all-time sub-tabs for GeoThinkr.
	Props:
		questLeaders - array of { userId, displayName, completedCount }
		geoAllTime / geoWeekly / geoDaily - arrays of { userId, name, totalPoints, totalGames, spotOns }
	Returns: JSX element
*/
export default function LeaderboardTabs({ questLeaders, geoAllTime, geoWeekly, geoDaily }) {
	const [activeTab, setActiveTab] = useState("quests");
	const [geoPeriod, setGeoPeriod] = useState("all-time");

	const geoLeaders = geoPeriod === "daily" ? geoDaily : geoPeriod === "weekly" ? geoWeekly : geoAllTime;
	const geoEmptyMessage =
		geoPeriod === "daily"
			? "No matches today"
			: geoPeriod === "weekly"
				? "No matches this week"
				: "Awaiting first contact";

	/*
		Function: tabClass
		Description: Tactical button styling for top-level tabs.
		Arguments: isActive - whether this tab is selected
		Returns: CSS class string
	*/
	function tabClass(isActive) {
		return `flex items-center gap-2 px-5 py-3 font-mono uppercase tracking-[0.2em] text-xs font-bold transition-all border ${
			isActive
				? "bg-[#FF7A00] text-white border-[#FF7A00] shadow-[0_0_18px_rgba(255,122,0,0.5)]"
				: "bg-slate-900/90 text-gray-300 border-white/10 hover:border-[#FF7A00]/60 hover:text-white"
		}`;
	}

	return (
		<div>
			{/* Top-level tabs */}
			<div className="flex gap-2 mb-5">
				<button onClick={() => setActiveTab("quests")} className={tabClass(activeTab === "quests")}>
					<Trophy className="w-4 h-4" /> Quests
				</button>
				<button onClick={() => setActiveTab("geothinkr")} className={tabClass(activeTab === "geothinkr")}>
					<Lightbulb className="w-4 h-4" /> GeoThinkr
				</button>
			</div>

			{/* Quests */}
			{activeTab === "quests" && (
				<LeaderboardCard
					title="Quest Scoreboard"
					icon={<Trophy className="w-5 h-5" />}
					statLabel="Cleared"
					emptyTitle="No clears logged"
					emptyMessage="Be the first to complete a quest"
					items={questLeaders}
					getName={row => row.displayName}
					getSecondary={row => `${row.completedCount} ${row.completedCount === 1 ? "objective" : "objectives"} cleared`}
					renderRow={row => (
						<>
							<div className="font-mono font-bold text-[#FF7A00] text-xl leading-none tabular-nums">
								{String(row.completedCount).padStart(2, "0")}
							</div>
							<div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mt-1">
								quests
							</div>
						</>
					)}
					animationKey="quests"
				/>
			)}

			{/* GeoThinkr */}
			{activeTab === "geothinkr" && (
				<div>
					{/* Time period sub-tabs (tactical pill style) */}
					<div className="flex gap-2 mb-4">
						{[
							{ key: "daily", label: "24H" },
							{ key: "weekly", label: "7D" },
							{ key: "all-time", label: "ALL-TIME" },
						].map(tab => (
							<button
								key={tab.key}
								onClick={() => setGeoPeriod(tab.key)}
								className={`px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] border transition-all ${
									geoPeriod === tab.key
										? "bg-[#00AEEF] text-white border-[#00AEEF] shadow-[0_0_15px_rgba(0,174,239,0.5)]"
										: "bg-slate-900/90 text-gray-400 border-white/10 hover:border-[#00AEEF]/60 hover:text-white"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					<LeaderboardCard
						title="GeoThinkr Scoreboard"
						icon={<Lightbulb className="w-5 h-5" />}
						statLabel="Score"
						emptyTitle="Standby"
						emptyMessage={geoEmptyMessage}
						items={geoLeaders}
						getName={player => player.name}
						getSecondary={player =>
							`${player.totalGames} ${player.totalGames === 1 ? "match" : "matches"} · ${player.spotOns} spot-${player.spotOns === 1 ? "on" : "ons"}`
						}
						renderRow={player => (
							<>
								<div className="font-mono font-bold text-[#FF7A00] text-xl leading-none tabular-nums">
									{player.totalPoints.toLocaleString()}
								</div>
								<div className="font-mono text-[10px] uppercase tracking-widest text-gray-500 mt-1">
									points
								</div>
							</>
						)}
						animationKey={geoPeriod}
					/>
				</div>
			)}
		</div>
	);
}

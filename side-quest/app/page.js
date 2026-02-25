/*
	Name: page.js
	Description: Main landing page of Side Quest with hero section, stats, and CTA.
	Programmers: Aiden Barnard, Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: Update UI style - 10/26/2025
	Errors: N/A
	Input:
		Home navigation or initial website load
	Output:
		Rendered home page with buttons to access other parts of the website
*/

"use client";

// React core + Next.js navigation helpers
import { useState, useEffect } from "react";
import Link from "next/link";
// Icon set used across hero, stats, and CTA sections
import { Map, Compass, Backpack, Star, Sparkles, Trophy, Users, Target } from "lucide-react";

/*
	Component: Home
	Description:
		Main landing page component for Side Quest.
		Includes animated background elements, hero header, fun stats cards, and CTA button.
*/
export default function Home() {
	/*
		UI State: "mounted" gates opacity + transition classes so that
		elements fade/animate only after first client render (hydration safe).
	*/
	const [mounted, setMounted] = useState(false);

	// Mount Effect: enables CSS transitions after initial paint.
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex items-center justify-center p-8 overflow-hidden relative">

			{/* SECTION: Animated Background Blobs (pure visual flair) */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{/* Each blob fades in after mount via conditional opacity classes */}
				<div className={`absolute top-20 left-10 w-20 h-20 bg-[#00AEEF] opacity-20 rounded-full blur-xl transition-opacity duration-1000 ${mounted ? 'opacity-20' : 'opacity-0'}`}></div>
				<div className={`absolute top-40 right-20 w-32 h-32 bg-[#FF7A00] opacity-20 rounded-full blur-xl transition-opacity duration-1000 delay-300 ${mounted ? 'opacity-20' : 'opacity-0'}`}></div>
				<div className={`absolute bottom-32 left-1/4 w-24 h-24 bg-[#FFDA00] opacity-20 rounded-full blur-xl transition-opacity duration-1000 delay-500 ${mounted ? 'opacity-20' : 'opacity-0'}`}></div>
			</div>

			{/* SECTION: Main Content Wrapper */}
			<div className="max-w-5xl w-full text-center relative z-10">

				{/* HEADER: Icon Row animates in after mount for brand feel */}
				<div className={`flex gap-8 justify-center mb-8 transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
					<Map className="w-12 h-12 text-[#00AEEF]" />
					<Compass className="w-12 h-12 text-[#FF7A00]" />
					<Backpack className="w-12 h-12 text-[#00AEEF]" />
					<Star className="w-12 h-12 text-[#FF7A00]" />
					<Trophy className="w-12 h-12 text-[#00AEEF]" />
				</div>

				{/* TITLE: Hero heading */}
				<h1 className={`text-8xl font-extrabold text-[#FF7A00] drop-shadow-[3px_3px_#FFDA00] mb-4 transition-opacity duration-700 delay-100 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
					Side Quest
				</h1>

				{/* SUBTITLE: Marketing tagline */}
				<p className={`text-xl text-[#00AEEF] mb-12 max-w-3xl mx-auto transition-opacity duration-700 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
					Explore KU campus, complete epic challenges, earn achievements, and dominate the leaderboard.
				</p>

				{/* SECTION: Feature / Stats Cards */}
				<div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-5xl mx-auto transition-opacity duration-700 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
					{/* CARD: Social / Leaderboard */}
					<div className="bg-white rounded-2xl p-6 border-4 border-[#00AEEF] shadow-[6px_6px_0_#FF7A00] hover:shadow-[8px_8px_0_#FF7A00] transform hover:scale-105 transition-all">
						<Users className="w-10 h-10 text-[#00AEEF] mx-auto mb-2" />
						<p className="text-2xl font-bold text-[#FF7A00]">Join the Squad</p>
						<p className="text-sm text-gray-600">Compete with friends in the leaderboard</p>
					</div>

					{/* CARD: Achievements */}
					<div className="bg-white rounded-2xl p-6 border-4 border-[#FF7A00] shadow-[6px_6px_0_#00AEEF] hover:shadow-[8px_8px_0_#00AEEF] transform hover:scale-105 transition-all">
						<Trophy className="w-10 h-10 text-[#FF7A00] mx-auto mb-2" />
						<p className="text-2xl font-bold text-[#00AEEF]">Earn Bragging Rights</p>
						<p className="text-sm text-gray-600">See your number of completed quests</p>
					</div>

					{/* CARD: Variety / Content */}
					<div className="bg-white rounded-2xl p-6 border-4 border-[#FFDA00] shadow-[6px_6px_0_#FF7A00] hover:shadow-[8px_8px_0_#FF7A00] transform hover:scale-105 transition-all">
						<Sparkles className="w-10 h-10 text-[#FF7A00] mx-auto mb-2" />
						<p className="text-2xl font-bold text-[#00AEEF]">Epic Quests</p>
						<p className="text-sm text-gray-600">A wide variety for each location</p>
					</div>

					{/* COMMENTED OUT - Req 3: GeoThinkr CTA card on homepage */}
					{/*
					<Link href="/geothinkr" className="bg-white rounded-2xl p-6 border-4 border-[#00AEEF] shadow-[6px_6px_0_#FFDA00] hover:shadow-[8px_8px_0_#FFDA00] transform hover:scale-105 transition-all block">
						<Target className="w-10 h-10 text-[#00AEEF] mx-auto mb-2" />
						<p className="text-2xl font-bold text-[#FF7A00]">GeoThinkr</p>
						<p className="text-sm text-gray-600">Guess campus photo locations on the map</p>
					</Link>
					*/}
				</div>

				{/* SECTION: CTA Button (animated background layers + hover shimmer) */}
				<div className={`flex gap-6 justify-center flex-wrap transition-opacity duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
					<Link 
						href="/map" 
						className="group relative px-10 py-5 bg-[#FF7A00] text-white font-bold text-xl rounded-2xl shadow-[8px_8px_0_#00AEEF] hover:shadow-[10px_10px_0_#00AEEF] transform hover:scale-105 transition-all duration-200 overflow-hidden"
					>
						{/* Label kept above decorative layers via z-index */}
						<span className="relative z-10">Start Your Quest</span>
						{/* Animated shimmer gradient only visible on hover */}
						<div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
						{/* Pulsing glow layers for playful depth */}
						<div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-90 transition-opacity duration-300 animate-pulse"></div>
						<div className="absolute -inset-3 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-2xl blur-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-300 animate-pulse"></div>
					</Link>
				</div>

			</div>
		</div>
	);
}

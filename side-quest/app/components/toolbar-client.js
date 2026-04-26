/*
	Name: toolbar-client.js
	Description: Renders the client-side toolbar with navigation, user info, and notifications.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: Add notifications - 11/06/2025, Add conditional admin page - 11/23/2025,
		Fix navbar width and overflow at mid-range viewports - 03/29/2026
	Errors: N/A
	Input: User object (name, email) from parent component
	Output: Navigation toolbar with links, login/logout buttons, and notifications
*/

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, Compass, Trophy, User, LogOut, Menu, Brain, X, ShoppingBag, Coins, Lightbulb, Swords } from "lucide-react";

const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/avataaars/svg?seed=Default";
import NotificationButton from "./NotificationButton";

/*
	Component: ToolbarClient
	Description:
		Responsive navigation bar that adapts based on authentication state.
		Displays app branding, links to Map, Quests, Leaderboard, and Account pages.
		Shows login button if no user, or user info + logout button if authenticated.
	Props:
		user - Object representing the current user (name, email)
	Returns:
		JSX element for toolbar
*/
export default function ToolbarClient({ user }) {
	const [mobileOpen, setMobileOpen] = useState(false); // mobile if window is too small
	const panelRef = useRef(null);

	// On the leaderboard route, swap the cyan toolbar for a moody dark version
	// so the navbar reads as part of the same HUD environment as the page.
	const pathname = usePathname();
	const isDark = pathname?.startsWith("/leaderboard");

	// Turn it into a hamburger menu if the window is too small (for phones)
	useEffect(() => {
		function onDocClick(e) {
			if (mobileOpen && panelRef.current && !panelRef.current.contains(e.target)) {
				setMobileOpen(false);
			}
		}
		function onResize() {
			if (window.innerWidth >= 1024) setMobileOpen(false);
		}
		// use resize listeners to enable the hamburger on the fly
		document.addEventListener("click", onDocClick);
		window.addEventListener("resize", onResize);
		return () => {
			document.removeEventListener("click", onDocClick);
			window.removeEventListener("resize", onResize);
		};
	}, [mobileOpen]);

	// Animation for points change
	const [pointsChanged, setPointsChanged] = useState(false);
	const prevPoints = useRef(user?.points || 0);

	useEffect(() => {
		if (user?.points > prevPoints.current) {
			setPointsChanged(true);
			const t = setTimeout(() => setPointsChanged(false), 2000); // 2s highlight
			prevPoints.current = user.points;
			return () => clearTimeout(t);
		}
		// Sync if it decreases (no animation) or first load
		prevPoints.current = user?.points || 0;
	}, [user?.points]);

	return (
		<nav className={`sticky top-0 z-50 w-full flex items-center justify-between text-white px-4 md:px-8 py-3 shadow-lg transition-colors ${
			isDark
				? "bg-gradient-to-r from-[#1a0d05] via-[#0a0e14] to-[#1a0d05] border-b border-[#FF7A00]/30 shadow-[0_4px_20px_rgba(255,122,0,0.15)]"
				: "bg-gradient-to-r from-[#00AEEF] to-[#0096D6]"
		}`}>
			<Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
				<div className="relative">
					<Map className="w-7 h-7 text-[#FFDA00] drop-shadow-lg group-hover:rotate-[-12deg] transition-transform duration-300" />
				</div>
				<span className="text-2xl font-extrabold tracking-tight">
					<span className="text-white group-hover:text-[#FFDA00] transition-colors duration-200">Side</span>
					<span className="text-[#FFDA00] group-hover:text-white transition-colors duration-200"> Quest</span>
				</span>
			</Link>

			{/* Navigation Links - visible on lg screens and above */}
			<div className="hidden lg:flex items-center gap-0.5 xl:gap-2 text-sm xl:text-base font-semibold flex-shrink min-w-0">
				<Link href="/map" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <Map className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> Map</Link>
				<Link href="/geothinkr" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <Lightbulb className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> <span className="hidden xl:inline">GeoThinkr</span><span className="xl:hidden">Geo</span></Link>
				<Link href="/multiplayer" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <Swords className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> <span className="hidden xl:inline">Multiplayer</span><span className="xl:hidden">Multi</span></Link>
				<Link href="/quests" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <Compass className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> Quests</Link>
				<Link href="/leaderboard" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <Trophy className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> <span className="hidden xl:inline">Leaderboard</span><span className="xl:hidden">Board</span></Link>
				<Link href="/shop" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <ShoppingBag className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> Shop</Link>
				{/* Admin tab is only visible if user is admin*/}
				{user?.is_admin && (
					<Link href="/admin" className="group flex items-center gap-1.5 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200 whitespace-nowrap"> <Brain className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" /> Admin</Link>
				)}
			</div>

			{/* Right side / auth */}
			<div className="flex items-center gap-3">
				{user && <NotificationButton />}

				{/* Mobile menu button */}
				<button
					className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
					aria-label="Toggle menu"
					onClick={() => setMobileOpen(v => !v)}
				>
					{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
				</button>

				{user ? (
					<>
						<div className={`hidden sm:flex items-center gap-2 text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm mr-2 font-bold border border-[#FFDA00]/30 transition-all duration-500 ${pointsChanged ? "bg-green-500/20 text-green-300 scale-110 border-green-400" : "text-[#FFDA00]"}`}>
							<Coins className={`w-4 h-4 ${pointsChanged ? "animate-spin" : ""}`} />
							<span>{user.points || 0}</span>
						</div>
						<Link href="/account" className="hidden sm:flex items-center gap-2 text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
							<img
								src={user.profile_picture_url || DEFAULT_AVATAR}
								alt="Profile"
								className="w-6 h-6 rounded-full object-cover bg-white/20 border border-white/30 flex-shrink-0"
							/>
							<span>{user.name || user.email}</span>
						</Link>
						<form action="/api/auth/logout" method="post">
							<button type="submit" className={`bg-transparent text-white p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center group ${isDark ? "hover:bg-[#FF7A00]/30" : "hover:bg-[#00AEEF]"}`} title="Logout">
								<LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
							</button>
						</form>
					</>
				) : (
					<Link href="/login" className="hidden sm:inline-block bg-[#FF7A00] hover:bg-[#FF9500] text-white font-semibold px-5 py-2 rounded-lg transition-all duration-200 hover:scale-105">
						Login
					</Link>
				)}
			</div>

			{/* Mobile panel */}
			{mobileOpen && (
				<div ref={panelRef} className={`lg:hidden absolute top-full left-0 right-0 shadow-lg py-3 z-50 ${
					isDark
						? "bg-[#0a0e14] text-white border-t border-[#FF7A00]/30"
						: "bg-white text-[#0b3b4a]"
				}`}>
					<div className="flex flex-col px-4 gap-2">
						<Link href="/map" className={`px-3 py-2 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Map</Link>
						<Link href="/geothinkr" className={`px-3 py-2 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>GeoThinkr</Link>
						<Link href="/multiplayer" className={`px-3 py-2 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Multiplayer</Link>
						<Link href="/quests" className={`px-3 py-2 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Quests</Link>
						<Link href="/leaderboard" className={`px-3 py-2 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Leaderboard</Link>
						<Link href="/shop" className={`px-3 py-2 rounded-md ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Shop</Link>
						{/* Admin tab is only visible if user is admin*/}
						{user?.is_admin && (
							<Link href="/admin" className={`px-3 py-2 rounded-md font-medium ${isDark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>Admin</Link>
						)}
						<div className={`mt-2 pt-2 border-t ${isDark ? "border-white/10" : ""}`}>
							{user ? (
								<div className="flex items-center justify-between">
									<Link href="/account" className="flex items-center gap-3 hover:text-[#FFDA00] transition-colors">
										<img
											src={user.profile_picture_url || DEFAULT_AVATAR}
											alt="Profile"
											className="w-8 h-8 rounded-full object-cover bg-gray-100 border border-gray-200 flex-shrink-0"
										/>
										<div>
											<div className="font-medium">{user.name || user.email}</div>
										</div>
									</Link>
									<form action="/api/auth/logout" method="post">
										<button type="submit" className="px-3 py-2 rounded-md bg-[#FF7A00] text-white">Logout</button>
									</form>
								</div>
							) : (
								<Link href="/login" className="block px-3 py-2 rounded-md bg-[#FF7A00] text-white text-center">Login</Link>
							)}
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}
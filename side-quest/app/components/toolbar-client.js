/*
	Name: toolbar-client.js
	Description: Renders the client-side toolbar with navigation, user info, and notifications.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: Add notifications - 11/06/2025, Add conditional admin page - 11/23/2025
	Errors: N/A
	Input: User object (name, email) from parent component
	Output: Navigation toolbar with links, login/logout buttons, and notifications
*/

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Map, Compass, Trophy, User, LogOut, Menu, Brain, X, ShoppingBag, Coins, Lightbulb, Swords } from "lucide-react";
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

	// Turn it into a hamburger menu if the window is too small (for phones)
	useEffect(() => {
		function onDocClick(e) {
			if (mobileOpen && panelRef.current && !panelRef.current.contains(e.target)) {
				setMobileOpen(false);
			}
		}
		function onResize() {
			if (window.innerWidth >= 768) setMobileOpen(false);
		}
		// use resize listeners to enable the hamburger on the fly
		document.addEventListener("click", onDocClick);
		window.addEventListener("resize", onResize);
		return () => {
			document.removeEventListener("click", onDocClick);
			window.removeEventListener("resize", onResize);
		};
	}, [mobileOpen]);

	return (
		<nav className="sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-[#00AEEF] to-[#0096D6] text-white px-4 md:px-8 py-3 shadow-lg">
			<Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95">
				<div className="relative">
					<Map className="w-7 h-7 text-[#FFDA00] drop-shadow-lg group-hover:rotate-[-12deg] transition-transform duration-300" />
				</div>
				<span className="text-2xl font-extrabold tracking-tight">
					<span className="text-white group-hover:text-[#FFDA00] transition-colors duration-200">Side</span>
					<span className="text-[#FFDA00] group-hover:text-white transition-colors duration-200"> Quest</span>
				</span>
			</Link>

			{/* Navigation Links - Always visible on large screens */}
			<div className="hidden md:flex items-center gap-1 xl:gap-6 text-sm lg:text-lg font-semibold">
				<Link href="/map" className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200"> <Map className="w-5 h-5" /> Map</Link>
				<Link href="/quests" className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200"> <Compass className="w-5 h-5" /> Quests</Link>
				<Link href="/leaderboard" className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200"> <Trophy className="w-5 h-5" /> Leaderboard</Link>
				<Link href="/shop" className="group flex items-center gap-2 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200"> <ShoppingBag className="w-5 h-5" /> Shop</Link>
				<Link href="/multiplayer" className="group flex items-center gap-2 px-2 xl:px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200"> <Swords className="w-5 h-5" /> Multiplayer</Link>
				<div title="Coming Soon" className="hidden xl:flex group items-center gap-2 px-3 py-2 rounded-lg opacity-60 cursor-not-allowed"> <Lightbulb className="w-5 h-5" /> GeoThinkr</div>
				{/* Admin tab is only visible if user is admin*/}
				{user?.is_admin && (
					<Link href="/admin" className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-[#FFDA00] transition-all duration-200"> <Brain className="w-5 h-5" /> Admin </Link>
				)}
			</div>

			{/* Right side / auth */}
			<div className="flex items-center gap-3">
				{user && <NotificationButton />}

				{/* Mobile menu button */}
				<button
					className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
					aria-label="Toggle menu"
					onClick={() => setMobileOpen(v => !v)}
				>
					{mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
				</button>

				{user ? (
					<>
						<div className="hidden sm:flex items-center gap-2 text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm mr-2 text-[#FFDA00] font-bold border border-[#FFDA00]/30">
							<Coins className="w-4 h-4" />
							<span>{user.points || 0}</span>
						</div>
						<Link href="/account" className="hidden sm:flex items-center gap-2 text-sm bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all cursor-pointer">
							<User className="w-4 h-4" />
							<span>{user.name || user.email}</span>
						</Link>
						<form action="/api/auth/logout" method="post">
							<button type="submit" className="bg-transparent hover:bg-[#00AEEF] text-white p-3 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center group" title="Logout">
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
				<div ref={panelRef} className="md:hidden absolute top-full left-0 right-0 bg-white text-[#0b3b4a] shadow-lg py-3 z-50">
					<div className="flex flex-col px-4 gap-2">
						<Link href="/map" className="px-3 py-2 rounded-md hover:bg-gray-100">Map</Link>
						<Link href="/quests" className="px-3 py-2 rounded-md hover:bg-gray-100">Quests</Link>
						<Link href="/leaderboard" className="px-3 py-2 rounded-md hover:bg-gray-100">Leaderboard</Link>
						<Link href="/shop" className="px-3 py-2 rounded-md hover:bg-gray-100">Shop</Link>
						<Link href="/multiplayer" className="px-3 py-2 rounded-md hover:bg-gray-100">Multiplayer</Link>
						<div className="px-3 py-2 rounded-md hover:bg-gray-100 opacity-60">GeoThinkr (Coming Soon)</div>
						{/* Admin tab is only visible if user is admin*/}
						{user?.is_admin && (
							<Link href="/admin" className="px-3 py-2 rounded-md hover:bg-gray-100 font-medium">Admin</Link>
						)}
						<div className="border-t mt-2 pt-2">
							{user ? (
								<div className="flex items-center justify-between">
									<Link href="/account" className="flex items-center gap-3 hover:text-[#FFDA00] transition-colors">
										<User className="w-5 h-5" />
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
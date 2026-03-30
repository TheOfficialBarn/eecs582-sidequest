"use client";

/*
	Name: welcome-modal.js
	Description: Displays a multi-step tutorial walkthrough for first-time users,
	             with a "Don't show again" toggle. Persists completion via /api/welcome cookie
	             and localStorage fallback.
	Programmers: Pashia Vang
	Date: 11/09/2025
	Revisions:
		Trigger re-check on route change - 11/09/2025
		Converted to multi-step tutorial walkthrough - 03/29/2026
	Errors: N/A
	Input: None directly; fetches welcome state from /api/welcome
	Output: Multi-step tutorial overlay for first-time users
*/

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Map, Compass, Lightbulb, Trophy, ShoppingBag } from "lucide-react";

const TUTORIAL_STEPS = [
	{
		icon: Map,
		title: "Welcome to Side Quest!",
		text: "Explore the KU campus, complete challenges, and earn points. This quick walkthrough will show you what you can do.",
		color: "#FF7A00",
	},
	{
		icon: Compass,
		title: "Quests & Map",
		text: "Open the Map to see campus locations. Click a location to view its quests — check them off as you complete challenges around campus!",
		color: "#00AEEF",
	},
	{
		icon: Lightbulb,
		title: "GeoThinkr",
		text: "Test your campus knowledge! You'll see a photo and guess where it was taken on the map. Pick a difficulty and try to get Spot-on for 500 points.",
		color: "#FF7A00",
	},
	{
		icon: Trophy,
		title: "Leaderboard & Points",
		text: "Every quest and GeoThinkr round earns you points. Climb the leaderboard and compete with other students daily, weekly, or all-time.",
		color: "#FFDA00",
	},
	{
		icon: ShoppingBag,
		title: "Shop & Profile",
		text: "Spend your points in the shop and customize your profile. You're all set — go explore!",
		color: "#00AEEF",
	},
];

export default function WelcomeModal() {
	const [shouldShow, setShouldShow] = useState(false);
	const [loading, setLoading] = useState(true);
	const [dismissing, setDismissing] = useState(false);
	const [step, setStep] = useState(0);
	const pathname = usePathname();

	useEffect(() => {
		let mounted = true;
		setLoading(true);

		async function checkWelcomeStatus() {
			try {
				const res = await fetch("/api/welcome", { credentials: "include" });
				if (!mounted) return;

				if (!res.ok) {
					setShouldShow(false);
					return;
				}

				const data = await res.json();
				setShouldShow(Boolean(data?.show));
			} catch {
				if (mounted) setShouldShow(false);
			} finally {
				if (mounted) setLoading(false);
			}
		}

		checkWelcomeStatus();

		return () => { mounted = false; };
	}, [pathname]);

	const dismiss = useCallback(async () => {
		if (dismissing) return;
		setDismissing(true);
		setShouldShow(false);

		try {
			await fetch("/api/welcome", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ seen: true }),
				credentials: "include",
			});
		} catch {
			// Ignored; the modal is already closed client-side.
		} finally {
			setDismissing(false);
		}
	}, [dismissing]);

	if (loading || !shouldShow) {
		return null;
	}

	const current = TUTORIAL_STEPS[step];
	const Icon = current.icon;
	const isLast = step === TUTORIAL_STEPS.length - 1;

	return (
		<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
			<div className="relative w-full max-w-lg bg-white rounded-3xl border-4 border-[#FF7A00] shadow-[14px_14px_0_#00AEEF] p-6 md:p-8 text-center">
				<button
					type="button"
					onClick={dismiss}
					className="absolute -top-4 -right-4 md:-top-5 md:-right-5 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border-2 border-[#FF7A00] text-[#FF7A00] flex items-center justify-center shadow-lg transition-all duration-200 hover:bg-[#FF7A00] hover:text-white cursor-pointer"
					aria-label="Close tutorial"
				>
					<X className="w-5 h-5 md:w-6 md:h-6" />
				</button>

				{/* Step indicator */}
				<div className="flex justify-center gap-1.5 mb-4">
					{TUTORIAL_STEPS.map((_, i) => (
						<div
							key={i}
							className={`h-1.5 rounded-full transition-all duration-300 ${
								i === step ? 'w-6 bg-[#FF7A00]' : 'w-1.5 bg-gray-200'
							}`}
						/>
					))}
				</div>

				{/* Icon */}
				<div
					className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
					style={{ backgroundColor: `${current.color}15` }}
				>
					<Icon className="w-8 h-8" style={{ color: current.color }} />
				</div>

				<h2 className="text-2xl md:text-3xl font-black text-[#FF7A00] mb-3">
					{current.title}
				</h2>
				<p className="text-gray-600 leading-relaxed mb-6 text-sm md:text-base">
					{current.text}
				</p>

				{/* Navigation */}
				<div className="flex items-center justify-between gap-3">
					<button
						type="button"
						onClick={() => setStep(s => s - 1)}
						disabled={step === 0}
						className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
					>
						<ChevronLeft className="w-4 h-4" /> Back
					</button>

					{isLast ? (
						<button
							type="button"
							onClick={dismiss}
							className="flex items-center gap-1 px-8 py-3 rounded-xl text-sm font-bold bg-[#00AEEF] text-white hover:bg-[#0096D6] cursor-pointer transition-all shadow-md"
						>
							Let&apos;s Explore!
						</button>
					) : (
						<button
							type="button"
							onClick={() => setStep(s => s + 1)}
							className="flex items-center gap-1 px-6 py-3 rounded-xl text-sm font-bold bg-[#FF7A00] text-white hover:bg-[#FF9500] cursor-pointer transition-all shadow-md"
						>
							Next <ChevronRight className="w-4 h-4" />
						</button>
					)}
				</div>

			</div>
		</div>
	);
}

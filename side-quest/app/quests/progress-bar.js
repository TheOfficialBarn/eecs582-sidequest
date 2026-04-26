/*
	Name: progress-bar.js
	Description: Animated progress bar component that visually fills from 0% to a target percentage when scrolled into view.
	Programmers: Pashia Vang
	Date: 11/06/2025
	Revisions: N/A
	Errors: N/A
	Input: 
		- percentage: Target progress value (0–100)
		- color (string): Bar fill color
		- shadowColor (string): Shadow color 
	Output: 
		- animated progress bar
		- Optional sparkle effect when progress reaches 100%
*/


"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

/*
	Component: AnimatedProgressBar
	Description: Progress bar that animates from 0% to target percentage when scrolled into view.
	Props:
		percentage - The target percentage (0-100)
		color - The border color for the progress bar
		shadowColor - The shadow color (not used but kept for consistency)
*/
export default function AnimatedProgressBar({ percentage, color, shadowColor }) {
	const [visible, setVisible] = useState(false);
	const progressRef = useRef(null);

	useEffect(() => {
		const node = progressRef.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setVisible(true);
						observer.disconnect();
					}
				});
			},
			{ threshold: 0.2 }
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return (
		<div
			ref={progressRef}
			className="mb-6 h-5 bg-gray-100 rounded-full overflow-hidden border-2 border-gray-200"
		>
			{/* CSS-driven width transition — one render, browser tweens on the compositor */}
			<div
				className="h-full rounded-full relative"
				style={{
					width: `${visible ? percentage : 0}%`,
					backgroundColor: color,
					transition: 'width 800ms ease-out',
				}}
			>
				{visible && percentage === 100 && (
					<div className="absolute inset-0 flex items-center justify-center">
						<Sparkles className="w-4 h-4 text-white animate-pulse" />
					</div>
				)}
			</div>
		</div>
	);
}


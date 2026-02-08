
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Map, Trophy, Target, ArrowRight, RefreshCw, X, Check } from "lucide-react";

export default function GeoThinkrPage() {
	const [gameState, setGameState] = useState('loading'); // loading, playing, result, error
	const [photo, setPhoto] = useState(null);
	const [result, setResult] = useState(null);
	const [guess, setGuess] = useState(null);
	const mapRef = useRef(null);

	const MAP_WIDTH_ORIGINAL = 1669;
	const MAP_HEIGHT_ORIGINAL = 1535;

	async function loadNewGame() {
		setGameState('loading');
		setResult(null);
		setGuess(null);
		try {
			const res = await fetch("/api/geothinkr/game");

			if (res.status === 401) {
				// Redirect to login
				window.location.href = "/login";
				return;
			}

			if (res.status === 404) {
				setGameState('empty');
				return;
			}

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText || "Failed to load game");
			}

			const data = await res.json();
			setPhoto(data);
			setGameState('playing');
		} catch (err) {
			console.error(err);
			setGameState('error');
		}
	}

	useEffect(() => {
		loadNewGame();
	}, []);

	async function handleMapClick(e) {
		if (gameState !== 'playing' || !photo) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		// Calculate scale relative to original map size
		const scaleX = rect.width / MAP_WIDTH_ORIGINAL;
		const scaleY = rect.height / MAP_HEIGHT_ORIGINAL;

		// Normalize to original coordinates
		const originalX = clickX / scaleX;
		const originalY = clickY / scaleY;

		setGuess({ x: clickX, y: clickY, originalX, originalY, mapWidth: rect.width, mapHeight: rect.height });

		// Submit immediately
		try {
			const res = await fetch("/api/geothinkr/game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					photo_id: photo.photo_id,
					x: Math.round(originalX),
					y: Math.round(originalY)
				})
			});

			if (!res.ok) throw new Error("Failed to submit guess");
			const data = await res.json();

			// Result comes back with correct X/Y in original coords.
			// We need to scale them to current map display size for rendering line/target.
			// Wait, map display size might change if window resizes, but usually fine for immediate result.
			// Better to store scale factor or re-calculate.
			// We use the same map instance so size is same.

			setResult({
				...data,
				displayCorrectX: data.correct_x * scaleX,
				displayCorrectY: data.correct_y * scaleY,
				displayGuessX: clickX,
				displayGuessY: clickY
			});
			setGameState('result');
		} catch (err) {
			console.error(err);
			alert("Error submitting guess");
		}
	}

	if (gameState === 'loading') {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
			</div>
		);
	}

	if (gameState === 'empty') {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4 text-center p-4">
				<div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
					<Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Challenges</h2>
					<p className="text-gray-500 mb-6">There are no mystery photos to guess right now. Please check back later!</p>
					<Link href="/" className="bg-[#00AEEF] text-white px-6 py-2 rounded-full font-bold hover:bg-[#0096D6]">Return Home</Link>
				</div>
			</div>
		);
	}

	if (gameState === 'error') {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
				<p className="text-xl font-bold text-gray-800">Something went wrong!</p>
				<button onClick={loadNewGame} className="bg-[#FF7A00] text-white px-6 py-2 rounded-full font-bold">Try Again</button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
			{/* Header */}
			<div className="w-full max-w-4xl flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Target className="w-8 h-8 text-[#FF7A00]" />
					<h1 className="text-2xl font-black text-gray-800">GeoThinkr</h1>
				</div>
				<div className="flex items-center gap-4">
					<Link href="/" className="text-gray-500 hover:text-gray-800 font-bold">Exit</Link>
				</div>
			</div>

			{/* Game Content */}
			<div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 h-[80vh]">

				{/* Photo Side */}
				<div className="bg-white rounded-2xl shadow-xl overflow-hidden relative flex flex-col">
					<div className="flex-1 relative bg-black">
						{photo && (
							<img
								src={photo.image_url}
								className="absolute inset-0 w-full h-full object-contain"
								alt="Where am I?"
							/>
						)}
						{/* Result Overlay on Photo */}
						{result && (
							<div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6 text-white text-center animate-in slide-in-from-bottom duration-500">
								<h2 className="text-3xl font-black text-[#FFDA00] mb-2">{result.tier}</h2>
								<p className="text-lg opacity-90 mb-1">
									You were <strong>{Math.round(result.distance)}px</strong> away.
								</p>
								<p className="text-sm opacity-75 mb-6">Correct Location: {result.location_name}</p>

								<div className="flex items-center justify-center gap-4">
									<div className="text-center">
										<div className="text-4xl font-bold text-green-400">+{result.points}</div>
										<div className="text-xs font-bold uppercase tracking-wider">Points Earned</div>
									</div>
								</div>
								<button
									onClick={loadNewGame}
									className="mt-6 bg-[#FF7A00] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-[#FF9500] hover:scale-105 transition-all shadow-lg flex items-center gap-2 mx-auto"
								>
									<RefreshCw className="w-5 h-5" /> Play Again
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Map Side */}
				<div className="bg-white rounded-2xl shadow-xl p-2 relative overflow-hidden flex flex-col items-center justify-center bg-gray-100">
					<div
						className="relative rounded-xl overflow-hidden border-4 border-gray-200 cursor-crosshair group shadow-inner"
						style={{ aspectRatio: '1669/1535', width: '100%', maxWidth: '600px' }}
					>
						<div
							ref={mapRef}
							className="relative w-full h-full"
							onClick={handleMapClick}
						>
							<img
								src="/map.png"
								className="w-full h-full object-fill" // Use object-fill to guarantee coordinate match, map distortion is minimal/acceptable or handled by aspect-ratio container
								alt="Game Map"
								draggable={false}
							/>

							{/* Hover effect prompt */}
							{gameState === 'playing' && (
								<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg font-bold text-gray-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
									Click where you think this is!
								</div>
							)}

							{/* Result Visualization */}
							{result && (
								<>
									{/* Line connecting them */}
									<svg className="absolute inset-0 pointer-events-none w-full h-full" style={{ zIndex: 10 }}>
										<line
											x1={result.displayGuessX}
											y1={result.displayGuessY}
											x2={result.displayCorrectX}
											y2={result.displayCorrectY}
											stroke="#FF7A00"
											strokeWidth="3"
											strokeDasharray="5,5"
										/>
									</svg>

									{/* User Guess */}
									<div
										className="absolute w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-20"
										style={{ left: result.displayGuessX, top: result.displayGuessY }}
									>
										<X className="w-4 h-4 text-white" />
									</div>

									{/* Correct Location */}
									<div
										className="absolute w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-20 animate-bounce"
										style={{ left: result.displayCorrectX, top: result.displayCorrectY }}
									>
										<Target className="w-5 h-5 text-white" />
									</div>
								</>
							)}
						</div>
					</div>
				</div>

			</div>
		</div>
	);
}

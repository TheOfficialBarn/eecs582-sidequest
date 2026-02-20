/*
	Name: geothinkr/page.js
	Description: GeoThinkr game page with difficulty selection, hint system, and zoom-based map.
	Programmers: Aiden Barnard
	Date: 2/09/2026
	Revisions: Added difficulty picker, hints, zoom, leaderboard link - 2/19/2026
	Errors: N/A
	Input:
		- User auth token (cookie)
		- Photo data from API
	Output:
		- Interactive GeoThinkr game with difficulty levels and hints
*/

"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, Lightbulb, RefreshCw, X, HelpCircle, Eye } from "lucide-react";

/*
	Component: GeoThinkrPage
	Description: Main GeoThinkr game with difficulty picker, zoom-based map,
	             hint system with point cost, and result overlay.
	Returns: JSX for the full game page
*/
export default function GeoThinkrPage() {
	const [gameState, setGameState] = useState('menu'); // menu, loading, playing, result, error, empty
	const [difficulty, setDifficulty] = useState(null);
	const [photo, setPhoto] = useState(null);
	const [result, setResult] = useState(null);
	const [guess, setGuess] = useState(null);
	const [hintsUsed, setHintsUsed] = useState(0);
	const [hint1Revealed, setHint1Revealed] = useState(false);
	const [hint2Revealed, setHint2Revealed] = useState(false);
	const mapRef = useRef(null);

	const MAP_WIDTH_ORIGINAL = 1669;
	const MAP_HEIGHT_ORIGINAL = 1535;

	/*
		Function: getMapZoom
		Description: Returns CSS transform scale and offset config based on difficulty.
		Arguments: diff - difficulty string
		Returns: { scale, description }
	*/
	function getMapZoom(diff) {
		switch (diff) {
			case "easy": return { scale: 2.5, description: "Zoomed into a campus section" };
			case "medium": return { scale: 1.5, description: "Half campus view" };
			case "hard": return { scale: 1, description: "Full campus map" };
			default: return { scale: 1, description: "Full campus map" };
		}
	}

	/*
		Function: loadNewGame
		Description: Fetches a new random photo from the API.
		Arguments: none (uses difficulty state)
		Returns: void (updates state)
	*/
	async function loadNewGame() {
		setGameState('loading');
		setResult(null);
		setGuess(null);
		setHintsUsed(0);
		setHint1Revealed(false);
		setHint2Revealed(false);
		try {
			const url = "/api/geothinkr/game";
			const res = await fetch(url);

			if (res.status === 401) {
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

	/*
		Function: startGame
		Description: Sets difficulty and begins loading a new game.
		Arguments: diff - "easy", "medium", or "hard"
		Returns: void
	*/
	function startGame(diff) {
		setDifficulty(diff);
	}

	useEffect(() => {
		if (difficulty) loadNewGame();
	}, [difficulty]);

	/*
		Function: handleMapClick
		Description: Processes the user's click on the map, submits guess to API.
		Arguments: e - click event
		Returns: void (updates state with result)
	*/
	async function handleMapClick(e) {
		if (gameState !== 'playing' || !photo) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		const scaleX = rect.width / MAP_WIDTH_ORIGINAL;
		const scaleY = rect.height / MAP_HEIGHT_ORIGINAL;

		const originalX = clickX / scaleX;
		const originalY = clickY / scaleY;

		setGuess({ x: clickX, y: clickY, originalX, originalY, mapWidth: rect.width, mapHeight: rect.height });

		try {
			const res = await fetch("/api/geothinkr/game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					photo_id: photo.photo_id,
					x: Math.round(originalX),
					y: Math.round(originalY),
					hints_used: hintsUsed,
					difficulty: difficulty || "easy"
				})
			});

			if (!res.ok) throw new Error("Failed to submit guess");
			const data = await res.json();

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

	// Difficulty selection menu
	if (gameState === 'menu') {
		return (
			<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex flex-col items-center justify-center p-4">
				<div className="max-w-lg w-full text-center">
					<Lightbulb className="w-16 h-16 text-[#FF7A00] mx-auto mb-4" />
					<h1 className="text-4xl font-black text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-2">GeoThinkr</h1>
					<p className="text-[#00AEEF] mb-8">Guess where campus photos were taken on the map!</p>

					<div className="space-y-4">
						<button
							onClick={() => startGame("easy")}
							className="w-full bg-white border-4 border-[#00AEEF] text-[#00AEEF] rounded-2xl p-6 shadow-[6px_6px_0_#FF7A00] hover:shadow-[8px_8px_0_#FF7A00] hover:scale-[1.02] transition-all"
						>
							<div className="text-2xl font-bold">Easy</div>
							<div className="text-sm text-gray-600">Zoomed map view · Wider scoring radius</div>
						</button>
						<button
							onClick={() => startGame("medium")}
							className="w-full bg-white border-4 border-[#FF7A00] text-[#FF7A00] rounded-2xl p-6 shadow-[6px_6px_0_#00AEEF] hover:shadow-[8px_8px_0_#00AEEF] hover:scale-[1.02] transition-all"
						>
							<div className="text-2xl font-bold">Medium</div>
							<div className="text-sm text-gray-600">Half campus view · Standard scoring</div>
						</button>
						<button
							onClick={() => startGame("hard")}
							className="w-full bg-white border-4 border-[#FFDA00] text-[#FF7A00] rounded-2xl p-6 shadow-[6px_6px_0_#FF7A00] hover:shadow-[8px_8px_0_#FF7A00] hover:scale-[1.02] transition-all"
						>
							<div className="text-2xl font-bold">Hard</div>
							<div className="text-sm text-gray-600">Full map · Tight scoring radius</div>
						</button>
					</div>
				</div>
			</div>
		);
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
			<div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex-col gap-4 text-center p-4">
				<div className="bg-white p-8 rounded-2xl shadow-lg border-4 border-[#00AEEF] max-w-md">
					<Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
					<h2 className="text-2xl font-bold text-[#FF7A00] mb-2">No Active Challenges</h2>
					<p className="text-gray-500 mb-6">There are no mystery photos to guess right now. Check back later!</p>
					<button onClick={() => { setDifficulty(null); setGameState('menu'); }} className="bg-[#FF7A00] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#FF9500] transition-all">Change Difficulty</button>
				</div>
			</div>
		);
	}

	if (gameState === 'error') {
		return (
			<div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex-col gap-4">
				<p className="text-xl font-bold text-[#FF7A00]">Something went wrong!</p>
				<button onClick={loadNewGame} className="bg-[#FF7A00] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#FF9500] transition-all">Try Again</button>
			</div>
		);
	}

	const zoom = getMapZoom(difficulty);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex flex-col items-center p-4">
			{/* Header */}
			<div className="w-full max-w-4xl flex items-center justify-between mb-6">
				<div className="flex items-center gap-3">
					<Lightbulb className="w-8 h-8 text-[#FF7A00]" />
					<h1 className="text-2xl font-black text-[#FF7A00]">GeoThinkr</h1>
					<span className={`text-xs font-bold px-2 py-1 rounded-full ${
						difficulty === 'easy' ? 'bg-[#00AEEF]/10 text-[#00AEEF]' :
						difficulty === 'medium' ? 'bg-[#FF7A00]/10 text-[#FF7A00]' :
						'bg-red-100 text-red-700'
					}`}>{difficulty?.toUpperCase()}</span>
				</div>
				<button onClick={() => { setDifficulty(null); setGameState('menu'); }} className="text-[#00AEEF] hover:text-[#0096D6] font-bold">Menu</button>
			</div>

			{/* Game Content */}
			<div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 h-[80vh]">

				{/* Photo Side */}
				<div className="bg-white rounded-2xl shadow-lg border-4 border-[#FF7A00] overflow-hidden relative flex flex-col">
					<div className="flex-1 relative bg-black">
						{photo && (
							<img
								src={photo.image_url}
								className="absolute inset-0 w-full h-full object-contain"
								alt="Where am I?"
							/>
						)}

						{/* Hint Buttons */}
						{gameState === 'playing' && (
							<div className="absolute bottom-4 left-4 right-4 flex gap-2">
								<button
									onClick={() => { if (!hint1Revealed) { setHint1Revealed(true); setHintsUsed(h => h + 1); } }}
									className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
										hint1Revealed
											? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
											: 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-lg'
									}`}
								>
									<HelpCircle className="w-4 h-4" />
									{hint1Revealed
										? `Near a ${photo?.category || 'landmark'}`
										: 'Hint 1 (-100 pts)'}
								</button>
								<button
									onClick={() => { if (!hint2Revealed) { setHint2Revealed(true); setHintsUsed(h => h + 1); } }}
									className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
										hint2Revealed
											? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
											: 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-lg'
									}`}
								>
									<Eye className="w-4 h-4" />
									{hint2Revealed
										? photo?.location_name || 'Unknown'
										: 'Hint 2 (-200 pts)'}
								</button>
							</div>
						)}

						{/* Result Overlay on Photo */}
						{result && (
							<div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6 text-white text-center animate-in slide-in-from-bottom duration-500">
								<h2 className="text-3xl font-black text-[#FFDA00] mb-2">{result.tier}</h2>
								<p className="text-lg opacity-90 mb-1">
									You were <strong>{Math.round(result.distance)}px</strong> away.
								</p>
								<p className="text-sm opacity-75 mb-1">Correct Location: {result.location_name}</p>
								{result.category && (
									<p className="text-xs opacity-60 mb-4">Category: {result.category}</p>
								)}

								{hintsUsed > 0 && (
									<p className="text-xs text-yellow-300 mb-2">Hints used: {hintsUsed} (-{hintsUsed * 100} pts)</p>
								)}

								<div className="flex items-center justify-center gap-4">
									<div className="text-center">
										<div className="text-4xl font-bold text-green-400">+{result.points}</div>
										<div className="text-xs font-bold uppercase tracking-wider">Points Earned</div>
									</div>
								</div>

								{result.achievements_earned && result.achievements_earned.length > 0 && (
									<div className="mt-3 flex justify-center gap-2 flex-wrap">
										{result.achievements_earned.map(key => (
											<span key={key} className="bg-[#FFDA00] text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
												🏆 Achievement Unlocked: {key.replace(/_/g, ' ')}
											</span>
										))}
									</div>
								)}

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
				<div className="bg-white rounded-2xl shadow-lg border-4 border-[#00AEEF] p-2 relative overflow-hidden flex flex-col items-center justify-center">
					<div
						className="relative rounded-xl overflow-hidden border-4 border-gray-200 cursor-crosshair group shadow-inner"
						style={{ aspectRatio: '1669/1535', width: '100%', maxWidth: '600px' }}
					>
						<div
							ref={mapRef}
							className="relative w-full h-full overflow-hidden"
							onClick={handleMapClick}
							style={zoom.scale > 1 ? {
								overflow: 'hidden'
							} : {}}
						>
							<img
								src="/map.png"
								className="w-full h-full object-fill"
								alt="Game Map"
								draggable={false}
								style={zoom.scale > 1 ? {
									transform: `scale(${zoom.scale})`,
									transformOrigin: 'center center'
								} : {}}
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

									{/* Location */}
									<div
										className="absolute w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-20 animate-bounce"
										style={{ left: result.displayCorrectX, top: result.displayCorrectY }}
									>
										<Lightbulb className="w-5 h-5 text-white" />
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

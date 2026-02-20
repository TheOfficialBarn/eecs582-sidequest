/*
	Name: geothinkr/page.js
	Description: GeoThinkr game page with difficulty selection, hint system, zoom-based map,
	             multi-round sessions (5 rounds), countdown timer, and end-game summary.
	Programmers: Aiden Barnard
	Date: 2/09/2026
	Revisions: Added difficulty picker, hints, zoom, leaderboard link - 2/19/2026,
	           Added timer, multi-round game, and end-game summary - 2/19/2026
	Errors: N/A
	Input:
		- User auth token (cookie)
		- Photo data from API
	Output:
		- Interactive GeoThinkr game with difficulty levels, hints, timer, and summary
*/

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trophy, Lightbulb, RefreshCw, X, HelpCircle, Eye, Clock } from "lucide-react";

const TOTAL_ROUNDS = 5;

/*
	Component: GeoThinkrPage
	Description: Main GeoThinkr game with difficulty picker, zoom-based map,
	             hint system with point cost, round timer, multi-round sessions,
	             and end-game score summary.
	Returns: JSX for the full game page
*/
export default function GeoThinkrPage() {
	const [gameState, setGameState] = useState('menu'); // menu, loading, playing, result, error, empty, summary
	const [difficulty, setDifficulty] = useState(null);
	const [photo, setPhoto] = useState(null);
	const [result, setResult] = useState(null);
	const [guess, setGuess] = useState(null);
	const [hintsUsed, setHintsUsed] = useState(0);
	const [hint1Revealed, setHint1Revealed] = useState(false);
	const [hint2Revealed, setHint2Revealed] = useState(false);
	const mapRef = useRef(null);

	// Multi-round state
	const [currentRound, setCurrentRound] = useState(1);
	const [roundResults, setRoundResults] = useState([]);
	const [sessionPhotoIds, setSessionPhotoIds] = useState([]);

	// Timer state
	const [timeLimit, setTimeLimit] = useState(null); // null=unlimited, 30, 60, or 90
	const [timeRemaining, setTimeRemaining] = useState(null);

	// Refs for stale closure avoidance in timer callback
	const guessRef = useRef(null);
	const photoRef = useRef(null);
	const hintsUsedRef = useRef(0);
	const difficultyRef = useRef(null);
	const mapContainerRef = useRef(null);
	const submitGuessRef = useRef(null);

	const MAP_WIDTH_ORIGINAL = 1669;
	const MAP_HEIGHT_ORIGINAL = 1535;

	// Keep refs in sync with state
	useEffect(() => { guessRef.current = guess; }, [guess]);
	useEffect(() => { photoRef.current = photo; }, [photo]);
	useEffect(() => { hintsUsedRef.current = hintsUsed; }, [hintsUsed]);
	useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

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
		Description: Fetches a new random photo from the API, excluding already-seen photos.
		Arguments: excludeIds - array of photo IDs to exclude
		Returns: void (updates state)
	*/
	async function loadNewGame(excludeIds = []) {
		setGameState('loading');
		setResult(null);
		setGuess(null);
		setHintsUsed(0);
		setHint1Revealed(false);
		setHint2Revealed(false);
		try {
			let url = "/api/geothinkr/game";
			if (excludeIds.length > 0) {
				url += `?exclude=${excludeIds.join(",")}`;
			}
			const res = await fetch(url);

			if (res.status === 401) {
				window.location.href = "/login";
				return;
			}

			if (res.status === 404) {
				// If mid-session with completed rounds, go to summary instead of empty
				if (roundResults.length > 0) {
					setGameState('summary');
				} else {
					setGameState('empty');
				}
				return;
			}

			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText || "Failed to load game");
			}

			const data = await res.json();
			setPhoto(data);
			setSessionPhotoIds(prev => [...prev, data.photo_id]);
			setGameState('playing');
			setTimeRemaining(timeLimit);
		} catch (err) {
			console.error(err);
			setGameState('error');
		}
	}

	/*
		Function: startGame
		Description: Resets all session state and begins a new multi-round game.
		Arguments: diff - "easy", "medium", or "hard"
		Returns: void
	*/
	function startGame(diff) {
		setCurrentRound(1);
		setRoundResults([]);
		setSessionPhotoIds([]);
		setDifficulty(diff);
		loadNewGame([]);
	}

	/*
		Function: submitGuess
		Description: Submits a guess to the API and records the round result.
		Arguments: x, y - original map coordinates; displayX, displayY - display coordinates
		Returns: void (updates state with result)
	*/
	async function submitGuess(x, y, displayX, displayY) {
		const currentPhoto = photoRef.current;
		if (!currentPhoto) return;

		try {
			const res = await fetch("/api/geothinkr/game", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					photo_id: currentPhoto.photo_id,
					x: Math.round(x),
					y: Math.round(y),
					hints_used: hintsUsedRef.current,
					difficulty: difficultyRef.current || "easy"
				})
			});

			if (!res.ok) throw new Error("Failed to submit guess");
			const data = await res.json();

			const mapContainer = mapContainerRef.current;
			const rect = mapContainer ? mapContainer.getBoundingClientRect() : null;
			const scaleX = rect ? rect.width / MAP_WIDTH_ORIGINAL : 1;
			const scaleY = rect ? rect.height / MAP_HEIGHT_ORIGINAL : 1;

			const resultData = {
				...data,
				displayCorrectX: data.correct_x * scaleX,
				displayCorrectY: data.correct_y * scaleY,
				displayGuessX: displayX,
				displayGuessY: displayY
			};

			setResult(resultData);

			// Record round result
			setRoundResults(prev => [...prev, {
				round: currentRound,
				location_name: data.location_name,
				category: data.category,
				distance: data.distance,
				tier: data.tier,
				points: data.points,
				hintsUsed: hintsUsedRef.current
			}]);

			setGameState('result');
		} catch (err) {
			console.error(err);
			alert("Error submitting guess");
		}
	}

	// Keep submitGuess ref in sync
	submitGuessRef.current = submitGuess;

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

		await submitGuess(originalX, originalY, clickX, clickY);
	}

	/*
		Function: handleTimeUp
		Description: Called when the timer reaches 0. Auto-submits with (0,0) if no guess placed.
		Arguments: none
		Returns: void
	*/
	const handleTimeUp = useCallback(() => {
		// Auto-submit at (0,0) — scoring naturally gives 0 points
		submitGuessRef.current(0, 0, 0, 0);
	}, []);

	/*
		Function: handleNextRound
		Description: Advances to the next round or shows summary after the final round.
		Arguments: none
		Returns: void
	*/
	function handleNextRound() {
		if (currentRound >= TOTAL_ROUNDS) {
			setGameState('summary');
		} else {
			const nextRound = currentRound + 1;
			setCurrentRound(nextRound);
			loadNewGame(sessionPhotoIds);
		}
	}

	/*
		Function: handleNewGame
		Description: Full reset — clears rounds, session, returns to menu.
		Arguments: none
		Returns: void
	*/
	function handleNewGame() {
		setCurrentRound(1);
		setRoundResults([]);
		setSessionPhotoIds([]);
		setDifficulty(null);
		setTimeLimit(null);
		setTimeRemaining(null);
		setResult(null);
		setGuess(null);
		setPhoto(null);
		setGameState('menu');
	}

	// Timer effect
	useEffect(() => {
		if (gameState !== 'playing' || timeLimit === null) return;

		const startTime = Date.now();
		const endTime = startTime + timeLimit * 1000;

		const interval = setInterval(() => {
			const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
			setTimeRemaining(remaining);

			if (remaining <= 0) {
				clearInterval(interval);
				handleTimeUp();
			}
		}, 200);

		return () => clearInterval(interval);
	}, [gameState, timeLimit, currentRound, handleTimeUp]);

	/*
		Function: getTierColor
		Description: Returns Tailwind color classes for a scoring tier.
		Arguments: tier - scoring tier string
		Returns: string of Tailwind classes
	*/
	function getTierColor(tier) {
		switch (tier) {
			case "Spot-on!": return "bg-green-100 text-green-700 border-green-300";
			case "Close enough": return "bg-yellow-100 text-yellow-700 border-yellow-300";
			default: return "bg-red-100 text-red-700 border-red-300";
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

					{/* Time Limit Selector */}
					<div className="mb-6">
						<p className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Round Timer</p>
						<div className="flex justify-center gap-2">
							{[
								{ value: null, label: "Unlimited" },
								{ value: 30, label: "30s" },
								{ value: 60, label: "60s" },
								{ value: 90, label: "90s" }
							].map(opt => (
								<button
									key={opt.label}
									onClick={() => setTimeLimit(opt.value)}
									className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
										timeLimit === opt.value
											? 'bg-[#FF7A00] text-white shadow-lg scale-105'
											: 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#FF7A00] hover:text-[#FF7A00]'
									}`}
								>
									<span className="flex items-center gap-1">
										{opt.value !== null && <Clock className="w-3 h-3" />}
										{opt.label}
									</span>
								</button>
							))}
						</div>
					</div>

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
					<button onClick={handleNewGame} className="bg-[#FF7A00] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#FF9500] transition-all">Back to Menu</button>
				</div>
			</div>
		);
	}

	if (gameState === 'error') {
		return (
			<div className="flex h-screen items-center justify-center bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex-col gap-4">
				<p className="text-xl font-bold text-[#FF7A00]">Something went wrong!</p>
				<button onClick={() => loadNewGame(sessionPhotoIds)} className="bg-[#FF7A00] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#FF9500] transition-all">Try Again</button>
			</div>
		);
	}

	// Summary screen
	if (gameState === 'summary') {
		const totalScore = roundResults.reduce((sum, r) => sum + r.points, 0);
		const maxPossible = TOTAL_ROUNDS * 500;
		const roundsPlayed = roundResults.length;

		return (
			<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 flex flex-col items-center justify-center p-4">
				<div className="max-w-lg w-full">
					<div className="bg-white rounded-2xl shadow-lg border-4 border-[#FF7A00] p-8 text-center">
						<Trophy className="w-16 h-16 text-[#FFDA00] mx-auto mb-4" />
						<h1 className="text-3xl font-black text-[#FF7A00] mb-1">Game Complete!</h1>
						<p className="text-gray-500 mb-6">{roundsPlayed} round{roundsPlayed !== 1 ? 's' : ''} played · {difficulty?.toUpperCase()} difficulty</p>

						{/* Total Score */}
						<div className="bg-gradient-to-r from-[#FF7A00] to-[#FFDA00] rounded-2xl p-6 mb-6 text-white">
							<div className="text-6xl font-black">{totalScore}</div>
							<div className="text-sm font-bold opacity-80">out of {maxPossible} possible points</div>
						</div>

						{/* Per-round breakdown */}
						<div className="space-y-2 mb-6 text-left">
							{roundResults.map((r, i) => (
								<div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
									<div className="w-8 h-8 bg-[#00AEEF] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
										{r.round}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-bold text-gray-800 truncate">{r.location_name || 'Unknown'}</div>
										{r.hintsUsed > 0 && (
											<div className="text-xs text-yellow-600">{r.hintsUsed} hint{r.hintsUsed !== 1 ? 's' : ''} used</div>
										)}
									</div>
									<span className={`text-xs font-bold px-2 py-1 rounded-full border flex-shrink-0 ${getTierColor(r.tier)}`}>
										{r.tier}
									</span>
									<div className="font-bold text-[#FF7A00] w-12 text-right flex-shrink-0">+{r.points}</div>
								</div>
							))}
						</div>

						<button
							onClick={handleNewGame}
							className="w-full bg-[#FF7A00] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#FF9500] hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-2"
						>
							<RefreshCw className="w-5 h-5" /> Play Again
						</button>
					</div>
				</div>
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
				<div className="flex items-center gap-4">
					{/* Round Counter */}
					<span className="text-sm font-bold text-gray-600">
						Round {currentRound} / {TOTAL_ROUNDS}
					</span>

					{/* Timer Display */}
					{timeLimit !== null && gameState === 'playing' && timeRemaining !== null && (
						<span className={`font-mono font-bold text-lg px-3 py-1 rounded-full ${
							timeRemaining <= 10
								? 'bg-red-100 text-red-600 animate-pulse'
								: 'bg-gray-100 text-gray-700'
						}`}>
							<Clock className="w-4 h-4 inline mr-1" />
							{timeRemaining}s
						</span>
					)}

					<button onClick={handleNewGame} className="text-[#00AEEF] hover:text-[#0096D6] font-bold">Menu</button>
				</div>
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
									onClick={handleNextRound}
									className="mt-6 bg-[#FF7A00] text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-[#FF9500] hover:scale-105 transition-all shadow-lg flex items-center gap-2 mx-auto"
								>
									<RefreshCw className="w-5 h-5" />
									{currentRound >= TOTAL_ROUNDS ? "See Results" : `Next Round (${currentRound}/${TOTAL_ROUNDS})`}
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
							ref={(el) => { mapRef.current = el; mapContainerRef.current = el; }}
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

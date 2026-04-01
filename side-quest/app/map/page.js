/*
	Name: map/page.js
	Description: Map viewing page. Main map interface for tracking quest progress.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: Add notifications and progress bars - 11/06/2025, Add navigation buttons and animations - 11/22/2025
	Errors: N/A
	Input: Map data, user progress from API, user interactions
	Output: Interactive map UI with nodes, Dialogs, progress indicators, and notifications
*/

"use client";

import Image from "next/image";
import { useRef, useState, useEffect, useMemo } from "react";
import { useMapData } from "./mapData";
import { Node, NodeDialog } from "./node";
import { useNotifications } from "../contexts/NotificationContext";

/*
	Component: MapPage
	Description:
		Top-level page wrapper for the interactive campus map. 
		Hosts the main MapCanvas component that manages map state and user interactions.
*/
export default function MapPage() {
	return (
		<div className="h-full bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 p-8 relative overflow-hidden">
			<MapCanvas />
		</div>
	);
}

function LoadingOverlay() {
	// Loading overlay that displays on the map only.
    return (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-white/80 dark:bg-black/60">
            <div role="status" className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full border-4 border-t-4 border-gray-200 border-t-[#FF7A00] animate-spin" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{"Loading map..."}</span>
            </div>
        </div>
    );
}

/*
	Component: MapCanvas
	Description:
		Handles the rendering and interaction logic for the map view, including:
			- Panning behavior
			- Node selection and quest toggles
			- Displaying node connections and map background
		Uses React refs and event handlers for performance and state management.
*/
function MapCanvas() {
	const containerRef = useRef(null);
	const { addNotification } = useNotifications();

	// Static map data
	const mapData = useMapData();
	const nodes = useMemo(
		() => (
			Array.isArray(mapData.nodes) ? mapData.nodes : []
		)
	, [mapData.nodes]);

	// Currently selected node (for dialog display)
	const [selectedId, setSelectedId] = useState(null);

	// Track per-node quest completion states
	const [nodeToggles, setNodeToggles] = useState({});

	// Loading state for progress
	const [loadingProgress, setLoadingProgress] = useState(true);

	// Panning
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState(false);
	const isPanningRef = useRef(false);
	const lastRef = useRef({ x: 0, y: 0 });
	const movedRef = useRef(false);
	// Panning
	const initialPanRef = useRef(null);
	const PAN_STEP = 160;
	function panBy(dx, dy) { // Pan by a set distance
		setPan(p => ({ x: p.x + dx, y: p.y + dy }));
	}
	// reset to initial centered position
	function resetPosition() {
		if (initialPanRef.current) {
			setPan({ ...initialPanRef.current });
			return;
		}
	}

	// Center initial view on first node
	useEffect(() => {
		const start = nodes[0];
		const c = containerRef.current;
		if (c && start) {
			setPan({
				x: c.clientWidth / 2 - start.x,
				y: c.clientHeight / 2 - start.y,
			});
			// store initial pan for reset button
			initialPanRef.current = {
				x: c.clientWidth / 2 - start.x,
				y: c.clientHeight / 2 - start.y,
			};
		}
	}, [nodes]);

	// Update node toggles when nodes change
	useEffect(() => {
		if (!nodes.length) return;
		setNodeToggles(prev => {
			const next = { ...prev };
			// add or update entries for current nodes
			for (const n of nodes) {
				const questsForNode = Array.isArray(n.quests) ? n.quests : [];
				if (!next[n.id]) {
					next[n.id] = Object.fromEntries(questsForNode.map(q => [q, false]));
				} else {
					// ensure all quests exist
					for (const q of questsForNode) {
						if (!(q in next[n.id])) next[n.id][q] = false;
					}
				}
			}
			return next;
		});
	}, [nodes]);

	// Load progress from database on mount and when map data loads
	useEffect(() => {
		if (!nodes.length) return; // Wait for map data
		async function loadProgress() {
			try {
				const response = await fetch("/api/progress");
				if (!response.ok) {
					// If unauthorized, user is not logged in - that's okay, just use default state
					if (response.status === 401) {
						setLoadingProgress(false);
						return;
					}
					throw new Error("Failed to load progress");
				}
				const data = await response.json();
				const progress = data.progress || {};

				// Map database progress to node toggles
				setNodeToggles(prev => {
					const updated = { ...prev };
					for (const n of nodes) {
						updated[n.id] = updated[n.id] || {};
						for (const questText of (n.quests || [])) {
							const locationName = n.label;
							const locationProgress = progress[locationName] || {};
							const questProgress = locationProgress[questText];
							updated[n.id][questText] = !!(questProgress && questProgress.completed);
						}
					}
					return updated;
				});
			} catch (error) {
				console.error("Error loading progress:", error);
			} finally {
				setLoadingProgress(false);
			}
		}

		loadProgress();
	}, [nodes]); // re-run when nodes arrive or change

	/* ====== Pointer Event Handlers (for map dragging/panning) ====== */

	function onPointerDown(e) {
		if (e.button !== 0) return; // left mouse only
		const interactive = e.target.closest?.("button, a, input, label, [role='button']"); // dont pan with controls
		if (interactive) return;
		isPanningRef.current = true;
		setIsPanning(true);
		movedRef.current = false;
		lastRef.current = { x: e.clientX, y: e.clientY };
		try { // Improve dragging on mobile
			containerRef.current?.setPointerCapture(e.pointerId);
		} catch {}
	}

	function onPointerMove(e) {
		if (!isPanningRef.current) return;
		const dx = e.clientX - lastRef.current.x;
		const dy = e.clientY - lastRef.current.y;

		// Mark as "moved" if drag distance exceeds threshold
		if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;

		lastRef.current = { x: e.clientX, y: e.clientY };
		setPan(p => ({ x: p.x + dx, y: p.y + dy }));
	}

	function onPointerUp(e) {
		if (!isPanningRef.current) return;
		isPanningRef.current = false;
		setIsPanning(false);
		movedRef.current = false;
		try {
			containerRef.current.releasePointerCapture(e.pointerId);
		} catch {
			// ignore release errors
		}
	}

	/* ====== Node Event Handlers ====== */

	function onNodePointerDown(e) {
		// Prevent node interactions from starting a pan
		e.stopPropagation();
	}

	function onNodeClick(id) {
		// Ignore click if user just panned
		if (movedRef.current) {
			movedRef.current = false;
			return;
		}
		setSelectedId(id);
	}

	async function toggleOption(nodeId, option) {
		// Find the node to get location name
		const node = nodes.find(n => n.id === nodeId);
		if (!node) return;

		const questIndex = node.quests.indexOf(option);
		if (questIndex === -1) return;

		// Get current completion state
		const currentState = nodeToggles[nodeId]?.[option] || false;
		const newState = !currentState;

		// Gather dependencies for the quest being toggled
		const rawDeps = node.dependencies?.[questIndex];
		const deps = Array.isArray(rawDeps)
			? rawDeps
			: rawDeps !== undefined
				? [rawDeps]
				: [];

		// Helper to check if dependencies are satisfied
		const depsSatisfied = deps.every(depIndex => {
			const depQuest = node.quests[depIndex];
			return !!nodeToggles[nodeId]?.[depQuest];
		});

		// Helper to see if this quest has dependents already completed
		const dependentLocked = node.quests.some((questText, idx) => {
			const otherRawDeps = node.dependencies?.[idx];
			const otherDeps = Array.isArray(otherRawDeps)
				? otherRawDeps
				: otherRawDeps !== undefined
					? [otherRawDeps]
					: [];
			return (
				otherDeps.includes(questIndex) &&
				nodeToggles[nodeId]?.[questText]
			);
		});

		if (newState && !depsSatisfied) {
			addNotification({
				type: "warning",
				message: "Complete the previous quest before checking this one.",
			});
			return;
		}

		if (!newState && dependentLocked) {
			addNotification({
				type: "warning",
				message: "Uncheck dependent quests first before undoing this one.",
			});
			return;
		}

		// Optimistically update UI
		setNodeToggles(prev => ({
			...prev,
			[nodeId]: { ...prev[nodeId], [option]: newState },
		}));

		// Save to database
		try {
			const response = await fetch("/api/progress", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					location_name: node.label,
					quest_text: option,
					completed: newState,
				}),
			});

			if (!response.ok) {
				// If save fails, revert the optimistic update
				if (response.status === 401) {
					console.warn("User not logged in, progress not saved");
					return;
				}
				throw new Error("Failed to save progress");
			}

			// Show notification based on action
			if (newState) {
				addNotification({
					type: "success",
					message: `Quest completed: "${option}" at ${node.label}`,
				});

				// Check if all quests at this location are now completed
				const updatedToggles = {
					...nodeToggles,
					[nodeId]: { ...nodeToggles[nodeId], [option]: newState },
				};
				const completedQuests = Object.values(updatedToggles[nodeId] || {}).filter(v => v === true).length;
				const totalQuests = node.quests.length;
				
				if (completedQuests === totalQuests) {
					setTimeout(() => {
						addNotification({
							type: "success",
							message: `All quests completed at ${node.label}!`,
						});
					}, 500);
				}
			} else {
				addNotification({
					type: "info",
					message: `Quest unchecked: "${option}" at ${node.label}`,
				});
			}
		} catch (error) {
			console.error("Error saving progress:", error);
			// Revert optimistic update on error
			setNodeToggles(prev => ({
				...prev,
				[nodeId]: { ...prev[nodeId], [option]: currentState },
			}));
			
			addNotification({
				type: "error",
				message: "Failed to save progress. Please try again.",
			});
		}
	}

	function closeDialog() {
		setSelectedId(null);
	}

	// Helper: find node by id
	const findNode = id => nodes.find(n => n.id === id);

	/* ====== Render ====== */

	// Show loading overlay if not all nodes are done loading
	const [isLoading, setIsLoading] = useState(() => (!nodes.length || nodes.length < 5));
	useEffect(() => {
		// Check if not loading
		if (!(!nodes.length || nodes.length < 5)) {
			setIsLoading(false);
			return;
		}
		// Detect timeout, just display map as it is if it isn't done loading after 3 seconds.
		setIsLoading(true);
		const t = setTimeout(() => setIsLoading(false), 3000);
		return () => clearTimeout(t);
	}, [nodes.length]);

	return (
		<div
			ref={containerRef}
			className={`relative w-full h-full ${
				isPanning ? "cursor-grabbing" : "cursor-grab"
			} bg-gray-50 overflow-hidden border rounded border border-gray-400`}
			style={{ touchAction: "none" }}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
		>
			{/* Panned map content container */}
			<div
				className="absolute top-0 left-0"
				style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
			>
				{/* Background map image */}
				<div
					className="absolute top-0 left-0 pointer-events-none select-none"
					style={{
						zIndex: 0,
						width: mapData.background.width,
						height: mapData.background.height,
						opacity: mapData.background.opacity ?? 1,
					}}
				>
					<Image
						src={mapData.background.src}
						width={mapData.background.width}
						height={mapData.background.height}
						alt="map background"
						priority
						unoptimized
					/>
				</div>

				{/* Render node connection lines */}
				<svg
					width={mapData.width}
					height={mapData.height}
					className="absolute top-0 left-0 pointer-events-none"
					style={{ overflow: "visible" }}
				>
					<g>
						{mapData.links.map(([a, b]) => {
							const na = findNode(a);
							const nb = findNode(b);
							if (!na || !nb) return null;
							return (
								<line
									key={`${a}-${b}`}
									x1={na.x}
									y1={na.y}
									x2={nb.x}
									y2={nb.y}
									stroke="#94a3b8"
									strokeWidth={2}
									strokeLinecap="round"
								/>
							);
						})}
					</g>
				</svg>

				{/* Render map nodes */}
				{nodes.map(n => {
					// Calculate progress for this node
					const nodeProgress = nodeToggles[n.id] || {};
					const completedCount = Object.values(nodeProgress).filter(v => v === true).length;
					const totalCount = n.quests.length;
					
					return (
						<Node
							key={n.id}
							node={n}
							onPointerDown={onNodePointerDown}
							onClick={() => onNodeClick(n.id)}
							completedCount={completedCount}
							totalCount={totalCount}
						/>
					);
				})}
			</div>

			{/* Pan controls (overlay) */}

			{/* Reset Button (separate position) */}
			<div className="absolute left-4 top-4 z-50">
				<button
					onPointerDown={e => e.stopPropagation()}
					onClick={() => resetPosition()}
					title="Reset position"
					className="w-10 h-10 bg-[#007AFF] text-white rounded-md shadow flex items-center justify-center hover:brightness-105 transition cursor-pointer"
				>
					↻
				</button>
			</div>

			{/* Arrow Keys */}
			<div className="absolute left-4 top-16 z-50">
				<div className="grid grid-cols-3 gap-2">
					<div></div>

					{/* Up */}
					<button
						onPointerDown={e => e.stopPropagation()}
						onClick={() => panBy(0, PAN_STEP)}
						title="Pan Up"
						className="w-10 h-10 bg-[#FF7A00] text-white rounded-md shadow flex items-center justify-center hover:brightness-105 transition cursor-pointer"
					>
						↑
					</button>

					<div></div>

					{/* Left */}
					<button
						onPointerDown={e => e.stopPropagation()}
						onClick={() => panBy(PAN_STEP, 0)}
						title="Pan Left"
						className="w-10 h-10 bg-[#FF7A00] text-white rounded-md shadow flex items-center justify-center hover:brightness-105 transition cursor-pointer"
					>
						←
					</button>

					{/* Down */}
					<button
						onPointerDown={e => e.stopPropagation()}
						onClick={() => panBy(0, -PAN_STEP)}
						title="Pan Down"
						className="w-10 h-10 bg-[#FF7A00] text-white rounded-md shadow flex items-center justify-center hover:brightness-105 transition cursor-pointer"
					>
						↓
					</button>

					{/* Right */}
					<button
						onPointerDown={e => e.stopPropagation()}
						onClick={() => panBy(-PAN_STEP, 0)}
						title="Pan Right"
						className="w-10 h-10 bg-[#FF7A00] text-white rounded-md shadow flex items-center justify-center hover:brightness-105 transition cursor-pointer"
					>
						→
					</button>
				</div>
			</div>
			
			{/* Display dialog for selected node */}
			{selectedId && (
				<NodeDialog
					node={findNode(selectedId)}
					containerRef={containerRef}
					pan={pan}
					toggles={nodeToggles[selectedId]}
					onToggle={opt => toggleOption(selectedId, opt)}
					onClose={closeDialog}
				/>
			)}

			{/* Show loading overlay */}
			{isLoading && (
				<LoadingOverlay />
			)}
		</div>
	);
}

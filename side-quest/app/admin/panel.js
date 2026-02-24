/*
	Name: admin/panel.js
	Description: A component for editing locations and quests.
	Programmers: Alejandro Sandoval, Pashia Vang
	Date: 11/23/2025
	Revisions: 2/24/2026 - Admin Panel for GeoThinkr and Points
	Errors: N/A
	Input: Lists of quests and locations.
	Output: An editable interface for editing the lists of quests and locations.
*/

"use client";

import { useState, useMemo } from "react";

export default function AdminPanel({ initialLocations = [], initialQuests = [], initialGeoPhotos = [] }) {
	// 1. Constants & State Management
    // Map dimensions are used to scale coordinates between the original image and the UI.
	const MAP_WIDTH_ORIGINAL = 1669;
	const MAP_HEIGHT_ORIGINAL = 1535;
	const ADMIN_MAP_WIDTH = 800;

	// State holds all data in the browser so the UI updates instantly.
	const [locations, setLocations] = useState(initialLocations);
	const [quests, setQuests] = useState(initialQuests);
	const [geoPhotos, setGeoPhotos] = useState(initialGeoPhotos);

	// Status trackers show when app is saving to the database.
	const [geoSaving, setGeoSaving] = useState(false);
	const [locSaving, setLocSaving] = useState(false);
	const [questSaving, setQuestSaving] = useState(false);
	const [pointsSaving, setPointsSaving] = useState(false);
	const [manualPoints, setManualPoints] = useState({ email: "", amount: 100 });

	// Empty forms ready for admin to fill out.
	const [newLoc, setNewLoc] = useState({ name: "", type: "", x_coordinate: 0, y_coordinate: 0 });
	const [newQuest, setNewQuest] = useState({
		text: "",
		location_id: locations[0]?.location_id ?? null,
		is_multiplayer: false,
		reward_points: 100
	});
	const [newGeoPhoto, setNewGeoPhoto] = useState({
		file: null,
		name: "",
		x: 0,
		y: 0,
		category: "landmark",
		difficulty: "medium",
		verified: false
	});

	// 2. Map Scaling
    // Calculation determines scale so clicks land in the right spot.
	const scale = ADMIN_MAP_WIDTH / MAP_WIDTH_ORIGINAL;
	const ADMIN_MAP_HEIGHT = MAP_HEIGHT_ORIGINAL * scale;

	// 3. Server Communication
    // Helper function handles sending changes to the database.
	async function api(path, method = "GET", body) {
		const res = await fetch(`/api/admin/${path}`, {
			method,
			headers: { "Content-Type": "application/json" },
			body: body ? JSON.stringify(body) : undefined,
		});
		if (!res.ok) {
			const err = await res.text().catch(() => res.statusText);
			throw new Error(err || "Error with api");
		}
		return res.json().catch(() => null);
	}

	// 4. Location Management
    // Functions add, change, or remove map markers.

	// Add new location
	async function addLocation() {
		if (!newLoc.name.trim()) return alert("Name required");
		setLocSaving(true);
		try {
			const created = await api("locations", "POST", newLoc);
			// backend should return created row with location_id
			setLocations(s => [...s, created || { ...newLoc }]);
			setNewLoc({ name: "", type: "", x_coordinate: 0, y_coordinate: 0 });
			setNewQuest(q => ({ ...q, location_id: created?.location_id ?? q.location_id }));
		} catch (err) {
			console.error(err);
			alert("Could not add location");
		} finally {
			setLocSaving(false);
		}
	}
	// Edit location
	async function updateLocation(id, changes) {
		setLocSaving(true);
		try {
			const updated = await api("locations", "PUT", { location_id: id, ...changes });
			setLocations(s => s.map(l => (l.location_id === id ? { ...l, ...changes, ...(updated || {}) } : l)));
		} catch (err) {
			console.error(err);
		} finally {
			setLocSaving(false);
		}
	}
	// Delete location
	async function deleteLocation(id) {
		if (!confirm("Delete this location?")) return;
		setLocSaving(true);
		try {
			await api(`locations`, "DELETE", { location_id: id });
			setLocations(s => s.filter(l => l.location_id !== id)); // remove location
			setQuests(qs => qs.filter(q => q.location_id !== id)); // remove quets
		} catch (err) {
			console.error(err);
		} finally {
			setLocSaving(false);
		}
	}

	// 5. Quest Management
    // Functions create and edit tasks for locations.

	// Add new quest
	async function addQuest() {
		if (!newQuest.text.trim()) return alert("Quest text required");
		if (!newQuest.location_id) return alert("Choose a location");
		setQuestSaving(true);
		try {
			const created = await api("quests", "POST", newQuest);
			setQuests(s => [...s, created || { ...newQuest }]);
			setQuests(s => [...s, created || { ...newQuest }]);
			setNewQuest({
				text: "",
				location_id: locations[0]?.location_id ?? null,
				is_multiplayer: false,
				reward_points: 100
			});
		} catch (err) {
			console.error(err);
			alert("Could not add quest");
		} finally {
			setQuestSaving(false);
		}
	}
	// Edit quest
	async function updateQuest(id, changes) {
		setQuestSaving(true);
		try {
			const updated = await api("quests", "PUT", { quest_id: id, ...changes });
			setQuests(s => s.map(q => (q.quest_id === id ? { ...q, ...changes, ...(updated || {}) } : q)));
		} catch (err) {
			console.error(err);
		} finally {
			setQuestSaving(false);
		}
	}
	// Delete quest
	async function deleteQuest(id) {
		if (!confirm("Delete this quest?")) return;
		setQuestSaving(true);
		try {
			await api(`quests`, "DELETE", { quest_id: id });
			setQuests(s => s.filter(q => q.quest_id !== id));
		} catch (err) {
			console.error(err);
		} finally {
			setQuestSaving(false);
		}
	}

	// 6. Photo Management
    // GeoThinkr -- Logic handles image uploads and map pinning.
	async function addGeoPhoto() {
		if (!newGeoPhoto.file) return alert("Select a file");
		if (!newGeoPhoto.name) return alert("Enter name");
		if (!newGeoPhoto.x && !newGeoPhoto.y) return alert("Click on map to set location");

		setGeoSaving(true);
		try {
			const formData = new FormData();
			formData.append("file", newGeoPhoto.file);
			formData.append("name", newGeoPhoto.name);
			formData.append("x", Math.round(newGeoPhoto.x));
			formData.append("y", Math.round(newGeoPhoto.y));
			formData.append("category", newGeoPhoto.category);
			formData.append("difficulty", newGeoPhoto.difficulty);
			formData.append("verified", newGeoPhoto.verified.toString());

			const res = await fetch("/api/admin/geothinkr", {
				method: "POST",
				body: formData
			});

			if (!res.ok) {
				const txt = await res.text();
				throw new Error(txt);
			}
			const created = await res.json();
			setGeoPhotos(prev => [created, ...prev]);
			setNewGeoPhoto({ file: null, name: "", x: 0, y: 0, category: "landmark", difficulty: "medium", verified: false });
			// clear file input
			const fileInput = document.getElementById("geo-file-input");
			if (fileInput) fileInput.value = "";
		} catch (err) {
			console.error(err);
			alert("Failed to add photo: " + err.message);
		} finally {
			setGeoSaving(false);
		}
	}

	async function deleteGeoPhoto(id) {
		if (!confirm("Delete this photo?")) return;
		setGeoSaving(true);
		try {
			await api(`geothinkr`, "DELETE", { id });
			setGeoPhotos(s => s.filter(p => p.photo_id !== id));
		} catch (err) {
			alert("Failed to delete");
		} finally {
			setGeoSaving(false);
		}
	}

	// 7. Point Distribution
    // Direct method grants points via student email.
	async function awardPoints() {
		if (!manualPoints.email) return alert("Email required");
		setPointsSaving(true);
		try {
			const res = await fetch("/api/admin/points", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					user_email: manualPoints.email,
					points: manualPoints.amount
				})
			});
			if (!res.ok) {
				const txt = await res.text();
				throw new Error(txt);
			}
			const data = await res.json();
			alert(`Success! User now has ${data.new_points} points.`);
			// Clear email after success?
			// setManualPoints(p => ({ ...p, email: "" })); 
		} catch (err) {
			alert("Failed: " + err.message);
		} finally {
			setPointsSaving(false);
		}
	}

	// 8. Sorting
	// Create dropdowns for selecting location for each quest
	const locById = useMemo(() => Object.fromEntries(locations.map(l => [l.location_id, l.name])), [locations]);
	const questsSorted = useMemo(() => {
		const copy = [...quests];
		copy.sort((a, b) => {
			const la = locById[a.location_id] ?? "";
			const lb = locById[b.location_id] ?? "";
			if (la < lb) return -1;
			if (la > lb) return 1;
			return 0;
		});
		return copy;
	}, [quests, locById]);

	// 9. Component UI
    // Render builds visual sections for Admin Panel.
	return (
		<div className="max-w-7xl mx-auto p-6 space-y-6 text-[#FF7A00]">
			<h1 className="text-2xl font-semibold">Admin Panel</h1>

			{/* LOCATIONS */}
			{/* New location: */}
			<section className="bg-white rounded shadow p-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-medium">Locations</h2>
					<div className="flex gap-2 items-center">
						<input
							className="px-2 py-1 border rounded w-48"
							placeholder="Name"
							value={newLoc.name}
							onChange={e => setNewLoc(n => ({ ...n, name: e.target.value }))}
						/>
						<input
							className="px-2 py-1 border rounded w-32"
							placeholder="Type"
							value={newLoc.type}
							onChange={e => setNewLoc(n => ({ ...n, type: e.target.value }))}
						/>
						<input
							type="number"
							className="px-2 py-1 border rounded w-20"
							value={newLoc.x_coordinate}
							onChange={e => setNewLoc(n => ({ ...n, x_coordinate: Number(e.target.value) }))}
						/>
						<input
							type="number"
							className="px-2 py-1 border rounded w-20"
							value={newLoc.y_coordinate}
							onChange={e => setNewLoc(n => ({ ...n, y_coordinate: Number(e.target.value) }))}
						/>
						<button
							className="ml-2 bg-[#FF7A00] text-white px-3 py-1 rounded disabled:opacity-60 cursor-pointer"
							onClick={addLocation}
							disabled={locSaving}
						>
							Add
						</button>
					</div>
				</div>
				{/* Existing locations: */}
				<div className="space-y-2">
					{locations.map(loc => (
						<div key={loc.location_id} className="flex items-center gap-2">
							<input
								className="px-2 py-1 border rounded w-80"
								value={loc.name}
								onChange={e => setLocations(s => s.map(l => (l.location_id === loc.location_id ? { ...l, name: e.target.value } : l)))}
								onBlur={e => updateLocation(loc.location_id, { name: e.target.value })}
							/>
							<input
								className="px-2 py-1 border rounded w-28"
								value={loc.type ?? ""}
								onChange={e => setLocations(s => s.map(l => (l.location_id === loc.location_id ? { ...l, type: e.target.value } : l)))}
								onBlur={e => updateLocation(loc.location_id, { type: e.target.value })}
							/>
							<input
								type="number"
								className="px-2 py-1 border rounded w-24"
								value={loc.x_coordinate ?? 0}
								onChange={e => setLocations(s => s.map(l => (l.location_id === loc.location_id ? { ...l, x_coordinate: Number(e.target.value) } : l)))}
								onBlur={e => updateLocation(loc.location_id, { x_coordinate: Number(e.target.value) })}
							/>
							<input
								type="number"
								className="px-2 py-1 border rounded w-24"
								value={loc.y_coordinate ?? 0}
								onChange={e => setLocations(s => s.map(l => (l.location_id === loc.location_id ? { ...l, y_coordinate: Number(e.target.value) } : l)))}
								onBlur={e => updateLocation(loc.location_id, { y_coordinate: Number(e.target.value) })}
							/>
							<button
								className="ml-2 text-red-600 px-2 py-1 rounded border cursor-pointer"
								onClick={() => deleteLocation(loc.location_id)}
								disabled={locSaving}
								title="Delete location"
							>
								Delete
							</button>
						</div>
					))}
				</div>
			</section>

			{/* QUESTS */}
			{/* New quest: */}
			<section className="bg-white rounded shadow p-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-medium">Quests</h2>
					<div className="flex flex-col gap-2">
						<div className="flex items-center gap-2">
							<select
								className="px-2 py-1 border rounded"
								value={newQuest.location_id ?? ""}
								onChange={e => setNewQuest(q => ({ ...q, location_id: e.target.value }))}
							>
								<option value="">Select location</option>
								{locations.map(l => (
									<option key={l.location_id} value={l.location_id}>
										{l.name}
									</option>
								))}
							</select>
							<input
								className="px-2 py-1 border rounded w-64"
								placeholder="Quest text"
								value={newQuest.text}
								onChange={e => setNewQuest(q => ({ ...q, text: e.target.value }))}
							/>
						</div>
						<div className="flex items-center gap-4">
							<label className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
								<input
									type="checkbox"
									className="cursor-pointer"
									checked={newQuest.is_multiplayer || false}
									onChange={e => setNewQuest(q => ({ ...q, is_multiplayer: e.target.checked }))}
								/>
								Multiplayer (One Winner)
							</label>
							<label className="flex items-center gap-1 text-sm text-gray-700">
								Points:
								<input
									type="number"
									className="px-2 py-1 border rounded w-16"
									value={newQuest.reward_points}
									onChange={e => setNewQuest(q => ({ ...q, reward_points: Number(e.target.value) }))}
								/>
							</label>
							<button
								className="ml-auto bg-[#FF7A00] text-white px-3 py-1 rounded disabled:opacity-60 cursor-pointer"
								onClick={addQuest}
								disabled={questSaving}
							>
								Add Quest
							</button>
						</div>
					</div>
				</div>
				{/* Existing quests: */}
				<div className="space-y-2">
					{questsSorted.map(q => (
						<div key={q.quest_id} className="flex items-center gap-2">
							<select
								className="px-2 py-1 border rounded w-44"
								value={q.location_id ?? ""}
								onChange={e => updateQuest(q.quest_id, { location_id: e.target.value })}
							>
								<option value="">Unassigned</option>
								{locations.map(l => (
									<option key={l.location_id} value={l.location_id}>
										{l.name}
									</option>
								))}
							</select>

							<input
								className="px-2 py-1 border rounded flex-1"
								value={q.text}
								onChange={e => setQuests(s => s.map(x => (x.quest_id === q.quest_id ? { ...x, text: e.target.value } : x)))}
								onBlur={e => updateQuest(q.quest_id, { text: e.target.value })}
							/>

							<div className="flex flex-col text-xs gap-1">
								<label className="flex items-center gap-1  cursor-pointer">
									<input
										type="checkbox"
										checked={q.is_multiplayer || false}
										className="cursor-pointer"
										onChange={e => {
											const val = e.target.checked;
											setQuests(s => s.map(x => (x.quest_id === q.quest_id ? { ...x, is_multiplayer: val } : x)));
											updateQuest(q.quest_id, { is_multiplayer: val });
										}}
									/>
									Multi
								</label>
								<input
									type="number"
									className="w-16 border px-1 rounded"
									value={q.reward_points || 100}
									onChange={e => {
										const val = Number(e.target.value);
										setQuests(s => s.map(x => (x.quest_id === q.quest_id ? { ...x, reward_points: val } : x)));
									}}
									onBlur={e => updateQuest(q.quest_id, { reward_points: Number(e.target.value) })}
								/>
							</div>

							<button
								className="ml-2 text-red-600 px-2 py-1 rounded border cursor-pointer"
								onClick={() => deleteQuest(q.quest_id)}
								disabled={questSaving}
								title="Delete quest"
							>
								Delete
							</button>
						</div>
					))}
				</div>
			</section>

			{/* GEOTHINKR */}
			<section className="bg-white rounded shadow p-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-medium">GeoThinkr Photos</h2>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Form Side */}
					<div className="space-y-4">
						<div className="space-y-2">
							<label className="block text-sm font-medium">1. Choose Photo</label>
							<input
								id="geo-file-input"
								type="file"
								accept="image/*"
								onChange={e => setNewGeoPhoto(p => ({ ...p, file: e.target.files[0] }))}
								className="block w-full text-sm border rounded p-2"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium">2. Location Name</label>
							<input
								value={newGeoPhoto.name}
								onChange={e => setNewGeoPhoto(p => ({ ...p, name: e.target.value }))}
								placeholder="e.g. Wesco Hall"
								className="block w-full text-sm border rounded p-2"
							/>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium">3. Category</label>
							<select
								value={newGeoPhoto.category}
								onChange={e => setNewGeoPhoto(p => ({ ...p, category: e.target.value }))}
								className="block w-full text-sm border rounded p-2"
							>
								<option value="landmark">Landmark</option>
								<option value="building">Building</option>
								<option value="nature">Nature</option>
								<option value="statue">Statue</option>
								<option value="other">Other</option>
							</select>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium">4. Difficulty</label>
							<select
								value={newGeoPhoto.difficulty}
								onChange={e => setNewGeoPhoto(p => ({ ...p, difficulty: e.target.value }))}
								className="block w-full text-sm border rounded p-2"
							>
								<option value="easy">Easy</option>
								<option value="medium">Medium</option>
								<option value="hard">Hard</option>
							</select>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								className="cursor-pointer"
								id="geo-verified"
								checked={newGeoPhoto.verified}
								onChange={e => setNewGeoPhoto(p => ({ ...p, verified: e.target.checked }))}
							/>
							<label htmlFor="geo-verified" className="text-sm font-medium">Verified (visible in gameplay)</label>
						</div>
						<div className="space-y-2">
							<label className="block text-sm font-medium">5. Click on Map</label>
							<div className="text-xs text-gray-500">
								Selected Coords: {Math.round(newGeoPhoto.x)}, {Math.round(newGeoPhoto.y)}
							</div>
						</div>

						<button
							onClick={addGeoPhoto}
							disabled={geoSaving}
							className="bg-[#00AEEF] text-white px-4 py-2 rounded font-bold hover:bg-[#008CC1] disabled:opacity-50 w-full cursor-pointer"
						>
							{geoSaving ? "Uploading..." : "Add GeoThinkr Photo"}
						</button>

						<div className="border-t pt-4">
							<h3 className="font-medium mb-2">Existing Photos ({geoPhotos.length})</h3>
							<div className="space-y-2 max-h-[400px] overflow-y-auto">
								{geoPhotos.map(p => (
									<div key={p.photo_id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
										<img src={p.image_url} className="w-12 h-12 object-cover rounded" />
										<div className="flex-1 min-w-0">
											<div className="font-medium truncate">{p.location_name}</div>
											<div className="text-xs text-gray-500">{p.x_coordinate}, {p.y_coordinate} · {p.category || 'landmark'} · {p.difficulty || 'medium'}</div>
										</div>
										<button
											onClick={async () => {
												const newVal = !p.verified;
												try {
													const res = await fetch("/api/admin/geothinkr", {
														method: "PATCH",
														headers: { "Content-Type": "application/json" },
														body: JSON.stringify({ id: p.photo_id, verified: newVal })
													});
													if (!res.ok) throw new Error("Failed");
													setGeoPhotos(s => s.map(x => x.photo_id === p.photo_id ? { ...x, verified: newVal } : x));
												} catch { alert("Failed to toggle verified"); }
											}}
											className={`text-xs border px-2 py-1 rounded ${p.verified ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500'} cursor-pointer`}
										>
											{p.verified ? '✓ Verified' : 'Unverified'}
										</button>
										<button
											onClick={() => deleteGeoPhoto(p.photo_id)}
											className="text-red-500 text-xs border px-2 py-1 rounded hover:bg-red-50 cursor-pointer"
										>
											Delete
										</button>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Map Side */}
					<div>
						<div className="text-sm font-medium mb-2">Internal Map (Click to set location)</div>
						<div
							className="relative border-4 border-gray-300 rounded cursor-crosshair overflow-hidden inline-block"
							style={{ width: ADMIN_MAP_WIDTH, height: ADMIN_MAP_HEIGHT }}
							onClick={(e) => {
								const rect = e.currentTarget.getBoundingClientRect();
								const clickX = e.clientX - rect.left;
								const clickY = e.clientY - rect.top;
								// Convert to original scale
								const originalX = clickX / scale;
								const originalY = clickY / scale;
								setNewGeoPhoto(p => ({ ...p, x: originalX, y: originalY }));
							}}
						>
							<img
								src="/map.png"
								style={{ width: '100%', height: '100%', objectFit: 'contain' }}
								draggable={false}
							/>
							{/* Marker */}
							{newGeoPhoto.x > 0 && (
								<div
									className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
									style={{
										left: newGeoPhoto.x * scale,
										top: newGeoPhoto.y * scale
									}}
								/>
							)}
							{/* Show existing markers faintly? */}
							{geoPhotos.map(p => (
								<div
									key={p.photo_id}
									className="absolute w-2 h-2 bg-blue-500/50 rounded-full pointer-events-none"
									style={{
										left: p.x_coordinate * scale,
										top: p.y_coordinate * scale
									}}
								/>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* MANUAL POINTS */}
			<section className="bg-white rounded shadow p-4">
				<h2 className="text-lg font-medium mb-4">Award Points Manually</h2>
				<div className="flex items-end gap-4">
					<div className="space-y-1">
						<label className="text-sm font-medium">User Email</label>
						<input
							className="block border rounded px-3 py-2 w-64"
							placeholder="user@ku.edu"
							value={manualPoints.email}
							onChange={e => setManualPoints(p => ({ ...p, email: e.target.value }))}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium">Amount</label>
						<input
							type="number"
							className="block border rounded px-3 py-2 w-32"
							value={manualPoints.amount}
							onChange={e => setManualPoints(p => ({ ...p, amount: parseInt(e.target.value) }))}
						/>
					</div>
					<button
						onClick={awardPoints}
						disabled={pointsSaving}
						className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50 cursor-pointer"
					>
						{pointsSaving ? "Sending..." : "Award Points"}
					</button>
				</div>
			</section>
		</div>
	);
}
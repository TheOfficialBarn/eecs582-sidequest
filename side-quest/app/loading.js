/*
	Name: loading.js
	Description: A loading animation that appears whenever a page is loading
	Programmers: Alejandro Sandoval, Aiden
	Date: 11/22/2025
	Revisions: Added some comments (Aiden) 11/23/2025,
	           Constrain to page area so the toolbar stays visible during route transitions - 04/26/2026
	Errors: N/A
	Input: Is page loading?
	Output: A spinning wheel loading animation.
*/

export default function Loading() {
	// Renders inside the <main> region of the root layout, so the toolbar
	// stays visible while the next route's data is being fetched. Using a
	// flex-grow wrapper instead of `fixed inset-0` avoids the navbar flash
	// that the previous overlay version caused on every navigation.
	return (
		<div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50">
			{/*
				`role="status"` exposes this as a live status region so screen
				readers announce the visible "Loading…" label below.
			*/}
			<div role="status" className="flex flex-col items-center gap-3">
				<div className="w-14 h-14 rounded-full border-4 border-gray-200 border-t-[#FF7A00] animate-spin" />
				<span className="text-sm text-gray-700">Loading…</span>
			</div>
		</div>
	);
}

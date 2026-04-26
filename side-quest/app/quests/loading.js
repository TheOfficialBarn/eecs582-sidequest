/*
	Name: quests/loading.js
	Description: Route-level skeleton shown while QuestsPage data is being
	             fetched. Mimics the page's stat cards + per-location quest
	             groups so navigation feels instant instead of flashing a
	             full-screen spinner.
	Date: 04/26/2026
*/

export default function QuestsLoading() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 p-6 relative overflow-hidden">
			<div className="max-w-5xl mx-auto relative z-10 animate-pulse">
				{/* Header placeholder */}
				<div className="mb-6 text-center">
					<div className="h-10 w-56 mx-auto bg-orange-200/60 rounded-lg mb-2" />
					<div className="h-4 w-72 mx-auto bg-cyan-200/60 rounded" />
				</div>

				{/* Stats card placeholders */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					{[0, 1, 2].map(i => (
						<div key={i} className="bg-white rounded-2xl p-4 border-4 border-gray-200 h-32" />
					))}
				</div>

				{/* Location group placeholders */}
				<div className="space-y-4">
					{[0, 1, 2].map(i => (
						<div key={i} className="bg-white rounded-2xl p-4 border-4 border-gray-200 h-44" />
					))}
				</div>
			</div>
		</div>
	);
}

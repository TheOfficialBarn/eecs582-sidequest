/*
	Name: account/loading.js
	Description: Route-level skeleton for the account dashboard so the page
	             feels responsive even while the six parallel Supabase
	             queries are in flight.
	Date: 04/26/2026
*/

export default function AccountLoading() {
	return (
		<div className="max-w-4xl mx-auto p-8 animate-pulse">
			{/* Header */}
			<div className="h-9 w-40 bg-orange-200/60 rounded-lg mb-4" />

			{/* Profile card placeholder */}
			<div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-col md:flex-row items-center gap-6">
				<div className="w-32 h-32 rounded-full bg-gray-200" />
				<div className="flex-1 w-full space-y-3">
					<div className="h-5 w-2/3 bg-gray-200 rounded" />
					<div className="h-5 w-1/2 bg-gray-200 rounded" />
					<div className="h-10 w-32 bg-gray-200 rounded mt-4" />
				</div>
			</div>

			{/* Stats card placeholder */}
			<div className="bg-gradient-to-r from-[#00AEEF]/30 to-[#0096D6]/30 rounded-lg p-6 mb-6 h-28" />

			{/* GeoThinkr stats placeholder */}
			<div className="bg-gradient-to-r from-[#FF7A00]/30 to-[#FF9500]/30 rounded-lg p-6 mb-6 h-28" />

			{/* Achievements grid placeholder */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
				{[0, 1, 2, 3].map(i => (
					<div key={i} className="h-28 bg-gray-100 rounded-xl" />
				))}
			</div>

			{/* Completed quests list placeholder */}
			<div className="space-y-4">
				{[0, 1].map(i => (
					<div key={i} className="bg-white rounded-lg shadow-md p-6 h-40" />
				))}
			</div>
		</div>
	);
}

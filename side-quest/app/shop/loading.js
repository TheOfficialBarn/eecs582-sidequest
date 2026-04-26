/*
	Name: shop/loading.js
	Description: Route-level skeleton for the avatar shop. Mirrors the page
	             layout (current-avatar header + 4-column avatar grid) so
	             nothing visibly shifts when the real content arrives.
	Date: 04/26/2026
*/

export default function ShopLoading() {
	return (
		<div className="max-w-4xl mx-auto p-8 animate-pulse">
			{/* Page heading */}
			<div className="mb-8 text-center">
				<div className="h-10 w-72 mx-auto bg-orange-200/60 rounded-lg mb-3" />
				<div className="h-4 w-96 mx-auto bg-gray-200 rounded" />
			</div>

			{/* Current avatar card */}
			<div className="flex flex-col items-center justify-center mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
				<div className="h-6 w-40 bg-gray-200 rounded mb-4" />
				<div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-orange-200/60" />
				<div className="h-3 w-48 bg-gray-200 rounded mt-3" />
			</div>

			{/* Shop grid */}
			<div>
				<div className="h-8 w-48 bg-orange-200/60 rounded mb-6" />
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
					{[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
						<div key={i} className="bg-white rounded-xl border-2 border-gray-100 p-4 flex flex-col items-center gap-3">
							<div className="w-20 h-20 rounded-full bg-gray-200" />
							<div className="h-4 w-20 bg-gray-200 rounded" />
							<div className="h-3 w-10 bg-gray-200 rounded" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

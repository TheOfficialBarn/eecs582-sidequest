/*
	Name: leaderboard/loading.js
	Description: Route-level skeleton for the leaderboard page so navigation
	             does not flash a full-screen spinner.
	Date: 04/26/2026
	Revisions:
		04/26/2026 – align skeleton with tactical FPS-style HUD redesign
		04/26/2026 – moody dark backdrop matching the leaderboard page
*/

const PANEL_CLIP =
	"polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))";

export default function LeaderboardLoading() {
	return (
		<div className="relative flex-1 bg-gradient-to-br from-[#1a0d05] via-[#0a0e14] to-[#1a0d05] overflow-hidden">
			{/* Ambient orange glow */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse at 15% 0%, rgba(255,122,0,0.18), transparent 55%), radial-gradient(ellipse at 85% 100%, rgba(0,174,239,0.10), transparent 55%)",
				}}
			/>
			{/* Tactical grid overlay */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.04]"
				style={{
					backgroundImage:
						"linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
					backgroundSize: "44px 44px",
				}}
			/>

			<div className="relative max-w-6xl mx-auto p-8 animate-pulse">
				{/* Title placeholder */}
				<div className="mb-6">
					<div className="h-3 w-32 bg-[#FF7A00]/40 rounded mb-2" />
					<div className="h-8 w-56 bg-white/15 rounded" />
				</div>

				{/* Tab strip placeholder */}
				<div className="flex gap-2 mb-5">
					<div className="h-10 w-32 bg-[#FF7A00]/30" />
					<div className="h-10 w-32 bg-white/10" />
				</div>

				{/* HUD panel placeholder */}
				<div
					className="bg-slate-900/80 border border-[#FF7A00]/20"
					style={{ clipPath: PANEL_CLIP }}
				>
					{/* Header */}
					<div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
						<div className="h-5 w-5 bg-[#FF7A00]/40 rounded" />
						<div className="h-4 w-48 bg-white/10 rounded" />
					</div>
					{/* Column header */}
					<div className="px-6 py-2 bg-black/40 border-b border-white/5 flex items-center gap-4">
						<div className="h-2 w-10 bg-white/10 rounded" />
						<div className="h-2 w-20 bg-white/10 rounded flex-1" />
						<div className="h-2 w-12 bg-white/10 rounded" />
					</div>
					{/* Rows */}
					<div className="divide-y divide-white/5">
						{[0, 1, 2, 3, 4, 5, 6].map(i => (
							<div key={i} className="flex items-center gap-4 px-6 py-3">
								<div className="h-10 w-10 bg-white/10 flex-shrink-0" />
								<div className="flex-1 space-y-2">
									<div className="h-3 w-2/5 bg-white/10 rounded" />
									<div className="h-2 w-1/4 bg-white/5 rounded" />
								</div>
								<div className="h-5 w-12 bg-[#FF7A00]/30 rounded" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

/*
	Name: shop/page.js
	Description: Shop for buying profile customization options with points
	Programmers: Aiden Barnard
	Date: 2/09/2026
	Revisions: N/A
	Errors: N/A
	Input: 
		- User auth token (cookie)
	Output: 
		- Shop page
*/

import { requireAuthOrRedirect } from "@/lib/requireAuth";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ShopClient from "./ShopClient";

export const metadata = {
	title: "Avatar Shop",
	description: "Customize your profile with fun avatars",
};

export default async function ShopPage() {
	requireAuthOrRedirect();

	const cookieStore = await cookies();
	const token = cookieStore.get("sid")?.value;
	const userPayload = token ? verifyToken(token) : null;

	// Redirection happens in requireAuthOrRedirect if invalid
	if (!userPayload) return null;

	const supabase = createAdminClient();

	// Fetch fresh user data including profile_picture_url
	const { data: user, error } = await supabase
		.from("users")
		.select("user_id, name, email, profile_picture_url")
		.eq("user_id", userPayload.id)
		.single();

	// Fallback if user missing in DB
	const userData = user || { ...userPayload, profile_picture_url: null };

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#FFF6D8] via-yellow-50 to-orange-50 relative overflow-hidden">
			{/* Background — notebook-dot grid + sticker shapes */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div
					className="absolute inset-0"
					style={{
						backgroundImage: 'radial-gradient(circle, rgba(255,122,0,0.18) 1.5px, transparent 1.5px)',
						backgroundSize: '28px 28px',
					}}
				/>
				<div className="absolute top-[8%] left-[6%] w-6 h-6 bg-[#FF7A00] rotate-12 shadow-[3px_3px_0_#FFDA00]" />
				<div className="absolute top-[14%] right-[8%] w-8 h-8 bg-[#00AEEF] rounded-full shadow-[3px_3px_0_#FF7A00]" />
				<div className="absolute top-[42%] left-[4%] w-5 h-5 bg-[#FFDA00] rotate-45 shadow-[3px_3px_0_#00AEEF]" />
				<div className="absolute top-[50%] right-[5%] w-7 h-7 bg-[#FF7A00] rounded-full shadow-[3px_3px_0_#FFDA00]" />
				<div className="absolute bottom-[18%] left-[14%] w-7 h-7 bg-[#00AEEF] rotate-45 shadow-[3px_3px_0_#FF7A00]" />
				<div className="absolute bottom-[10%] right-[22%] w-6 h-6 bg-[#FFDA00] rotate-12 shadow-[3px_3px_0_#00AEEF]" />
				<div className="absolute bottom-[28%] right-[40%] w-5 h-5 bg-[#FF7A00] rounded-full shadow-[3px_3px_0_#FFDA00]" />
			</div>

			<div className="max-w-4xl mx-auto p-8 relative z-10">
				<div className="mb-8 text-center">
					<h1 className="text-4xl font-extrabold text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-2">Customize Profile</h1>
					<p className="text-[#00AEEF] font-semibold">Choose an avatar from the shop or upload your own!</p>
				</div>
				<ShopClient initialUser={userData} />
			</div>
		</div>
	);
}

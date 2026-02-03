
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

	// We assume redirection happens in requireAuthOrRedirect if invalid
	if (!userPayload) return null;

	const supabase = createAdminClient();

	// Fetch fresh user data including profile_picture_url
	const { data: user, error } = await supabase
		.from("users")
		.select("user_id, name, email, profile_picture_url")
		.eq("user_id", userPayload.id)
		.single();

	// Fallback if user missing in DB (shouldn't happen) or field missing
	const userData = user || { ...userPayload, profile_picture_url: null };

	return (
		<div className="max-w-4xl mx-auto p-8">
			<div className="mb-8 text-center">
				<h1 className="text-4xl font-extrabold text-[#FF7A00] mb-2 tracking-tight">Customize Profile</h1>
				<p className="text-gray-600">Choose an avatar from the shop or upload your own!</p>
			</div>
			<ShopClient initialUser={userData} />
		</div>
	);
}

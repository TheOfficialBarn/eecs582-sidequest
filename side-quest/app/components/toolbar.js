/*
	Name: toolbar.js
	Description: Defines the top toolbar of every page.
	Programmers: Alejandro Sandoval
	Date: 10/25/2025
	Revisions: Add conditional admin tab - 11/23/2025
	Errors: N/A
	Input: Session cookie from request headers
	Output: ToolbarClient component with user info if authenticated, or null 
*/

import { cookies } from "next/headers";
import { verifyToken } from "../../lib/auth";
import ToolbarClient from "./toolbar-client";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Toolbar() {
	// Check if user is logged in.
	const cookieStore = await cookies();
	const token = cookieStore.get("sid")?.value;

	// Verify the token to get user info; null if not authenticated
	const decoded = token ? verifyToken(token) : null;
	let user = decoded ? { ...decoded } : null;

	// Get if user is admin
	if (user) {
		try {
			// Get user information from db
			const supabase = createAdminClient();
			const userId = user.id;
			let q = supabase.from("users").select("user_id, is_admin, name, email, points").limit(1);

			q = q.eq("user_id", userId);

			// add information to the user object
			const { data, error } = await q.single();
			if (!error && data) {
				user = {
					...user,
					user_id: data.user_id,
					name: data.name ?? user.name,
					email: data.email ?? user.email,
					is_admin: !!data.is_admin,
					points: data.points || 0,
				};
			} else {
				// add default is_admin value
				user.is_admin = !!user.is_admin;
			}
		} catch (e) {
			console.error("Toolbar: failed to fetch user record:", e);
			user.is_admin = !!user.is_admin;
		}
	}

	// Render the client toolbar with user info
	return <ToolbarClient user={user} />;
}

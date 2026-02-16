/*
	Name: admin/page.js
	Description: A page for admin accounts to add and edit quests.
	Programmers: Alejandro Sandoval
	Date: 11/23/2025
	Revisions: N/A
	Errors: N/A
	Input: A user account.
	Output: If user is admin, show admin panel. Otherwise, redirect to homepage.
*/

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/lib/auth";
import AdminPanel from "./panel";

export default async function AdminPage() {
	// 1. Security Check
	// The "sid" cookie is retrieved to access the session data.
    // It's run through verifyToken to ensure the session is valid
	const cookieStore = await cookies();
	const token = cookieStore.get("sid")?.value;
	const decoded = token ? verifyToken(token) : null;

	// The request is stopped if no valid token is found.
    // The user is then redirected to the login screen.
	if (!decoded) return redirect("/login");

	// 2. Identify the User
    // The user ID is required to track who modifies the data.
    // Multiple fields are checked to ensure compatibility with token formats.	
	const userId = decoded.id ?? decoded.user_id ?? decoded.sub ?? null;
	if (!userId) return redirect("/login");

	// 3. Database Access
    // The Admin Client is initialized to bypass row-level security.
    // This access is restricted to secure server-side environments.	
	const supabase = createAdminClient();

	// 4. Gathering Data
    // Three separate queries are executed to populate the dashboard.
    
    // Map locations are retrieved and sorted by ID for consistency.
	const { data: locations = [], error: locErr } = await supabase
		.from("locations")
		.select("location_id, name, type, x_coordinate, y_coordinate")
		.order("location_id", { ascending: true });
	
	// Existing quests are fetched for the management table.
	const { data: quests = [], error: qErr } = await supabase
		.from("quests")
		.select("*")
		.order("location_id", { ascending: true });

	// load geothinkr photos
	const { data: geoPhotos = [], error: geoErr } = await supabase
		.from("geothinkr_photos")
		.select("*")
		.order("created_at", { ascending: false });

	// Any database request failure is logged to the console.
	if (locErr || qErr) {
		console.error("Admin page load error:", locErr || qErr);
	}

	// 5. Showing the Dashboard
    // Data is passed into the AdminPanel component for the interface.
	return <AdminPanel initialLocations={locations} initialQuests={quests} initialGeoPhotos={geoPhotos} />;
}
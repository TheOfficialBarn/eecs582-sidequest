/*
	Name: Profile Image Upload API endpoint
	Description: Uploads a user avatar to Supabase storage and updates the user's profile picture URL.
	Programmers: Liam Aga
	Date: 2/15/2025
	Revisions: Initial upload integration - 2/15/2025
	Errors: 400 No file, 401 Unauthorized, 500 Upload or update failure

	Input:
		POST: Authenticated multipart form-data with file

	Output:
		POST: { url }
*/

import { verifyToken } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";

export async function POST(req) {
	const cookie = req.headers.get("cookie") || "";
	const match = cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sid="));
	const token = match?.split("=")[1];

	const userPayload = token ? verifyToken(token) : null;

	if (!userPayload) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
	}

	const formData = await req.formData();
	const file = formData.get("file");

	if (!file) {
		return new Response(JSON.stringify({ message: "No file provided" }), { status: 400 });
	}

	const supabase = createAdminClient();
	const fileExt = file.name.split('.').pop();
	const fileName = `${userPayload.id}_${Date.now()}.${fileExt}`;

	// Convert file to buffer for upload
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const { data, error } = await supabase.storage
		.from('avatars')
		.upload(fileName, buffer, {
			contentType: file.type,
			upsert: true
		});

	if (error) {
		console.error("Upload error:", error);
		return new Response(JSON.stringify({ message: "Upload failed" }), { status: 500 });
	}

	const { data: { publicUrl } } = supabase.storage
		.from('avatars')
		.getPublicUrl(fileName);

	// Update user profile with new URL
	const { error: updateError } = await supabase
		.from("users")
		.update({ profile_picture_url: publicUrl })
		.eq("user_id", userPayload.id);

	if (updateError) {
		console.error("Profile update error:", updateError);
		return new Response(JSON.stringify({ message: "Failed to update profile picture" }), { status: 500 });
	}

	return new Response(JSON.stringify({ url: publicUrl }), { status: 200 });
}

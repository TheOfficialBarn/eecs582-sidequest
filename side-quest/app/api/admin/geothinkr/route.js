/*
	Name: admin/route.js
	Description: API endpoint for geothinkr admin options
	Programmers: Aiden Barnard
	Date: 2/09/2026
	Revisions: N/A
	Errors: N/A
	Input: Admin operations
	Output: Commits and queries to the database.
*/

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("geothinkr_photos")
		.select("*")
		.order("created_at", { ascending: false });

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data);
}

export async function POST(req) {
	const formData = await req.formData();
	const file = formData.get("file");
	const x = formData.get("x");
	const y = formData.get("y");
	const name = formData.get("name") || "Untitled Location";

	if (!file || !x || !y) {
		return NextResponse.json({ error: "Missing file or coordinates" }, { status: 400 });
	}

	const supabase = createAdminClient();
	const fileExt = file.name.split('.').pop();
	const fileName = `geo_${Date.now()}.${fileExt}`;

	// Upload to storage
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const { error: uploadError } = await supabase.storage
		.from('geothinkr-images')
		.upload(fileName, buffer, {
			contentType: file.type,
			upsert: false
		});

	if (uploadError) {
		return NextResponse.json({ error: "Upload failed: " + uploadError.message }, { status: 500 });
	}

	const { data: { publicUrl } } = supabase.storage
		.from('geothinkr-images')
		.getPublicUrl(fileName);

	const category = formData.get("category") || "landmark";
	const difficulty = formData.get("difficulty") || "medium";
	const verified = formData.get("verified") === "true";

	// Save to DB
	const { data, error: dbError } = await supabase
		.from("geothinkr_photos")
		.insert([{
			image_url: publicUrl,
			x_coordinate: parseInt(x),
			y_coordinate: parseInt(y),
			location_name: name,
			category,
			difficulty,
			verified
		}])
		.select()
		.single();

	if (dbError) {
		return NextResponse.json({ error: "DB Save failed: " + dbError.message }, { status: 500 });
	}

	return NextResponse.json(data, { status: 201 });
}

/*
	Function: PATCH
	Description: Toggles verified status or updates category/difficulty on a photo.
	Arguments: req - Request with JSON { id, verified?, category?, difficulty? }
	Returns: Updated photo record or error
*/
export async function PATCH(req) {
	const body = await req.json().catch(() => ({}));
	const { id, ...updates } = body;
	if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

	const allowedFields = {};
	if (updates.verified !== undefined) allowedFields.verified = updates.verified;
	if (updates.category !== undefined) allowedFields.category = updates.category;
	if (updates.difficulty !== undefined) allowedFields.difficulty = updates.difficulty;

	if (Object.keys(allowedFields).length === 0) {
		return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
	}

	const supabase = createAdminClient();
	const { data, error } = await supabase
		.from("geothinkr_photos")
		.update(allowedFields)
		.eq("photo_id", id)
		.select()
		.single();

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });
	return NextResponse.json(data);
}

export async function DELETE(req) {
	const body = await req.json().catch(() => ({}));
	const { id } = body;
	if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

	const supabase = createAdminClient();

	// Ideally we should delete from storage too but filename is not stored directly, 
	// we have URL. Can parse it or just leave it for now (soft delete).
	// To be clean: retrieve record, parse URL, delete file.

	// Delete from DB
	const { error } = await supabase
		.from("geothinkr_photos")
		.delete()
		.eq("photo_id", id);

	if (error) return NextResponse.json({ error: error.message }, { status: 500 });

	return NextResponse.json({ success: true });
}

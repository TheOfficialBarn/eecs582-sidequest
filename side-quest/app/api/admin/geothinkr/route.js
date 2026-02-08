
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

	// Save to DB
	const { data, error: dbError } = await supabase
		.from("geothinkr_photos")
		.insert([{
			image_url: publicUrl,
			x_coordinate: parseInt(x),
			y_coordinate: parseInt(y),
			location_name: name
		}])
		.select()
		.single();

	if (dbError) {
		return NextResponse.json({ error: "DB Save failed: " + dbError.message }, { status: 500 });
	}

	return NextResponse.json(data, { status: 201 });
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

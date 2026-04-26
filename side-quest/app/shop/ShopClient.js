/*
	Name: shop/ShopClient.js
	Description: Client side page for buying profile customization options with points
	Programmers: Aiden Barnard
	Date: 2/09/2026
	Revisions: N/A
	Errors: N/A
	Input: 
		- User auth token (cookie)
	Output: 
		- Shop page client
*/
"use client";

import { useState } from "react";
import { SHOP_AVATARS } from "../../lib/shopData";
import { Check, Upload, Loader2, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function ShopClient({ initialUser }) {
	const [user, setUser] = useState(initialUser);
	const [uploading, setUploading] = useState(false);
	const [loadingMap, setLoadingMap] = useState({}); // Track loading state per avatar

	const handleSelectAvatar = async (avatarUrl) => {
		setLoadingMap(prev => ({ ...prev, [avatarUrl]: true }));
		try {
			const res = await fetch("/api/user/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ profile_picture_url: avatarUrl })
			});

			if (res.ok) {
				// Update local state
				setUser({ ...user, profile_picture_url: avatarUrl });
			} else {
				alert("Failed to update avatar");
			}
		} catch (e) {
			console.error(e);
			alert("Error updating avatar");
		} finally {
			setLoadingMap(prev => ({ ...prev, [avatarUrl]: false }));
		}
	};

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setUploading(true);
		const formData = new FormData();
		formData.append("file", file);

		try {
			const res = await fetch("/api/upload", {
				method: "POST",
				body: formData
			});
			const data = await res.json();
			if (res.ok) {
				setUser({ ...user, profile_picture_url: data.url });
			} else {
				alert("Upload failed: " + data.message);
			}
		} catch (err) {
			console.error(err);
			alert("Upload error");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="space-y-8">
			{/* Current Avatar Section */}
			<div className="flex flex-col items-center justify-center mb-8 p-6 bg-white rounded-2xl border-4 border-[#FF7A00] shadow-[6px_6px_0_#00AEEF]">
				<h3 className="text-xl font-extrabold text-[#FF7A00] drop-shadow-[1px_1px_#FFDA00] mb-4">Current Avatar</h3>
				<div className="relative">
					<img
						src={user.profile_picture_url || "https://api.dicebear.com/9.x/avataaars/svg?seed=Default"}
						alt="Current Avatar"
						className="w-32 h-32 rounded-full border-4 border-[#FF7A00] object-cover bg-gray-100"
					/>
					<label
						className="absolute bottom-0 right-0 bg-[#00AEEF] text-white p-2 rounded-full cursor-pointer hover:bg-[#0096D6] transition-colors border-2 border-white"
						title="Upload Custom Avatar"
					>
						{uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
						<input
							type="file"
							accept="image/*"
							className="hidden"
							onChange={handleFileUpload}
							disabled={uploading}
						/>
					</label>
				</div>
				<p className="text-sm text-[#00AEEF] font-semibold mt-2">
					{uploading ? "Uploading..." : "Click icon to upload custom"}
				</p>
			</div>

			{/* Shop Grid */}
			<div>
				<h2 className="text-2xl font-extrabold text-[#FF7A00] drop-shadow-[2px_2px_#FFDA00] mb-6 flex items-center gap-2">
					<ShoppingBag className="w-6 h-6" />
					Avatar Shop
				</h2>
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
					{SHOP_AVATARS.map((avatar) => {
						const isSelected = user.profile_picture_url === avatar.url;
						const isLoading = loadingMap[avatar.url];

						return (
							<motion.div
								key={avatar.id}
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className={`
                                    relative p-4 rounded-2xl border-4 transition-all cursor-pointer bg-white flex flex-col items-center gap-3
                                    ${isSelected ? 'border-green-500' : 'border-[#00AEEF] hover:border-[#FF7A00]'}
                                `}
								onClick={() => !isSelected && handleSelectAvatar(avatar.url)}
							>
								<img src={avatar.url} alt={avatar.name} className="w-20 h-20 rounded-full bg-gray-50" />
								<div className="text-center">
									<div className="font-extrabold text-[#FF7A00]">{avatar.name}</div>
									<div className="text-xs text-[#00AEEF] font-bold uppercase tracking-wider">Free</div>
								</div>

								{isSelected && (
									<div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 border-2 border-white">
										<Check className="w-4 h-4" />
									</div>
								)}

								{isLoading && (
									<div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
										<Loader2 className="w-6 h-6 animate-spin text-[#00AEEF]" />
									</div>
								)}
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

/*
	Name: layout.js
	Description: Defines common styles used across all pages in the app.
	Programmers: Aiden Barnard, Alejandro Sandoval, Pashia Vang
	Date: 10/25/2025
	Revisions: 
		Add notifications - 11/06/2025
		Add welcome modal - 11/09/2025
		Additional comments - 11/23/2025
		Add PWA / Apple Web App support - 04/12/2026
	Errors: N/A
	Input:
		Style request from page
	Output:
		Root layout style
		Fonts
*/

// Fonts: imported via Next's font helper for optimized loading and CSS vars.
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

// Global stylesheet applied across the app
import "./globals.css";

// App chrome: top toolbar and page-level providers
import Toolbar from "./components/toolbar";
import { NotificationProvider } from "./contexts/NotificationContext";
import WelcomeModal from "./components/welcome-modal";

// Project Description //
// Metadata: used by Next for the document head and SEO
export const metadata = {
	title: "Side Quest",
	description: "An app that gives fun campus challenges and tracks your progress.",

	// PWA: Web App Manifest link
	manifest: "/manifest.json",

	// PWA: Theme color for browser chrome and status bar
	themeColor: "#FF7A00",

	// PWA: Apple-specific web app configuration
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "Side Quest",
	},

	// PWA: Viewport with notch support
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		viewportFit: "cover",
	},

	// PWA: Icon references
	icons: {
		icon: [
			{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
			{ url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
	},
};

// Fonts: configure font variables that are applied on the <body> element.
// The `variable` option exposes a CSS custom property so components can
// reference the loaded font families (useful for mixing typefaces).
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Root Layout //
/*
	This will be used as the root across all pages in the app.
*/
export default function RootLayout({ children }) {
	/*
		Root layout composes the top-level app chrome and providers.
		- `NotificationProvider` makes in-app notifications available to descendants.
		- `Toolbar` renders the site navigation and auth controls.
		- `WelcomeModal` shows a one-time onboarding modal for new users.
		- The font CSS variables are applied on `<body>` so all components
		  can inherit the chosen typefaces.
		- PWA service worker is registered via an inline script.
		- Apple splash screen startup images are linked in <head>.
	*/
	return (
		<html lang="en">
			<head>
				{/* Apple PWA Splash Screens for various iOS devices */}
				{/* iPhone 14 Pro Max, 15 Plus, 16 Plus */}
				<link
					rel="apple-touch-startup-image"
					href="/icons/apple-splash-1242x2688.png"
					media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
				/>
				{/* iPhone 14 Pro, 15, 16 */}
				<link
					rel="apple-touch-startup-image"
					href="/icons/apple-splash-1170x2532.png"
					media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
				/>
				{/* iPhone X, XS, 11 Pro */}
				<link
					rel="apple-touch-startup-image"
					href="/icons/apple-splash-1125x2436.png"
					media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
				/>
				{/* iPhone XR, 11 */}
				<link
					rel="apple-touch-startup-image"
					href="/icons/apple-splash-828x1792.png"
					media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
				/>
				{/* iPad Pro 9.7", iPad Air 2 */}
				<link
					rel="apple-touch-startup-image"
					href="/icons/apple-splash-1536x2048.png"
					media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
				/>
				{/* iPad Pro 12.9" */}
				<link
					rel="apple-touch-startup-image"
					href="/icons/apple-splash-2048x2732.png"
					media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
				/>
			</head>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
			>
				{/*
					App Providers: wrap the chrome and page content so that
					any page/component can access notifications and global state.
				*/}
				<NotificationProvider>
					{/* Top navigation and global UI elements */}
					<Toolbar/>

					{/* One-time welcome modal handled client-side */}
					<WelcomeModal />

					{/*
						Main content container: `flex-1` ensures it expands to
						fill vertical space while toolbar and modal sit above it.
					*/}
					<main className="flex-1 flex flex-col">
						{children}
					</main>
				</NotificationProvider>

				{/* PWA: Register Service Worker */}
				<Script id="sw-register" strategy="afterInteractive">
					{`
						if ('serviceWorker' in navigator) {
							window.addEventListener('load', function() {
								navigator.serviceWorker.register('/sw.js').then(
									function(registration) {
										console.log('SW registered: ', registration.scope);
									},
									function(err) {
										console.log('SW registration failed: ', err);
									}
								);
							});
						}
					`}
				</Script>
			</body>
		</html>
	);
}

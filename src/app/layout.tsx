import type { Metadata, Viewport } from "next";
import "./globals.css";

import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  applicationName: "HuskyPilot",
  title: "HuskyPilot — Your course deadlines, organized",
  description:
    "Turn a HuskyCT or Blackboard ICS calendar into a clear, private deadline dashboard.",
  appleWebApp: {
    capable: true,
    title: "HuskyPilot",
    statusBarStyle: "default",
  },
  icons: {
    // Setting `icons` replaces the file-based convention, so the favicon that
    // `src/app/icon.tsx` serves from /icon has to be declared explicitly.
    icon: "/icon",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "HuskyPilot",
    description: "Your course deadlines, organized.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HuskyPilot",
    description: "Your course deadlines, organized.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2745",
  // Let the app draw under the notch/home indicator when installed,
  // paired with the safe-area padding on <main>.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitFlow — Train SMART",
  description: "Train SMART. Move every day. Personalized workouts, progression, and nutrition.",
  applicationName: "FitFlow",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FitFlow" },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bgRoot text-white">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { ApiKeyProvider } from "@/lib/api-key-context";

export const metadata: Metadata = {
  title: "Care Posture Assist — 介護姿勢アシスト",
  description: "AIによるリアルタイム介護姿勢分析と動画コーチング",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased bg-slate-50 min-h-screen">
        <ApiKeyProvider>
          <div className="flex flex-col min-h-screen max-w-lg mx-auto">
            <Header />
            <main className="flex-1 overflow-y-auto pb-20">{children}</main>
            <BottomNav />
          </div>
        </ApiKeyProvider>
      </body>
    </html>
  );
}

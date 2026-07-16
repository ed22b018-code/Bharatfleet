import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/Session";
import { ToastProvider } from "@/components/Toast";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Bharatfleet — Trusted freight, moved online",
  description: "A freight-brokerage marketplace for the Indian trucking market.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <ToastProvider>
            <Header />
            <main className="mx-auto min-h-[80vh] max-w-3xl px-4 pb-24 pt-4 sm:pb-8">{children}</main>
            <BottomNav />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

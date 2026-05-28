"use client";

import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideSidebar =
    pathname === "/login" ||
    pathname === "/signup";

  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <div className="flex min-h-screen">
          {!hideSidebar && <Sidebar />}
          <main className="flex-1 px-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { SettingsProvider } from "@/contexts/SettingsContext";

interface Props {
  children: React.ReactNode;
  user: { name: string; email: string };
}

export default function DashboardShell({ children, user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-gray-50">
        {open && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        <Sidebar user={user} open={open} onClose={() => setOpen(false)} />

        <div className="flex-1 flex flex-col md:ml-64 min-w-0">
          <header className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-lg font-bold text-green-700">platíca</span>
          </header>

          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SettingsProvider>
  );
}

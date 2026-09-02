"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Lightbulb,
  LogOut,
  User,
  Repeat2,
  X,
  Settings,
} from "lucide-react";
import { PlaticaLogo } from "@/components/ui/PlaticaLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "El resumen", desc: "Tu panorama del mes" },
  { href: "/commitments", icon: Repeat2, label: "Compromisos", desc: "Ingresos y gastos recurrentes" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transacciones", desc: "Tus movimientos reales" },
  { href: "/savings", icon: PiggyBank, label: "Ahorros", desc: "Metas y aportes" },
  { href: "/insights", icon: Lightbulb, label: "Consejos", desc: "Análisis y tips" },
  { href: "/settings", icon: Settings, label: "Configuración", desc: "Preferencias y ayuda" },
];

interface SidebarProps {
  user: { name: string; email: string };
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <PlaticaLogo size="sm" />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label, desc }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex flex-col leading-tight min-w-0">
                <span className="font-medium">{label}</span>
                <span className={`text-xs font-normal truncate ${active ? "text-green-600" : "text-gray-400"}`}>
                  {desc}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2 w-full text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

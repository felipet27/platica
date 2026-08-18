import Link from "next/link";
import { TrendingUp, Shield, BarChart3, Bell } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-green-700">Plática</span>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-green-700 font-medium hover:text-green-800 transition-colors">
            Iniciar sesión
          </Link>
          <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
            Registrarse
          </Link>
        </div>
      </nav>

      <section className="text-center py-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Controla tus finanzas,<br />
          <span className="text-green-600">construye tu futuro</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Gestiona ingresos y egresos, visualiza tus patrones de gasto y recibe recomendaciones personalizadas de ahorro.
        </p>
        <Link href="/register" className="inline-block px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg">
          Comenzar gratis
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-16 max-w-6xl mx-auto">
        {[
          {
            icon: TrendingUp,
            title: "Ingresos y egresos",
            desc: "Registra y categoriza todas tus transacciones con etiquetas personalizadas.",
          },
          {
            icon: BarChart3,
            title: "Visualización de datos",
            desc: "Gráficas interactivas para entender tus patrones financieros mes a mes.",
          },
          {
            icon: Bell,
            title: "Alertas inteligentes",
            desc: "Notificaciones y recomendaciones de ahorro basadas en tu historial.",
          },
          {
            icon: Shield,
            title: "Seguridad avanzada",
            desc: "Autenticación de dos factores y cifrado para proteger tu información.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="text-center py-8 text-gray-400 text-sm">
        © 2026 Plática. Todos los derechos reservados.
      </footer>
    </main>
  );
}

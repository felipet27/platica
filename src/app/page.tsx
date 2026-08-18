import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Repeat2,
  PiggyBank,
  Lightbulb,
  CheckCircle2,
  Clock,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-green-700">Platíca</span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-green-700 font-medium hover:text-green-800 transition-colors text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
          >
            Registrarse gratis
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-16 px-6 max-w-4xl mx-auto">
        <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-5">
          Gratis · Sin tarjeta · Sin límites
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 leading-tight">
          Controla tus finanzas,<br />
          <span className="text-green-600">construye tu futuro</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Registra tus compromisos fijos, visualiza en qué gastas y recibe
          consejos personalizados para ahorrar más cada mes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-green-600 text-white text-base font-semibold rounded-xl hover:bg-green-700 transition-colors shadow-lg"
          >
            Comenzar gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-green-700 text-base font-semibold rounded-xl hover:bg-green-50 transition-colors border border-green-200"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Mockup del dashboard */}
      <section className="px-6 max-w-4xl mx-auto mb-20">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Barra de navegador */}
          <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 bg-white rounded-md text-xs text-gray-400 px-3 py-1 ml-3">
              platica-jjcn.vercel.app/dashboard
            </div>
          </div>

          {/* Contenido del mockup */}
          <div className="flex" style={{ height: "280px" }}>
            {/* Sidebar */}
            <div className="w-36 bg-white border-r border-gray-100 p-3 shrink-0 hidden sm:block">
              <p className="text-sm font-bold text-green-700 mb-4 px-2">Platíca</p>
              {[
                { label: "Dashboard", active: true },
                { label: "Compromisos", active: false },
                { label: "Transacciones", active: false },
                { label: "Ahorros", active: false },
                { label: "Consejos", active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`text-xs px-2 py-1.5 rounded-lg mb-1 font-medium ${
                    item.active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-400"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>

            {/* Dashboard content */}
            <div className="flex-1 bg-gray-50 p-4 overflow-hidden">
              {/* Balance hero */}
              <div className="bg-white rounded-xl p-3 shadow-sm mb-3">
                <p className="text-xs text-gray-400 mb-0.5">Balance del mes</p>
                <p className="text-2xl font-bold text-gray-900">$2.300.000</p>
                <div className="mt-2 flex justify-between text-xs mb-1">
                  <span className="text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> $4.500.000
                  </span>
                  <span className="text-red-500 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> $2.200.000
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "49%" }} />
                </div>
              </div>

              {/* KPIs + compromisos */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-white rounded-xl p-2.5 shadow-sm">
                  <p className="text-xs text-gray-400">Compromisos</p>
                  <p className="text-base font-bold text-gray-900">
                    4 <span className="text-gray-400 font-normal text-sm">/ 6</span>
                  </p>
                  <p className="text-xs text-gray-400">cubiertos</p>
                </div>
                <div className="bg-white rounded-xl p-2.5 shadow-sm">
                  <p className="text-xs text-gray-400">Libre estimado</p>
                  <p className="text-base font-bold text-green-600">$800.000</p>
                  <p className="text-xs text-gray-400">disponible</p>
                </div>
              </div>

              {/* Compromisos mini-lista */}
              <div className="bg-white rounded-xl p-2.5 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-2">Compromisos del mes</p>
                <div className="space-y-1.5">
                  {[
                    { name: "Arriendo", paid: true },
                    { name: "Internet", paid: true },
                    { name: "Cuota banco", paid: false },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {c.paid
                          ? <CheckCircle2 className="w-3 h-3 text-green-500" />
                          : <Clock className="w-3 h-3 text-amber-400" />}
                        <span className="text-xs text-gray-700">{c.name}</span>
                      </div>
                      {!c.paid && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-medium">
                          Pagado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-3">
          Vista real del panel de control
        </p>
      </section>

      {/* Features — lo que realmente existe */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
          Todo lo que necesitas para tus finanzas
        </h2>
        <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto text-sm">
          Sin complicaciones. Registra, visualiza y mejora.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-16 text-center">
        <div className="bg-green-600 rounded-3xl p-10 max-w-2xl mx-auto shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-3">
            Empieza a controlar tu dinero hoy
          </h2>
          <p className="text-green-100 mb-6 text-sm">
            Configura tus compromisos fijos en menos de 5 minutos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-green-700 font-semibold rounded-xl hover:bg-green-50 transition-colors"
          >
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-400 text-sm border-t border-gray-200">
        <p>© 2026 Platíca · Gestión de finanzas personales</p>
        <p className="mt-1">
          <Link href="/login" className="hover:text-green-600 transition-colors">Iniciar sesión</Link>
          {" · "}
          <Link href="/register" className="hover:text-green-600 transition-colors">Registrarse</Link>
        </p>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: Repeat2,
    title: "Compromisos fijos del mes",
    desc: "Registra arriendo, servicios, préstamos y cualquier gasto fijo. Márcalos como pagados con un clic y ve cuánto te queda libre.",
    color: "#8b5cf6",
  },
  {
    icon: TrendingUp,
    title: "Balance en tiempo real",
    desc: "Ve de un vistazo cuánto entraste, cuánto saliste y cuál es tu balance del mes. Con barra visual para saber qué tan bien vas.",
    color: "#22c55e",
  },
  {
    icon: BarChart3,
    title: "Historial de 6 meses",
    desc: "Gráficas de ingresos vs gastos mes a mes para identificar tendencias y meses con déficit antes de que sea tarde.",
    color: "#3b82f6",
  },
  {
    icon: PiggyBank,
    title: "Planes de ahorro",
    desc: "Crea metas de ahorro con fecha objetivo. El sistema te avisa si tu aporte mensual no alcanza para llegar a tiempo.",
    color: "#f59e0b",
  },
  {
    icon: Lightbulb,
    title: "Consejos personalizados",
    desc: "Análisis de tus gastos por categoría, regla 50/30/20, estrategias de ahorro y manejo inteligente de deudas.",
    color: "#f97316",
  },
  {
    icon: TrendingDown,
    title: "Gastos por categoría",
    desc: "Mercado, transporte, entretenimiento y más. Identifica en qué categoría estás gastando de más cada mes.",
    color: "#ef4444",
  },
];

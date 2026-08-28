# Especificación Técnica — Platíca

## Visión del Producto

Platíca es una plataforma de gestión de finanzas personales orientada al usuario colombiano. Permite registrar ingresos y egresos, gestionar compromisos recurrentes, hacer seguimiento de metas de ahorro, visualizar análisis financieros y recibir consejos personalizados. El nombre es un término coloquial derivado de "plata" (dinero).

---

## Arquitectura Técnica

- **Frontend / Backend:** Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos:** MongoDB Atlas (Mongoose como ODM)
- **Autenticación:** Auth.js v5 (NextAuth) con `@auth/mongodb-adapter`, estrategia JWT
- **Estilos:** Tailwind CSS v4
- **Gráficas:** Recharts
- **Íconos:** Lucide React
- **Notificaciones push:** Web Push API + `web-push`
- **Despliegue:** Vercel (`platica-jjcn.vercel.app`)
- **PWA:** Service Worker + Web App Manifest (instalable en dispositivos)

---

## Modelos de datos (MongoDB)

### User
- `name`, `email`, `password` (bcrypt, select: false), `image`
- `twoFactorEnabled` (Boolean), `twoFactorSecret` (select: false) — campos reservados, sin uso activo
- `preferences.currency` (default: "COP"), `preferences.customCategories` (income[], expense[])
- `loginAttempts`, `lockUntil` — anti-fuerza bruta (5 intentos → bloqueo 15 min)

### Transaction
- `userId`, `type` ("income" | "expense"), `amount`, `category`, `description`, `tags`, `date`
- `commitmentId` (referencia opcional a Commitment)

### Commitment
- `userId`, `name`, `amount`, `type`, `category`, `isActive`
- Para gastos: `expenseType` ("fixed" | "variable"), `frequency`, `payDay`
- Para ingresos: `incomeType`, `frequency`
- Cuotas: `totalInstallments`, `installmentsPaid`
- `paymentDetails` (entity, accountNumber, note)

### Budget
- `userId`, `category`, `limit` — índice único userId+category

### SavingsPlan
- `userId`, `name`, `targetAmount`, `currentAmount`, `targetDate`, `monthlyContribution`
- `contributions[]` (amount, date, note), `isActive`, `category`, `description`

### PushSubscription
- `userId`, `endpoint`, `keys` (p256dh, auth)

---

## Funcionalidades implementadas

### Autenticación y seguridad
- Registro con email y contraseña (bcrypt costo 12)
- Login con email/contraseña y con Google OAuth
- Bloqueo de cuenta tras 5 intentos fallidos (15 minutos)
- Sesión JWT con NextAuth; rutas protegidas por middleware
- Bloqueo por inactividad: pantalla de bloqueo tras 10 minutos sin actividad, requiere contraseña para desbloquear (sin cerrar sesión)

### Dashboard
- Balance del mes: ingresos totales, gastos totales, saldo
- Libre estimado: ingresos menos compromisos fijos y aportes a ahorro
- Recordatorios de compromisos pendientes o vencidos
- Selector de mes (`?month=YYYY-MM`) — recordatorios solo en mes actual
- Consejo financiero del día

### Transacciones
- Registro manual de ingresos y egresos con fecha, categoría y descripción
- Edición y eliminación de transacciones
- Búsqueda por texto (debounce), filtros por categoría y rango de fechas
- Exportación a CSV (`/api/transactions/export`)
- Paginación

### Compromisos
- Gastos e ingresos recurrentes fijos o variables
- Frecuencia mensual o quincenal; día de pago configurable
- Cuotas (totalInstallments / installmentsPaid) con desactivación automática al completar
- Campo `paymentDetails` con entidad, número de cuenta y nota; botón de copia
- Marcar como "Pagado" o "Recibido" genera transacción automáticamente

### Presupuestos por categoría
- Tope mensual por categoría (`Budget`)
- Alerta visual cuando el gasto del mes supera el límite
- Gestión desde la sección Insights

### Planes de ahorro
- Creación de metas con nombre, monto objetivo, fecha y aportación mensual sugerida
- Registro de aportes individuales con nota
- Seguimiento visual del progreso
- Eliminación con opción de liberar el monto ahorrado

### Insights y consejos
- Resumen mensual: ingreso, gasto, balance, tasa de ahorro
- Alertas por categoría cuando supera umbrales definidos
- Detección de gastos hormiga (muchas transacciones pequeñas)
- Regla 50/30/20 con visualización del porcentaje real
- Consejos personalizados según el patrón de gasto del mes

### Configuración
- Selección de moneda: COP, USD, EUR, MXN, BRL (guardada en DB y localStorage)
- Tema claro / oscuro (clase `.dark` en `<html>`, script anti-flash, persistido en localStorage)
- Categorías personalizadas por tipo (income / expense), guardadas en `User.preferences`
- Notificaciones push: suscripción/desuscripción, recordatorios diarios por cron (Vercel Cron 13:00 UTC)
- Guía de uso y glosario de términos integrados en la página de configuración
- Zona de peligro: reset de datos (con opción de conservar compromisos)

### PWA
- Instalable como app en móvil y desktop
- Service Worker con handler de notificaciones push y `notificationclick`
- Manifest con íconos generados dinámicamente

---

## Categorías predefinidas

**Ingresos:** Salario, Freelance, Inversiones, Ventas, Otros ingresos

**Gastos:** Alimentación, Mercado, Transporte, Pasajes, Vivienda, Salud, Educación, Entretenimiento, Paseos, Ropa, Servicios, Gastos hormiga, Deudas, Otros gastos

---

## API — Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | Handlers NextAuth (Google + Credentials) |
| POST | `/api/auth/register` | Registro de usuario |
| GET | `/api/auth/lockstatus?email=X` | Estado de bloqueo de cuenta |
| POST | `/api/auth/verify-password` | Verifica contraseña del usuario autenticado |
| GET | `/api/transactions` | Listar transacciones (filtros, paginación) |
| POST | `/api/transactions` | Crear transacción |
| PATCH | `/api/transactions/[id]` | Editar transacción |
| DELETE | `/api/transactions/[id]` | Eliminar transacción |
| GET | `/api/transactions/summary` | Resumen mensual (últimos 6 meses) |
| GET | `/api/transactions/export` | Exportar CSV |
| GET | `/api/commitments` | Listar compromisos |
| POST | `/api/commitments` | Crear compromiso |
| PUT | `/api/commitments/[id]` | Actualizar compromiso |
| DELETE | `/api/commitments/[id]` | Eliminar compromiso |
| GET | `/api/budgets` | Listar presupuestos con gasto actual |
| POST | `/api/budgets` | Crear/actualizar presupuesto (upsert) |
| DELETE | `/api/budgets/[id]` | Eliminar presupuesto |
| GET | `/api/savings` | Listar planes de ahorro |
| POST | `/api/savings` | Crear plan |
| PATCH | `/api/savings/[id]` | Actualizar plan o registrar aporte |
| DELETE | `/api/savings/[id]` | Eliminar plan |
| GET | `/api/settings` | Obtener preferencias del usuario |
| PATCH | `/api/settings` | Actualizar preferencias |
| POST | `/api/settings/reset` | Resetear datos |
| GET | `/api/insights` | Análisis financiero completo del mes |
| POST | `/api/push/subscribe` | Suscribirse a push notifications |
| DELETE | `/api/push/subscribe` | Desuscribirse |
| GET | `/api/push/vapid-key` | Clave pública VAPID |
| GET | `/api/cron/reminders` | Recordatorios de pagos (requiere CRON_SECRET) |

---

## Variables de entorno requeridas

```
MONGODB_URI=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
CRON_SECRET=
```

---

## Convenciones del proyecto

- Nombre: **Platíca** (P mayúscula, acento en í). URLs y claves de storage usan `platica` sin acento.
- Moneda por defecto: COP (Peso colombiano, locale `es-CO`, sin decimales).
- Todos los componentes del dashboard usan `const { fmt } = useSettings()` para formatear montos.
- Modales personalizados con Tailwind (nunca `confirm()`, `prompt()` ni `alert()` nativos).
- TypeScript estricto en todo el proyecto.

# PROJECT_CONTEXT.md — MicroERP WhatsApp

> Archivo de contexto universal. Cualquier IA que trabaje en este proyecto debe leer esto primero.

---

## Identidad del proyecto

| Campo | Valor |
|---|---|
| **Nombre** | MicroERP WhatsApp |
| **Tipo** | SaaS B2B — herramienta de gestión para negocios pequeños |
| **Estado actual** | MVP en desarrollo — módulos base completados, módulo de pagos pendiente |
| **Última actualización** | 2025-03-15 |
| **Responsable principal** | Desarrollador (solo) |

---

## Problema que resuelve

Los negocios pequeños que venden por WhatsApp (tiendas, distribuidores, productores) pierden pedidos, no tienen control de inventario y no saben cuánto ganan porque lo hacen todo en papel, cuadernos o mensajes sin estructura. Este sistema les da control sin que tengan que cambiar cómo venden.

---

## Cliente objetivo

- **Segmento:** Emprendedores y negocios informales que venden por WhatsApp — Ecuador, 1-5 personas
- **Dolor principal:** Pierden pedidos, no saben qué stock tienen, no saben sus ganancias reales
- **Alternativa actual:** Cuadernos, Excel básico, notas en WhatsApp, memoria

---

## Propuesta de valor

> "MicroERP ayuda a negocios que venden por WhatsApp a registrar pedidos, controlar inventario y ver sus ganancias reales, sin cambiar cómo trabajan hoy."

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (fullstack) |
| Base de datos | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth (email/password) |
| Pagos | MercadoPago (por implementar) |
| Hosting | Vercel (frontend + API) |
| Email | Resend |
| Monitoreo | Sentry (por configurar) |

---

## Módulos principales

1. **Pedidos** — Registrar, ver y actualizar pedidos de clientes ✅ Completado
2. **Clientes** — Directorio de clientes con historial ✅ Completado
3. **Productos/Inventario** — Catálogo y control de stock 🔄 En progreso
4. **Reportes** — Ventas del día/semana/mes ⏳ Pendiente
5. **Pagos/Suscripción** — Sistema de suscripción del SaaS ⏳ Pendiente

---

## Estado de desarrollo

| Módulo | Estado | Notas |
|---|---|---|
| Auth (registro, login) | ✅ Completado | Funciona, probado |
| Pedidos | ✅ Completado | CRUD completo, falta filtros |
| Clientes | ✅ Completado | CRUD básico |
| Inventario | 🔄 En progreso | Estructura de BD lista, UI pendiente |
| Reportes | ⏳ No iniciado | Depende de que Inventario esté listo |
| Pagos | ⏳ No iniciado | Requiere cuenta de MercadoPago |

---

## Decisiones técnicas clave

- **ADR-001:** Next.js fullstack sobre arquitectura separada → velocidad de desarrollo sobre separación de concerns. Revisable cuando haya 500+ usuarios.
- **ADR-002:** Supabase sobre base de datos propia → cero mantenimiento de infraestructura en MVP.
- **ADR-003:** Por organización (multi-tenant) — cada negocio tiene su propia organización con Row Level Security en Supabase.

---

## Cambios recientes

- **CR-003** Agregar campo "notas" a pedidos — Completado (2025-03-10)
- **CR-004** Módulo de inventario — En implementación (2025-03-15)

---

## Tarea actual / próximo paso

Implementar la UI del módulo de inventario (CR-004). La estructura de base de datos ya está lista (tabla `products` con campo `stock`). Falta:
1. Página de listado de productos con stock actual
2. Formulario para agregar/editar producto
3. Actualización de stock al confirmar pedido

Ver `tasks/active_sprint.md` para desglose.

---

## Documentos relevantes por rol

| Si vas a... | Lee primero... |
|---|---|
| Entender el proyecto | Este archivo + `docs/00_PROJECT_BRIEF.md` |
| Programar el módulo de inventario | `docs/04_DATABASE.md` (tabla products) + `docs/03_ARCHITECTURE.md` + CR-004 |
| Revisar el negocio | `docs/10_BUSINESS_MODEL.md` + `docs/01_PROBLEM_AND_MARKET.md` |
| Implementar pagos | `docs/05_API.md` + `docs/10_BUSINESS_MODEL.md` |

---

## Riesgos activos

- No hay clientes de pago todavía — la validación es solo con usuarios en prueba
- El módulo de inventario está siendo construido sin feedback de usuarios reales sobre cómo necesitan gestionarlo
- Falta monitoring en producción (Sentry no configurado)

---

## Métricas actuales

| Métrica | Valor | Meta |
|---|---|---|
| Usuarios registrados | 3 (prueba) | 10 pagos en 60 días |
| Pedidos registrados | 47 (en cuentas de prueba) | — |
| MRR | $0 | $150 en 60 días |

# 03_ARCHITECTURE.md — Arquitectura MicroERP WhatsApp

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend | Next.js (App Router) | 14.x | SSR, fullstack en un solo repo, Vercel nativo |
| Backend | Next.js API Routes | 14.x | Sin servidor separado — reduce complejidad en MVP |
| Base de datos | PostgreSQL via Supabase | 15.x | Relacional, RLS nativo, free tier suficiente para MVP |
| Auth | Supabase Auth | — | Integrado con DB, JWT automático, sin código de auth propio |
| Storage | Supabase Storage | — | Para imágenes de productos (futuro) |
| Hosting | Vercel | — | Deploy automático, free tier hasta escalar |
| Email | Resend | — | Simple, API limpia, $0 hasta 3000 emails/mes |
| Monitoreo | Sentry | — | Por configurar — errores en producción |
| Pagos | MercadoPago | — | Por implementar — checkout pro |

**Costo estimado mensual en MVP:** ~$0 (Supabase free + Vercel free + Resend free)
**Costo cuando escale:** ~$25-50/mes con Supabase Pro + Vercel Pro

---

## 2. Diagrama de arquitectura

```
[Navegador / Celular del cliente]
            │
            │ HTTPS
            ▼
[Vercel — Next.js App]
    │ Server Components (SSR)
    │ API Routes (/api/*)
    │
    ├──────────────────────────────────┐
    ▼                                  ▼
[Supabase]                        [Resend]
  ├── PostgreSQL (datos)           Emails transaccionales
  ├── Auth (sesiones/JWT)
  └── Storage (archivos)
                                    
[MercadoPago] ← (pendiente implementación)
  Webhooks → /api/webhooks/mercadopago
```

---

## 3. Estructura de módulos

| Módulo | Ruta en código | Estado | Dependencias |
|---|---|---|---|
| Auth | `/app/(auth)/` + `/api/auth/` | ✅ Completado | Supabase Auth |
| Pedidos | `/app/(app)/orders/` + `/api/orders/` | ✅ Completado | Auth, Clientes, Productos |
| Clientes | `/app/(app)/customers/` + `/api/customers/` | ✅ Completado | Auth |
| Inventario | `/app/(app)/products/` + `/api/products/` | 🔄 En progreso | Auth |
| Reportes | `/app/(app)/reports/` + `/api/reports/` | ⏳ Pendiente | Pedidos, Inventario |
| Suscripción | `/app/(app)/billing/` + `/api/billing/` | ⏳ Pendiente | MercadoPago |

---

## 4. Estructura del repositorio de código

```
microerp-whatsapp/
├── app/
│   ├── (auth)/                    ← Rutas de login/registro (sin sidebar)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/                     ← Rutas del dashboard (con layout + sidebar)
│   │   ├── layout.tsx             ← Layout con sidebar y verificación de auth
│   │   ├── dashboard/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx           ← Lista de pedidos
│   │   │   ├── new/page.tsx       ← Nuevo pedido
│   │   │   └── [id]/page.tsx      ← Detalle del pedido
│   │   ├── customers/
│   │   └── products/
│   └── api/
│       ├── orders/route.ts
│       ├── customers/route.ts
│       ├── products/route.ts
│       └── webhooks/
│           └── mercadopago/route.ts
├── components/
│   ├── ui/                        ← Componentes base (Button, Input, Modal)
│   └── modules/                   ← Componentes por módulo
├── lib/
│   ├── supabase/
│   │   ├── client.ts              ← Cliente Supabase (browser)
│   │   └── server.ts              ← Cliente Supabase (server)
│   ├── validations/               ← Schemas Zod
│   └── utils.ts
└── types/
    └── database.ts                ← Tipos generados por Supabase
```

---

## 5. Seguridad

| Área | Implementación |
|---|---|
| Auth | Supabase JWT — todos los API Routes verifican sesión |
| Multi-tenant | Row Level Security (RLS) en Supabase — un negocio NO ve datos de otro |
| Validación de inputs | Zod en todos los API Routes |
| Variables sensibles | Solo en `.env.local` (no en repositorio) |
| Rate limiting | Pendiente — agregar en próximo sprint |

**RLS implementado en tablas:** organizations, orders, customers, products

---

## 6. Decisiones de arquitectura

Ver `docs/08_DECISIONS.md` para ADRs completos.

- **ADR-001:** Next.js fullstack (sin backend separado)
- **ADR-002:** Supabase como BaaS
- **ADR-003:** Multi-tenant con RLS en Supabase
- **ADR-004:** MercadoPago sobre Stripe (acceso local en Ecuador)

---

## 7. Limitaciones conocidas del MVP

- Un solo usuario por organización (no hay roles ni múltiples empleados)
- Sin integración directa con WhatsApp
- Sin exportación de datos
- Sin backup manual (depende de Supabase backup automático)
- Rate limiting no implementado

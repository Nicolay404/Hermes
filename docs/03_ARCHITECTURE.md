# 03_ARCHITECTURE.md — Arquitectura del Sistema

> Este documento es la referencia técnica principal. Ninguna IA debe proponer cambios de arquitectura sin leerlo primero.

---

## 1. Stack tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend | [Ej: Next.js] | [14.x] | [Ej: SSR, ecosistema React, Vercel deploy] |
| Backend | [Ej: Node.js + Express] | [20.x] | [Ej: Misma lengua que frontend, ecosistema npm] |
| Base de datos | [Ej: PostgreSQL via Supabase] | [15.x] | [Ej: Relacional, RLS nativo, gratis en MVP] |
| Auth | [Ej: Supabase Auth] | — | [Ej: Integrado con DB, JWT automático] |
| Almacenamiento | [Ej: Supabase Storage / S3] | — | [Ej: Para archivos e imágenes] |
| Hosting | [Ej: Vercel (frontend) + Railway (backend)] | — | [Ej: Free tier, deploy automático] |
| CI/CD | [Ej: GitHub Actions] | — | [Ej: Deploy automático en push a main] |
| Monitoreo | [Ej: Sentry / LogFlare] | — | [Ej: Errores en producción] |
| IA (si aplica) | [Ej: OpenAI API] | — | [Ej: Para función X] |

---

## 2. Diagrama de arquitectura (descripción)

```
[Navegador / App móvil]
         │
         ▼
[Frontend — Next.js en Vercel]
         │ HTTPS / REST o GraphQL
         ▼
[Backend — Express en Railway]
    │           │
    ▼           ▼
[PostgreSQL]  [Supabase Storage]
         │
         ▼
[Servicios externos: Email, Pagos, IA]
```

*Agregar diagrama visual (Mermaid, draw.io, Excalidraw) si el equipo lo requiere.*

---

## 3. Estructura de módulos

| Módulo | Responsabilidad | Dependencias |
|---|---|---|
| Auth | Registro, login, sesiones, permisos | DB, Email |
| [Módulo A] | [Qué hace] | [Auth, DB] |
| [Módulo B] | [Qué hace] | [Módulo A, DB] |
| API Gateway | Routing, validación, rate limiting | Todos los módulos |

---

## 4. Estructura del repositorio de código

```
proyecto/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.test.ts
│   │   └── [modulo]/
│   ├── shared/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── types/
│   └── config/
├── tests/
├── docs/                  ← Este repositorio de docs
└── scripts/
```

---

## 5. Patrones de diseño usados

| Patrón | Dónde se aplica | Motivo |
|---|---|---|
| Repository Pattern | Acceso a base de datos | Desacoplar lógica de negocio de la DB |
| Service Layer | Lógica de negocio | Separar de controllers |
| [Otro patrón] | [Dónde] | [Por qué] |

---

## 6. Seguridad

| Área | Medida implementada |
|---|---|
| Contraseñas | bcrypt con salt |
| Sesiones | JWT con expiración de [X horas] |
| Rutas privadas | Middleware de autenticación en todas las rutas protegidas |
| Inputs | Validación con [Zod / Joi / otro] en todas las entradas |
| SQL Injection | ORM / queries parametrizadas — nunca SQL concatenado |
| CORS | Configurado para aceptar solo dominios específicos |
| Rate limiting | [X] requests por minuto por IP en endpoints sensibles |
| Variables sensibles | Solo en .env, nunca en código |

---

## 7. Base de datos

Ver `docs/04_DATABASE.md` para el modelo de datos completo.

**Estrategia de migraciones:** [Ej: Prisma Migrate / Flyway / scripts SQL versionados]
**Backup:** [Ej: Supabase backup automático diario]

---

## 8. APIs externas

| Servicio | Propósito | Alternativa si falla |
|---|---|---|
| [Stripe / MercadoPago] | Pagos | No se procesan pagos — mostrar error |
| [SendGrid / Resend] | Emails transaccionales | Logs de emails perdidos para reenvío manual |
| [OpenAI] | [Función específica] | Degradación: función sin IA |

---

## 9. Decisiones de arquitectura

Ver `docs/08_DECISIONS.md` para el registro completo de ADRs.

Decisiones más importantes:
- [ADR-001] [Título] — [Fecha]
- [ADR-002] [Título] — [Fecha]

---

## 10. Restricciones y límites conocidos

- [Límite 1 — ej: No se diseñó para multi-tenant en MVP]
- [Límite 2 — ej: El módulo X no soporta más de 10.000 registros sin paginación]
- [Deuda técnica conocida — ej: Falta caché en endpoint Y]

---

## 11. Guía para nuevos cambios técnicos

Antes de proponer un cambio de arquitectura:

1. Leer este documento completo
2. Revisar las decisiones en `docs/08_DECISIONS.md`
3. Crear un CR en `docs/07_CHANGE_REQUESTS.md`
4. Generar análisis de impacto con `prompts/04_architecture_review.md`
5. Documentar la decisión en un nuevo ADR si se aprueba

---

## Historial de cambios

| Fecha | Cambio | ADR/CR asociado | Autor |
|---|---|---|---|
| [YYYY-MM-DD] | Documento inicial | — | [Nombre] |

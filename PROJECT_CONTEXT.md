# PROJECT_CONTEXT.md

> **Instrucción para cualquier IA:** Este es el primer archivo que debes leer. Resume el estado actual del proyecto. No asumas nada que no esté aquí o en los documentos enlazados.

---

## Identidad del proyecto

| Campo | Valor |
|---|---|
| **Nombre** | [NOMBRE_DEL_PROYECTO] |
| **Tipo** | [SaaS / App móvil / Sistema interno / MVP / Académico / Otro] |
| **Estado actual** | [Descubrimiento / Validación / Diseño / Desarrollo / QA / Producción / Iteración] |
| **Última actualización** | [YYYY-MM-DD] |
| **Responsable principal** | [Nombre o rol] |

---

## Problema que resuelve

[Una o dos oraciones. Qué dolor real resuelve y para quién.]

Ejemplo: *"Los negocios pequeños que venden por WhatsApp pierden pedidos y no tienen inventario centralizado. Este sistema les da control sin cambiar cómo trabajan."*

---

## Cliente objetivo

- **Segmento:** [Descripción del cliente ideal]
- **Dolor principal:** [El problema más urgente]
- **Alternativa actual:** [Cómo lo resuelven hoy sin nuestro producto]

---

## Propuesta de valor

[Una frase que explique qué resultado concreto entrega el producto y por qué es mejor que la alternativa.]

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | [React / Vue / Next.js / Flutter / otro] |
| Backend | [Node.js / Python / Laravel / otro] |
| Base de datos | [PostgreSQL / MySQL / MongoDB / Supabase / otro] |
| Hosting | [Vercel / Railway / VPS / AWS / otro] |
| Auth | [Supabase Auth / NextAuth / Firebase / JWT propio] |
| Pagos | [Stripe / MercadoPago / PayPhone / otro] |
| IA (si aplica) | [OpenAI / Anthropic / Gemini / otro] |

---

## Módulos principales

1. [Módulo 1] — [descripción breve]
2. [Módulo 2] — [descripción breve]
3. [Módulo 3] — [descripción breve]

---

## Estado de desarrollo

| Módulo | Estado | Notas |
|---|---|---|
| [Módulo 1] | [No iniciado / En progreso / Completado / En QA] | |
| [Módulo 2] | [No iniciado / En progreso / Completado / En QA] | |

---

## Decisiones técnicas clave

> Ver lista completa en `docs/08_DECISIONS.md`

- [ADR-001] [Decisión más importante]
- [ADR-002] [Segunda decisión relevante]

---

## Cambios recientes

> Ver historial completo en `docs/07_CHANGE_REQUESTS.md`

- [CR-XXX] [Último cambio implementado] — [YYYY-MM-DD]
- [CR-XXX] [Cambio en progreso] — [YYYY-MM-DD]

---

## Tarea actual / próximo paso

[Qué se está haciendo ahora mismo o qué es lo siguiente a implementar.]

Ver `tasks/active_sprint.md` para el desglose de tareas.

---

## Documentos relevantes por rol

| Si eres... | Lee primero... |
|---|---|
| Nuevo en el proyecto | Este archivo + `docs/00_PROJECT_BRIEF.md` + `docs/03_ARCHITECTURE.md` |
| Va a programar | `docs/02_REQUIREMENTS.md` + `docs/03_ARCHITECTURE.md` + `docs/04_DATABASE.md` |
| Va a revisar código | `docs/09_TESTING_QA.md` + el CR activo en `docs/07_CHANGE_REQUESTS.md` |
| Va a cambiar algo | `docs/07_CHANGE_REQUESTS.md` + `prompts/05_change_impact_analysis.md` |
| Analiza el negocio | `docs/10_BUSINESS_MODEL.md` + `docs/01_PROBLEM_AND_MARKET.md` |

---

## Riesgos activos

> Ver `docs/14_RISKS.md` para detalle completo.

- [Riesgo más urgente]
- [Segundo riesgo relevante]

---

## Métricas clave actuales

> Ver `docs/13_METRICS.md` para definición y seguimiento.

| Métrica | Valor actual | Meta |
|---|---|---|
| [Métrica 1] | — | — |
| [Métrica 2] | — | — |

---

*Actualizar este archivo después de cada sprint, cambio de estado o decisión importante.*

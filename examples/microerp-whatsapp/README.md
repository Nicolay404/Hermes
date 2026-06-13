# MicroERP WhatsApp — Ejemplo de referencia

> Este es un ejemplo completo de cómo se ve el sistema `ai-project-operating-system` aplicado a un proyecto real.

## Qué es este ejemplo

MicroERP WhatsApp es un SaaS para negocios pequeños que venden por WhatsApp. Se usa aquí como proyecto de referencia para mostrar cómo se documenta, planifica y gestiona un proyecto real usando este sistema.

## Estado del ejemplo

Este ejemplo refleja el estado del proyecto al 15 de marzo de 2025:
- Módulos de pedidos y clientes completados
- Módulo de inventario en progreso (sprint 4)
- Módulo de pagos y reportes pendientes
- 3 usuarios en prueba, $0 MRR

## Archivos disponibles en este ejemplo

```
docs/
├── 00_PROJECT_BRIEF.md      ← Descripción completa del proyecto y validación
├── 01_PROBLEM_AND_MARKET.md ← Investigación de mercado con entrevistas reales
├── 03_ARCHITECTURE.md       ← Stack y arquitectura técnica
├── 04_DATABASE.md           ← Modelo de datos completo con SQL
└── 10_BUSINESS_MODEL.md     ← Modelo de negocio, pricing y métricas

tasks/
└── active_sprint.md         ← Sprint 4 activo con tareas reales

PROJECT_CONTEXT.md           ← Estado actual del proyecto (lo que lee la IA)
```

## Cómo usar este ejemplo

1. **Antes de iniciar un proyecto nuevo:** Lee `docs/00_PROJECT_BRIEF.md` y `docs/01_PROBLEM_AND_MARKET.md` para ver cómo se hace el descubrimiento y validación
2. **Antes de diseñar la arquitectura:** Lee `docs/03_ARCHITECTURE.md` y `docs/04_DATABASE.md`
3. **Para entender el modelo de negocio:** Lee `docs/10_BUSINESS_MODEL.md`
4. **Para ver cómo se gestiona el trabajo:** Lee `tasks/active_sprint.md`
5. **Para que una IA retome el proyecto:** Compártele `PROJECT_CONTEXT.md` primero

## Lo que NO está en este ejemplo

Los archivos de prompts, templates y scripts están en la raíz del sistema (`ai-project-operating-system/`) y son los mismos para todos los proyectos.

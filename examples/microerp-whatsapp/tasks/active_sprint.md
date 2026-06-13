# Sprint 4 — Módulo de Inventario

**Período:** 2025-03-15 → 2025-03-28
**Objetivo:** Completar el módulo de inventario (UI) para poder cerrar CR-004 y empezar a preparar el lanzamiento

---

## Estado rápido

| Área | Estado |
|---|---|
| En progreso | 1 tarea |
| Completadas | 2 tareas |
| Pendientes | 3 tareas |
| Bloqueadas | 0 tareas |

---

## Tareas

| ID | Tarea | Prior. | Estado | Notas |
|---|---|---|---|---|
| T-019 | Página listado de productos con stock | Alta | ✅ Completado | `/app/(app)/products/page.tsx` |
| T-020 | Formulario crear/editar producto | Alta | ✅ Completado | Con validación Zod, precio y stock |
| T-021 | API endpoint GET/POST/PUT productos | Alta | 🔄 En progreso | GET listo, POST y PUT en desarrollo |
| T-022 | Trigger SQL para descuento de stock | Alta | ⏳ Pendiente | Ver `docs/04_DATABASE.md` — trigger ya documentado |
| T-023 | Integrar stock en formulario de nuevo pedido | Alta | ⏳ Pendiente | Depende de T-021 y T-022 |
| T-024 | Alerta visual cuando producto < stock mínimo | Media | ⏳ Pendiente | Badge rojo en listado de productos |

---

## CRs en este sprint

| CR | Título | Estado |
|---|---|---|
| CR-004 | Módulo de inventario con control de stock | En implementación |

---

## Actualizaciones

### 2025-03-15
- ✅ Completada la página de listado de productos (T-019)
- ✅ Completado el formulario de crear/editar producto (T-020)
- 🔄 Iniciado endpoint de API para productos

### 2025-03-17
- Problema encontrado: el trigger de SQL para descuento de stock requiere permisos de SECURITY DEFINER en Supabase. Investigar cómo manejarlo correctamente antes de implementar.

---

## Criterio de cierre del sprint

- [ ] T-021, T-022, T-023 completados
- [ ] Prueba manual: crear pedido → confirmar → verificar que el stock bajó
- [ ] Sin errores en Supabase logs después de 24 horas de uso
- [ ] CR-004 actualizado a "Completado"
- [ ] docs/04_DATABASE.md actualizado con el trigger final

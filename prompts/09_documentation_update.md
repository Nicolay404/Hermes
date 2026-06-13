# Prompt 09: Documentation Update — Actualización de documentación

> Usar después de implementar un cambio. La documentación debe estar al día antes de considerar el CR completado.
> Rol activo: [Technical Writer]

---

## Instrucción

Actúa como Technical Writer. Después de implementar los cambios descritos a continuación, necesito actualizar la documentación del proyecto.

---

## Cambio implementado

**CR o tarea:**
[CR-XXX o descripción de la tarea]

**Qué se implementó:**
[DESCRIBIR LOS CAMBIOS REALIZADOS]

**Archivos de código modificados:**
[LISTAR LOS ARCHIVOS TOCADOS]

---

## Documentos a revisar

Para cada documento, dime:
1. ¿Necesita actualización? (Sí / No / Revisar)
2. Qué sección específica cambió
3. El contenido actualizado listo para copiar

**Documentos a evaluar:**

| Documento | ¿Afectado? | Razón |
|---|---|---|
| `docs/00_PROJECT_BRIEF.md` | [Sí/No] | [Cambió la visión o propuesta de valor] |
| `docs/01_PROBLEM_AND_MARKET.md` | [Sí/No] | [Cambió la estrategia de mercado] |
| `docs/02_REQUIREMENTS.md` | [Sí/No] | [Cambiaron requisitos] |
| `docs/03_ARCHITECTURE.md` | [Sí/No] | [Cambió el stack o la arquitectura] |
| `docs/04_DATABASE.md` | [Sí/No] | [Cambiaron tablas o relaciones] |
| `docs/05_API.md` | [Sí/No] | [Cambiaron endpoints o contratos] |
| `docs/06_UI_UX_FLOWS.md` | [Sí/No] | [Cambiaron flujos de usuario] |
| `docs/09_TESTING_QA.md` | [Sí/No] | [Cambiaron casos de prueba] |
| `docs/10_BUSINESS_MODEL.md` | [Sí/No] | [Cambió el modelo de negocio] |
| `PROJECT_CONTEXT.md` | [Siempre] | [Estado actual siempre debe estar al día] |

---

## Acciones adicionales

- [ ] Actualizar `docs/07_CHANGE_REQUESTS.md` → estado del CR a "Completado"
- [ ] Registrar ADR en `docs/08_DECISIONS.md` si hubo decisión técnica relevante
- [ ] Actualizar `tasks/done.md` con la tarea completada
- [ ] Actualizar `tasks/active_sprint.md` si hay tareas relacionadas

---

## Formato de respuesta

Para cada documento que requiere actualización:

```md
### docs/[nombre].md

**Sección a actualizar:** [Nombre de la sección]

**Contenido actual:**
[Texto actual si lo tienes]

**Contenido actualizado:**
[Nuevo texto listo para reemplazar]

**Razón del cambio:**
[Por qué cambió]
```

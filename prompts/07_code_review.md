# Prompt 07: Code Review — Revisión de código

> Usar para revisar código antes de mergear a main o antes de un release.
> Rol activo: [QA Engineer] + [Software Architect]

---

## Instrucción

Actúa como QA Engineer y Software Architect senior. Realiza una revisión completa del siguiente código.

**Criterios de revisión:**
- Corrección: ¿el código hace lo que dice que hace?
- Seguridad: ¿hay vulnerabilidades evidentes?
- Rendimiento: ¿hay problemas obvios de rendimiento?
- Mantenibilidad: ¿es fácil de leer y modificar?
- Consistencia: ¿sigue el mismo estilo que el resto del proyecto?
- Tests: ¿tiene tests suficientes?

---

## Contexto

**Stack del proyecto:**
[PEGAR STACK DE docs/03_ARCHITECTURE.md]

**Funcionalidad que implementa este código:**
[DESCRIBIR QUÉ HACE]

**CR o requisito de referencia:**
[CR-XXX o RF-XXX]

**Criterios de aceptación que debe cumplir:**
[LISTAR LOS CAs]

---

## Código a revisar

[PEGAR EL CÓDIGO A REVISAR]

---

## Formato de respuesta

```md
# Code Review

## Resumen
[Una línea sobre el estado general del código]

## ✅ Lo que está bien
- [Aspecto positivo 1]
- [Aspecto positivo 2]

## 🔴 Hallazgos críticos (bloquean el merge)
### [Hallazgo 1]
- **Problema:** [Qué está mal]
- **Riesgo:** [Qué puede pasar]
- **Sugerencia:** [Cómo corregirlo]

```[código corregido]```

## 🟡 Hallazgos importantes (corregir pronto)
### [Hallazgo 1]
[descripción y sugerencia]

## 🔵 Hallazgos menores (mejoras opcionales)
- [Sugerencia 1]
- [Sugerencia 2]

## 🔒 Análisis de seguridad
- Inputs validados: [Sí / Parcial / No]
- Autenticación verificada: [Sí / No aplica]
- Datos sensibles expuestos: [No / Sí — dónde]
- SQL injection posible: [No / Sí — dónde]
- [Otras observaciones de seguridad]

## ⚡ Análisis de rendimiento
- [Observación 1]
- [Posibles N+1 queries]
- [Operaciones bloqueantes]

## 🧪 Tests
- Cobertura de los criterios de aceptación: [X/Y]
- Tests faltantes críticos: [Lista]

## 📋 Documentación
- Documentación actualizada: [Sí / No — qué falta]

## Veredicto
- [ ] ✅ Aprobado — listo para merge
- [ ] ⚠️ Aprobado con cambios menores — puede mergear después de corregir
- [ ] 🔴 Rechazado — corregir hallazgos críticos antes de volver a revisar
```

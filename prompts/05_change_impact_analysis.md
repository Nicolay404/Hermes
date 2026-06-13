# Prompt 05: Change Impact Analysis — Análisis de impacto de cambio

> Usar SIEMPRE antes de implementar un cambio grande. Obligatorio para cambios que afecten arquitectura, base de datos, auth o pagos.
> Rol activo: [Software Architect] + [QA Engineer]

---

## Contexto del proyecto

**Arquitectura actual:**
[PEGAR CONTENIDO DE docs/03_ARCHITECTURE.md]

**Base de datos actual:**
[PEGAR SECCIONES RELEVANTES DE docs/04_DATABASE.md]

**API actual:**
[PEGAR SECCIONES RELEVANTES DE docs/05_API.md]

---

## Instrucción

Actúa como Software Architect y QA Engineer. Antes de implementar el siguiente cambio, necesito un análisis de impacto completo.

El objetivo es entender exactamente qué se toca, qué puede fallar y cuál es el plan de implementación más seguro.

---

## Cambio solicitado

[DESCRIBIR EL CAMBIO CON EL MAYOR DETALLE POSIBLE]

---

## Análisis que necesito

Responde con exactamente este formato:

```md
# Análisis de impacto

## Cambio solicitado
[Resumen en 1-2 oraciones]

## Objetivo del cambio
[Qué se quiere lograr — problema que resuelve o valor que agrega]

## Archivos probablemente afectados
- [Archivo 1 — por qué]
- [Archivo 2 — por qué]
- [Archivo 3 — por qué]

## Impacto en frontend
[Qué cambia en el cliente/UI]

## Impacto en backend
[Qué cambia en la lógica del servidor]

## Impacto en base de datos
[Si hay cambios en esquema: describir. Si no: "Sin cambios en esquema"]

## Impacto en API
[Si hay cambios en contratos de endpoints: describir. Si no: "Sin cambios de contrato"]

## Impacto en seguridad
[Cualquier implicación de seguridad del cambio]

## Impacto en negocio
[Cómo afecta la experiencia del usuario o el modelo de negocio]

## Riesgos
- [Riesgo 1 — probabilidad y severidad]
- [Riesgo 2]

## Alternativas consideradas
1. [Alternativa rápida — trade-offs]
2. [Alternativa robusta — trade-offs]
3. [Alternativa futura — para cuando escale]

## Plan recomendado
1. [Paso 1 — específico]
2. [Paso 2]
3. [Paso 3]

## Tests necesarios
- [Test 1 — qué valida]
- [Test 2]

## Documentos que deben actualizarse
- [Documento 1 — qué sección]
- [Documento 2]

## Recomendación de aprobación
¿Es necesario aprobación antes de implementar? Sí / No — Justificación
```

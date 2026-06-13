# 15_AI_WORKFLOW.md — Metodología de Trabajo con IA

---

## 1. Principio central

**La IA es una herramienta, no la dueña del proyecto.**

La fuente de verdad es el repositorio. El humano aprueba. La IA ejecuta, analiza y propone.

```
Regla de oro:
Documentos primero → IA después → Código después → Revisión humana siempre
```

---

## 2. Metodología base

### 2.1 SSD ligero (Structured Systems Design)

Aplicado de forma práctica, sin burocracia:

| Fase | Artefacto | ¿Cuándo hacerla? |
|---|---|---|
| 1. Estudio del problema | `docs/00_PROJECT_BRIEF.md` | Antes de escribir una línea de código |
| 2. Factibilidad | `docs/00_PROJECT_BRIEF.md` (riesgos) | Antes de comprometer tiempo |
| 3. Requisitos | `docs/02_REQUIREMENTS.md` | Antes de diseñar |
| 4. Modelado de procesos | `docs/06_UI_UX_FLOWS.md` | Antes de implementar UI |
| 5. Modelo de datos | `docs/04_DATABASE.md` | Antes de crear la DB |
| 6. Diseño modular | `docs/03_ARCHITECTURE.md` | Antes de programar |
| 7. Diseño físico | `docs/03_ARCHITECTURE.md` (hosting, infra) | Antes de deploy |
| 8. Implementación | Código + `tasks/active_sprint.md` | Con CRs y análisis de impacto |
| 9. Pruebas | `docs/09_TESTING_QA.md` | Paralelo a implementación |
| 10. Mantenimiento | `docs/16_RETROSPECTIVES.md` | Post-lanzamiento |

### 2.2 Lean Startup

No construir sin validar:

```
Problema → Cliente → MVP → Experimento → Aprendizaje → Iteración
```

**Criterio de avance:** Si nadie pagaría, no se construye.

### 2.3 Agile práctico

Ciclos cortos (1-2 semanas):

```
Backlog → Sprint planning → Tareas pequeñas → Implementación → Review → Retrospectiva
```

---

## 3. Cuándo involucrar a la IA

| Actividad | ¿Usar IA? | Cómo |
|---|---|---|
| Análisis de problema | Sí | Prompt de discovery |
| Validación de mercado | Parcial | IA ayuda a diseñar experimentos, humano hace las entrevistas |
| Diseño de arquitectura | Sí (propuesta) | IA propone, humano decide |
| Programación | Sí | Por módulo, con contexto completo |
| Revisión de código | Sí | Code review + QA automático |
| Tests | Sí | Generar casos de prueba + código de test |
| Documentación | Sí | Actualizar docs después de cambios |
| Decisiones de negocio | Parcial | IA analiza, humano decide |
| Contacto con clientes | No | Las entrevistas y ventas las hace el humano |
| Deploy a producción | No directamente | Humano ejecuta el deploy |

---

## 4. Flujo completo para proyecto nuevo

### Paso 1: Descubrimiento (IA como Product Strategist)

```
Prompt a usar: prompts/01_project_discovery.md
Artefacto: docs/00_PROJECT_BRIEF.md

IA ayuda a:
- Formular el problema claramente
- Identificar supuestos críticos
- Diseñar las primeras preguntas de entrevista
- Mapear alternativas competidoras
```

### Paso 2: Validación de mercado (humano ejecuta, IA analiza)

```
Prompt a usar: prompts/02_market_validation.md
Artefacto: docs/01_PROBLEM_AND_MARKET.md + experiment_template

Humano hace:
- Entrevistas con 5-10 potenciales clientes
- Experimento (landing, preventa, piloto)

IA ayuda a:
- Diseñar el guion de entrevista
- Analizar los resultados
- Decidir si continuar o pivotar
```

### Paso 3: Definición del MVP

```
Prompt a usar: prompts/03_requirements_analysis.md
Artefacto: docs/02_REQUIREMENTS.md

Criterio de entrada: problema validado con evidencia real
```

### Paso 4: Diseño técnico (IA como Software Architect)

```
Prompt a usar: prompts/04_architecture_review.md
Artefacto: docs/03_ARCHITECTURE.md + docs/04_DATABASE.md + docs/05_API.md

IA propone stack, módulos, modelo de datos.
Humano aprueba antes de implementar.
```

### Paso 5-8: Implementación → QA → Launch → Iteración

```
Ver flujos detallados en CLAUDE.md / AGENTS.md
```

---

## 5. Flujo para cambios en proyecto existente

```
1. Leer PROJECT_CONTEXT.md + docs relevantes
2. Crear CR (templates/change_request_template.md)
3. Ejecutar análisis de impacto (prompts/05_change_impact_analysis.md)
4. Si impacto alto → esperar aprobación
5. Implementar módulo por módulo
6. QA (prompts/08_testing_qa.md)
7. Actualizar documentación
8. Registrar ADR si hubo decisión técnica
```

---

## 6. Reglas de uso de IA en código

### Lo que la IA puede hacer directamente
- Implementar funcionalidades en módulos que no tocan seguridad ni pagos
- Escribir tests unitarios
- Refactorizar código (explicando qué cambia)
- Generar documentación de funciones
- Revisar y sugerir mejoras de código

### Lo que SIEMPRE requiere aprobación humana
- Cambios en autenticación
- Cambios en procesamiento de pagos
- Cambios en esquema de base de datos en producción
- Cambios en variables de entorno
- Cualquier cambio que afecte datos de usuarios

---

## 7. Portabilidad entre IAs

Para cambiar de IA sin perder contexto:

```
Nueva sesión con cualquier IA:
1. Compartir PROJECT_CONTEXT.md
2. Compartir el adaptador de la IA (CLAUDE.md / AGENTS.md / GEMINI.md)
3. Compartir el documento relevante a la tarea
4. La IA puede continuar sin historial del chat
```

---

## 8. Funciones de IA dentro del producto

Para cada función de IA en el producto, documentar:

```md
### [Nombre de la función]
- Usuario: [Quién la usa]
- Problema que resuelve: [Dolor específico]
- Input: [Qué datos recibe]
- Output: [Qué entrega]
- Riesgo de alucinación: Bajo / Medio / Alto
- Validación: [Cómo se verifica la respuesta]
- Control humano: [Dónde interviene el usuario]
- Costo estimado de API: [Bajo / Medio / Alto]
- Valor de negocio: [Por qué vale el costo]
```

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| [YYYY-MM-DD] | Documento inicial | [Nombre] |

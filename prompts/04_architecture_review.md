# Prompt 04: Architecture Review — Diseño y revisión de arquitectura

> Usar para proponer o revisar la arquitectura técnica del proyecto.
> Rol activo: [Software Architect]

---

## Contexto del proyecto

**Requisitos del MVP:**
[PEGAR CONTENIDO RELEVANTE DE docs/02_REQUIREMENTS.md]

**Restricciones técnicas y de negocio:**
- Presupuesto de infraestructura: $[X/mes]
- Tiempo de desarrollo estimado: [X semanas]
- Equipo: [Solo yo / X personas]
- Experiencia técnica del equipo: [Stack actual, lenguajes conocidos]

---

## Instrucción

Actúa como Software Architect senior. Necesito diseñar (o revisar) la arquitectura técnica para este proyecto.

**Principios que debes aplicar:**
1. Simple es mejor que elegante — el MVP debe ser fácil de mantener
2. No sobre-ingenierizar — si va a tener 100 usuarios, no necesita arquitectura para 1 millón
3. Usar tecnologías probadas — no experimentar con stack nuevo en producción
4. Minimizar la deuda técnica crítica — lo que toca seguridad debe estar bien

**Lo que necesito:**

### 1. Propuesta de stack tecnológico

Para cada capa (frontend, backend, DB, auth, hosting, CI/CD):
- Tecnología recomendada
- Alternativa descartada y por qué
- Costo estimado por mes
- Justificación en función de los requisitos

### 2. Diagrama de arquitectura (en texto)

Describir cómo se comunican las capas del sistema.

### 3. Estructura de módulos

Qué módulos tiene el sistema y cómo se relacionan entre sí.

### 4. Modelo de datos (borrador)

Las entidades principales y sus relaciones (no hace falta el esquema completo, solo las entidades y relaciones clave).

### 5. Decisiones técnicas importantes

Para cada decisión no obvia:
- Qué se decidió
- Por qué (justificación)
- Trade-off aceptado

Formateadas como ADRs para `docs/08_DECISIONS.md`.

### 6. Riesgos técnicos

¿Qué parte de la arquitectura propuesta tiene más riesgo? ¿Cómo mitigarlo?

### 7. Lo que NO se diseña en el MVP

Decisiones de arquitectura que se dejan para cuando el producto escale.

---

## Arquitectura actual (si existe)

[PEGAR CONTENIDO DE docs/03_ARCHITECTURE.md si hay una arquitectura existente que revisar]

[Si es proyecto nuevo, omitir esta sección]

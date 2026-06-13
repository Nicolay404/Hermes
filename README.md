# AI Project Operating System

Sistema operativo de trabajo con IA para desarrollo de software, startups y gestión de proyectos.

## ¿Qué es esto?

Una metodología base reutilizable que combina **SSD ligero + Lean Startup + Agile práctico + AI-assisted development**. Sirve para iniciar, continuar y gestionar cualquier proyecto de software, SaaS, startup o proyecto académico usando IA de forma profesional y controlada.

**La fuente de verdad no es el chat. Es este repositorio.**

## Principio central

```
Documentos primero → IA después → Código después → Revisión humana siempre
```

## Compatible con

- Claude / Claude Code
- ChatGPT / GPT-4o / Codex
- Gemini CLI / AI Studio
- Cursor IDE
- GitHub Copilot (con adaptación mínima)

## Estructura

```
ai-project-operating-system/
├── README.md                  ← Este archivo
├── CLAUDE.md                  ← Adaptador para Claude
├── AGENTS.md                  ← Adaptador genérico para agentes
├── GEMINI.md                  ← Adaptador para Gemini
├── CURSOR.md                  ← Adaptador para Cursor IDE
├── PROJECT_CONTEXT.md         ← Estado actual del proyecto (entrada universal para cualquier IA)
├── docs/                      ← Fuente de verdad del proyecto
├── prompts/                   ← Prompts reutilizables por fase
├── templates/                 ← Plantillas operativas
├── tasks/                     ← Gestión de trabajo
├── scripts/                   ← Automatización de setup y validación
└── examples/                  ← Proyectos de ejemplo con docs reales
```

## Cómo usar este sistema

### Para un proyecto nuevo

1. Copia esta carpeta y renómbrala con el nombre de tu proyecto
2. Edita `PROJECT_CONTEXT.md` con la información básica
3. Abre `CLAUDE.md` (o el adaptador de tu IA) y úsalo como instrucción de sistema
4. Sigue el flujo de descubrimiento en `docs/00_PROJECT_BRIEF.md`
5. No escribas código hasta completar al menos `docs/00`, `docs/01` y `docs/02`

### Para un proyecto existente

1. Lee `PROJECT_CONTEXT.md` para entender el estado actual
2. Revisa el último cambio en `docs/07_CHANGE_REQUESTS.md`
3. Consulta `docs/03_ARCHITECTURE.md` antes de proponer cambios técnicos
4. Usa el prompt `prompts/05_change_impact_analysis.md` antes de implementar

### Para cambiar de IA

1. La nueva IA lee `PROJECT_CONTEXT.md`
2. Lee los docs relevantes a la tarea actual
3. Usa el prompt maestro `prompts/00_master_context.md`
4. La nueva IA tiene suficiente contexto para continuar sin empezar desde cero

## Flujo de trabajo resumido

```
NUEVO PROYECTO
  └─→ Descubrimiento → Validación → MVP → Diseño Técnico → Implementación → QA → Lanzamiento → Iteración

PROYECTO EXISTENTE
  └─→ Leer contexto → Crear CR → Analizar impacto → Aprobar → Implementar → QA → Documentar

CAMBIO GRANDE
  └─→ CR obligatorio → Análisis de impacto → Aprobación explícita → Implementación controlada
```

## Reglas de oro

1. **Ninguna IA toca producción, pagos, auth o base de datos sin aprobación explícita**
2. **Todo cambio relevante termina documentado en `/docs`**
3. **Si no está en un documento, no cuenta**
4. **MVP primero. Escalar después. Validar antes de construir**
5. **No reescribir desde cero si existe base funcional**

## Ejemplo de referencia

Revisa `examples/microerp-whatsapp/` para ver cómo se ve el sistema completo aplicado a un proyecto real.

## Metodología

Ver `docs/15_AI_WORKFLOW.md` para la metodología completa de trabajo con IA.

---

*Sistema diseñado para ser portable, mantenible y profesional desde el primer día.*

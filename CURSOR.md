# CURSOR.md — Instrucciones para Cursor IDE

> Copia el contenido de la sección "Reglas para .cursorrules" en tu archivo `.cursorrules` en la raíz del proyecto de código. El resto de este archivo son instrucciones contextuales.

---

## Reglas para .cursorrules

```
Eres un asistente técnico trabajando en este proyecto. Antes de proponer cualquier cambio, debes entender el contexto existente.

REGLAS:
1. Lee PROJECT_CONTEXT.md y docs/03_ARCHITECTURE.md antes de sugerir cambios de arquitectura.
2. No cambies el stack tecnológico sin justificar explícitamente el motivo.
3. No borres código existente sin explicar el impacto.
4. No instales dependencias nuevas sin mencionar alternativas y justificar la elección.
5. No toques archivos de autenticación, pagos o seguridad sin análisis de impacto previo.
6. No generes abstracciones prematuras. Prioriza simplicidad.
7. Cuando modifiques una función, explica qué archivos más podrían verse afectados.
8. Siempre propón tests junto con el código que implementas.
9. Si el cambio es grande, propón el plan primero y espera aprobación.
10. Mantén nombres de variables y funciones claros y descriptivos en español o inglés (consistente con el proyecto).

ARCHIVOS QUE NO DEBES MODIFICAR SIN AVISO EXPLÍCITO:
- Archivos de migraciones de base de datos
- Configuración de autenticación
- Variables de entorno (.env)
- Archivos de configuración de pagos
- Scripts de deploy

FORMATO DE RESPUESTA PREFERIDO:
- Explica qué vas a cambiar y por qué
- Lista los archivos afectados
- Implementa el cambio
- Indica qué tests son necesarios
```

---

## Contexto de proyecto para Cursor

Cursor puede leer archivos del repositorio directamente. Para cada sesión de trabajo importante, abre estos archivos como referencia:

```
PROJECT_CONTEXT.md          ← estado del proyecto
docs/03_ARCHITECTURE.md     ← arquitectura técnica
docs/04_DATABASE.md         ← modelo de datos
docs/07_CHANGE_REQUESTS.md  ← cambio activo (si hay)
tasks/active_sprint.md      ← tarea actual
```

---

## Flujo de trabajo con Cursor

### Para una tarea nueva
1. Abre `tasks/active_sprint.md` y selecciona la tarea
2. Abre los archivos relevantes en el editor
3. En el chat de Cursor: *"Estoy trabajando en [tarea]. Lee PROJECT_CONTEXT.md y docs/03_ARCHITECTURE.md. Propón el plan antes de implementar."*
4. Revisa el plan, aprueba o ajusta
5. Cursor implementa
6. Revisa el diff antes de guardar
7. Actualiza la documentación afectada

### Para un cambio a código existente
1. Abre el archivo a modificar
2. En el chat de Cursor: *"Quiero cambiar [X]. Lee docs/03_ARCHITECTURE.md y dime el impacto antes de tocar el código."*
3. Revisa el análisis de impacto
4. Procede o ajusta

---

## Atajos útiles en Cursor

- `Ctrl+K` (o `Cmd+K`) — edición inline con IA
- `Ctrl+L` — abrir chat con contexto del archivo actual
- `@archivo` — incluir archivo específico en el contexto del chat
- `@docs` — incluir documentación del proyecto

---

## Compatibilidad

Este sistema es compatible con Cursor's `.cursorrules`, Cursor's chat, y Cursor's Composer. El mismo sistema de documentos funciona con Claude (`CLAUDE.md`) y otros agentes (`AGENTS.md`).

# 14_RISKS.md — Registro de Riesgos

---

## Matriz de evaluación

| Probabilidad \ Impacto | Bajo | Medio | Alto |
|---|---|---|---|
| Alta | ⚠️ Monitorear | 🔴 Mitigar activamente | 🔴 Prioridad máxima |
| Media | ✅ Aceptar | ⚠️ Monitorear | 🔴 Mitigar activamente |
| Baja | ✅ Aceptar | ✅ Aceptar | ⚠️ Monitorear |

---

## Riesgos técnicos

| ID | Riesgo | Probabilidad | Impacto | Nivel | Mitigación | Estado |
|---|---|---|---|---|---|---|
| RT-001 | [Ej: Base de datos sin backup automático] | Alta | Alto | 🔴 | Activar backup automático diario | Pendiente |
| RT-002 | [Ej: Dependencia de API externa sin fallback] | Media | Alto | 🔴 | Implementar manejo de error y degradación | Pendiente |
| RT-003 | [Ej: Sin manejo de rate limiting en API propia] | Media | Medio | ⚠️ | Agregar rate limiting con express-rate-limit | Planificado |
| RT-004 | [Ej: Falta de tests en módulo crítico] | Alta | Medio | ⚠️ | Escribir tests en próximo sprint | Planificado |

---

## Riesgos de negocio

| ID | Riesgo | Probabilidad | Impacto | Nivel | Mitigación | Estado |
|---|---|---|---|---|---|---|
| RN-001 | [Ej: El cliente objetivo no está dispuesto a pagar] | Media | Alto | 🔴 | Hacer 10 entrevistas + preventa antes de construir | En progreso |
| RN-002 | [Ej: Competidor grande entra al mercado] | Baja | Alto | ⚠️ | Nicho muy específico difícil de replicar | Monitoreando |
| RN-003 | [Ej: Precio muy bajo para ser sostenible] | Media | Medio | ⚠️ | Calcular CAC real después de primeros 10 clientes | Pendiente |

---

## Riesgos operativos

| ID | Riesgo | Probabilidad | Impacto | Nivel | Mitigación | Estado |
|---|---|---|---|---|---|---|
| RO-001 | [Ej: Dependencia de una sola persona técnica] | Alta | Alto | 🔴 | Documentar procesos, pair programming | En progreso |
| RO-002 | [Ej: Sin proceso de onboarding documentado] | Alta | Medio | ⚠️ | Documentar y automatizar onboarding | Planificado |

---

## Riesgos de seguridad

| ID | Riesgo | Probabilidad | Impacto | Nivel | Mitigación | Estado |
|---|---|---|---|---|---|---|
| RS-001 | [Ej: Exposición de datos sensibles en logs] | Media | Alto | 🔴 | Auditar todos los logs, mascarar datos | Pendiente |
| RS-002 | [Ej: Variables de entorno en repositorio] | Baja | Alto | ⚠️ | .gitignore + revisión de historial git | Resuelto |

---

## Riesgos resueltos

| ID | Riesgo | Cómo se resolvió | Fecha |
|---|---|---|---|
| [RT-XXX] | [Descripción] | [Solución] | [YYYY-MM-DD] |

---

## Revisión de riesgos

**Frecuencia de revisión:** Mensual o ante un evento relevante

**Última revisión:** [YYYY-MM-DD]
**Próxima revisión:** [YYYY-MM-DD]

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| [YYYY-MM-DD] | Documento inicial | [Nombre] |

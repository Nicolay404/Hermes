# 10_BUSINESS_MODEL.md — Modelo de Negocio

---

## 1. Propuesta de valor

**Para quién:** [Segmento específico]
**Problema que resuelve:** [Dolor concreto]
**Resultado que promete:** [Qué logra el cliente]
**Diferenciador:** [Por qué es mejor que la alternativa actual]

---

## 2. Segmentos de cliente

| Segmento | Descripción | Tamaño estimado | Prioridad |
|---|---|---|---|
| [Segmento 1 — beachhead] | [Quiénes son] | [N] | Principal |
| [Segmento 2 — expansión] | [Quiénes son] | [N] | Secundario |

---

## 3. Canales de distribución

| Canal | Descripción | Costo de adquisición estimado | Estado |
|---|---|---|---|
| Ventas directas por WhatsApp | Contacto uno a uno con cliente ideal | Bajo (tiempo) | Activo |
| Referidos | Clientes actuales refieren a otros | Muy bajo | Por activar |
| Redes sociales orgánico | Instagram, TikTok, Facebook | Bajo (tiempo) | Por activar |
| Publicidad pagada | Meta Ads / Google Ads | Alto | Después de validar |

---

## 4. Fuentes de ingresos

| Fuente | Modelo | Precio | Notas |
|---|---|---|---|
| [Plan Básico] | Suscripción mensual | $[X]/mes | [Qué incluye] |
| [Plan Profesional] | Suscripción mensual | $[Y]/mes | [Qué incluye] |
| [Servicio adicional] | Pago único | $[Z] | [Cuándo aplica] |

### Pricing justificado

**Precio base elegido:** $[X]/mes

**Justificación:**
- El cliente gasta actualmente [alternativa] que le cuesta $[Y]/mes en tiempo o dinero
- Nuestro producto le ahorra/genera [resultado concreto]
- El precio es [X]% del valor que genera
- Competencia directa cobra: $[rango]

### Umbrales de rentabilidad

| Clientes de pago | Ingreso mensual | Estado |
|---|---|---|
| 10 | $[X * 10] | Validación inicial |
| 50 | $[X * 50] | Cubrir costos operativos |
| 200 | $[X * 200] | Crecimiento sostenible |

---

## 5. Estructura de costos

### Costos fijos mensuales

| Concepto | Costo |
|---|---|
| Hosting (Vercel + Railway / VPS) | $[X]/mes |
| Base de datos (Supabase / PlanetScale) | $[X]/mes |
| Email (SendGrid / Resend) | $[X]/mes |
| Dominio | $[X]/mes (prorrateado) |
| IA (OpenAI / Anthropic si aplica) | $[X]/mes (estimado) |
| **Total fijo** | **$[total]/mes** |

### Costos variables (por cliente)

| Concepto | Costo estimado |
|---|---|
| Storage por cliente | $[X]/mes |
| Emails por cliente | $[X]/mes |
| API de IA por cliente (si aplica) | $[X]/mes |
| **Total variable por cliente** | **$[total]/mes** |

### Margen bruto estimado

```
Precio plan = $[X]
Costo variable por cliente = $[Y]
Margen bruto por cliente = $[X - Y] ([Z]%)
```

---

## 6. Ciclo de ventas

```
1. Descubrimiento → cliente conoce el producto (red social, referido, búsqueda)
2. Interés → visita landing o nos contacta
3. Demo / prueba → prueba el producto o ve demo en video
4. Conversión → inicia plan de pago
5. Onboarding → primeros días de uso
6. Retención → usa activamente en los primeros 30 días
7. Expansión → recomienda a otros o sube de plan
```

**Tiempo promedio de ciclo de venta:** [X días]

---

## 7. Métricas de negocio

| Métrica | Definición | Meta actual |
|---|---|---|
| MRR (Monthly Recurring Revenue) | Ingreso mensual recurrente | $[X] |
| Churn mensual | % clientes que cancelan por mes | < [X]% |
| CAC (Costo de adquisición) | Costo promedio para conseguir 1 cliente | < $[X] |
| LTV (Lifetime Value) | Ingreso promedio por cliente durante su ciclo | > $[X] |
| LTV/CAC | Ratio de rentabilidad | > 3x |
| Tiempo al primer pago | Días desde registro hasta primer pago | < [X] días |

---

## 8. Retención y expansión

**Estrategia de retención:**
- [Acción 1 — ej: onboarding guiado los primeros 7 días]
- [Acción 2 — ej: reporte semanal automático de valor generado]
- [Acción 3 — ej: soporte por WhatsApp en primeras semanas]

**Señales de churn inminente:**
- [Señal 1 — ej: no inicia sesión en 10 días]
- [Señal 2 — ej: no completa onboarding en 3 días]

**Oportunidades de upsell:**
- [Cuándo y cómo ofrecer plan superior]

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| [YYYY-MM-DD] | Documento inicial | [Nombre] |

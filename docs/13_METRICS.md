# 13_METRICS.md — Métricas y KPIs

> Si no se mide, no se gestiona. Definir métricas antes de necesitarlas.

---

## 1. Métrica estrella (North Star)

**La métrica que mejor representa el valor que entregamos:**

> [Ej: "Pedidos gestionados por semana por cliente activo"]

Todo lo demás apoya a esta métrica.

---

## 2. Métricas de negocio

| Métrica | Definición | Fórmula | Frecuencia | Meta actual |
|---|---|---|---|---|
| MRR | Ingreso mensual recurrente | Suma de pagos mensuales activos | Mensual | $[X] |
| ARR | Ingreso anual recurrente | MRR × 12 | Mensual | $[X] |
| Churn mensual | % clientes que cancelan | Cancelados / Total del mes anterior | Mensual | < [X]% |
| Churn de ingresos | % MRR perdido | MRR perdido / MRR inicio del mes | Mensual | < [X]% |
| CAC | Costo de adquisición por cliente | Gasto en ventas/marketing / Nuevos clientes | Mensual | < $[X] |
| LTV | Valor de vida del cliente | Precio × Meses promedio de retención | Trimestral | > $[X] |
| LTV/CAC | Ratio de rentabilidad | LTV / CAC | Trimestral | > 3x |
| NPS | Satisfacción del cliente | Promotores% - Detractores% | Mensual | > 40 |

---

## 3. Métricas de producto

| Métrica | Definición | Meta |
|---|---|---|
| DAU / MAU | Usuarios activos diarios / mensuales | [N] |
| Ratio DAU/MAU | Qué tan "pegajoso" es el producto | > [X]% |
| Activación | % de nuevos usuarios que completan onboarding | > [X]% |
| Feature adoption | % usuarios que usan [función clave] | > [X]% |
| Time to value | Tiempo hasta que el cliente obtiene su primer valor | < [X] días |
| Retención a 30 días | % que sigue usando después de 30 días | > [X]% |
| Retención a 90 días | % que sigue usando después de 90 días | > [X]% |

---

## 4. Métricas de ventas

| Métrica | Meta semanal |
|---|---|
| Prospectos contactados | [N] |
| Demos realizadas | [N] |
| Tasa demo → pago | > [X]% |
| Nuevos MRR por semana | $[X] |

---

## 5. Métricas técnicas

| Métrica | Herramienta | Meta |
|---|---|---|
| Uptime | [UptimeRobot / Sentry] | > 99% |
| Tiempo de respuesta P95 | [Logs / APM] | < 2 segundos |
| Errores 5xx por semana | [Sentry] | < [N] |
| Tiempo de deploy | [CI/CD logs] | < 5 minutos |
| Cobertura de tests | [Jest / Vitest] | > 70% |

---

## 6. Tablero de control semanal

Revisar cada semana:

```
SEMANA: [Número / Fechas]

💰 MRR: $[X] (vs semana pasada: [+/-]%)
👥 Clientes activos: [N] (nuevos: [+N], cancelados: [-N])
📈 Churn esta semana: [X]%

🏆 North Star metric: [Valor]

⚠️ Alertas:
- [Algo que necesita atención]

📋 Próximas acciones:
- [Acción 1]
- [Acción 2]
```

---

## 7. Historial de métricas

| Semana | MRR | Clientes | Churn | North Star | Notas |
|---|---|---|---|---|---|
| [Semana 1] | $[X] | [N] | [X]% | [Valor] | [Observación] |

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| [YYYY-MM-DD] | Documento inicial | [Nombre] |

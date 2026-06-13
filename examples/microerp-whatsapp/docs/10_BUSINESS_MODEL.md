# 10_BUSINESS_MODEL.md — Modelo de Negocio MicroERP WhatsApp

---

## 1. Propuesta de valor

**Para quién:** Micronegocios y emprendedores que venden por WhatsApp en Ecuador (1-5 personas)
**Problema:** Pierden pedidos, no controlan el stock, no saben sus ganancias reales
**Resultado:** Control total de pedidos, inventario y ventas desde el celular, en menos de 10 minutos de configuración
**Diferenciador:** Diseñado específicamente para negocios de WhatsApp en LATAM — no es un ERP genérico adaptado

---

## 2. Planes y precios

| Plan | Precio | Límites | Para quién |
|---|---|---|---|
| **Gratis** | $0/mes | 30 pedidos/mes, 10 productos, 1 usuario | Probar el sistema |
| **Básico** | $15/mes | Pedidos ilimitados, 100 productos, 1 usuario | Negocio pequeño activo |
| **Pro** | $25/mes | Todo ilimitado, múltiples usuarios (próximamente) | Negocio en crecimiento |

**Período de prueba:** 14 días del plan Básico sin tarjeta

**Justificación del precio $15/mes:**
- El cliente gasta 1-2 horas diarias organizando pedidos manualmente → valor de tiempo conservador: $30-60/mes
- El precio es 25-50% del valor que genera
- Menor que lo que cobra un Excel freelancer para organizar datos: $20-40/vez

---

## 3. Economía unitaria

| Métrica | Valor |
|---|---|
| Precio promedio ponderado | ~$18/mes (mix básico + pro) |
| Costo variable por cliente | ~$1.5/mes (Supabase proporcional + email) |
| Margen bruto por cliente | ~$16.5/mes (91%) |
| CAC objetivo (ventas directas) | < $30 |
| LTV objetivo (12 meses retención) | ~$216 |
| LTV/CAC objetivo | > 7x |
| Meses para recuperar CAC | < 2 meses |

---

## 4. Punto de equilibrio

| Clientes de pago | MRR | Estado |
|---|---|---|
| 5 | $90 | Validación inicial |
| 20 | $360 | Cubre infraestructura + tiempo básico |
| 50 | $900 | Sostenible para proyecto académico/side |
| 150 | $2.700 | Negocio principal viable |

---

## 5. Canales de adquisición

| Canal | Costo | Conversión estimada | Estado |
|---|---|---|---|
| Ventas directas por WhatsApp | Tiempo (bajo) | Alta — contacto personalizado | Activo |
| Grupos de emprendedores (Facebook/WhatsApp) | Tiempo | Media | Por activar |
| Referidos de clientes actuales | Descuento 1 mes | Alta | Por activar |
| Contenido en TikTok/Reels (tutoriales) | Tiempo | Baja → alto volumen | Fase 2 |
| Meta Ads | $$$  | Media | Fase 2 post-validación |

**Estrategia de lanzamiento:** 30 días de ventas directas → 5 clientes → activar referidos

---

## 6. Retención

**Señales de que el cliente está usando el producto:**
- Registra > 5 pedidos por semana
- Accede más de 3 veces por semana
- Tiene > 3 clientes registrados

**Señales de churn inminente:**
- Sin sesión en 7+ días
- Menos de 2 pedidos en la semana
- No completó el onboarding (< 5 productos registrados)

**Estrategia de retención:**
1. Onboarding guiado: mensaje de WhatsApp al día 1, 3 y 7
2. Reporte semanal automático por email (ventas de la semana)
3. Alerta de stock bajo (email/WhatsApp cuando producto < min_stock)
4. Check-in personal del fundador a los 14 días

---

## 7. Métricas clave

| Métrica | Meta actual | Meta 90 días |
|---|---|---|
| MRR | $0 | $300 |
| Clientes de pago | 0 | 20 |
| Churn mensual | — | < 10% |
| Trial → pago | — | > 30% |
| DAU/MAU | — | > 40% |

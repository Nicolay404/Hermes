# 00_PROJECT_BRIEF.md — MicroERP WhatsApp

**Versión:** 1.2 | **Fecha:** 2025-03-01 | **Estado:** Validado

---

## 1. El problema

Los negocios pequeños en Ecuador (tiendas de barrio, distribuidores, emprendedoras de comida, productores locales) venden principalmente por WhatsApp. Tienen decenas de conversaciones simultáneas y gestionan todo a mano: anotan pedidos en cuadernos, el inventario lo "calculan de memoria", y al final del mes no saben con certeza cuánto ganaron ni cuánto tienen disponible.

**Costo del problema:**
- Pedidos perdidos por falta de registro: estimado 3-8 por semana para negocios medianos
- Tiempo en organizar y consolidar pedidos: 1-2 horas diarias
- Errores de stock que generan productos vendidos sin existencia: pérdida de clientes
- Imposibilidad de crecer sin contratar a alguien solo para "llevar el cuaderno"

**Evidencia:**
- 8 entrevistas realizadas (enero 2025)
- 7 de 8 entrevistados confirmaron el problema de registro de pedidos
- 5 de 8 dijeron que habían "perdido" al menos un pedido importante en el último mes
- Solo 1 de 8 usa una herramienta digital (Excel) pero lo encuentra "difícil"

---

## 2. El cliente

- **Segmento principal:** Emprendedores y micronegocios que venden por WhatsApp, Ecuador, ciudades medianas y grandes (Loja, Cuenca, Quito, Guayaquil)
- **Tamaño:** 1-5 personas, ingresos entre $500-$5.000/mes
- **Perfil típico:** Mujer, 28-45 años, vende productos de consumo (comida, ropa, productos de belleza, agroquímicos)
- **Proceso actual:** WhatsApp + cuaderno/papel + Excel básico (sin fórmulas)
- **Disposición a pagar:** $15-25/mes confirmada en 3 de 8 entrevistados

---

## 3. La solución

Una aplicación web simple (que funciona bien en celular) donde el negocio registra sus pedidos, clientes y productos. El sistema lleva el inventario automáticamente, muestra qué se debe cobrar y entrega reportes simples de ventas.

**Propuesta de valor:**
> "MicroERP ayuda a negocios que venden por WhatsApp a no perder ningún pedido y saber exactamente cuánto están ganando, sin necesidad de aprender nada complicado."

---

## 4. Por qué ahora

- WhatsApp Business creciendo pero sin herramientas de gestión integradas
- Smartphones accesibles en Ecuador — el cliente objetivo ya tiene celular con datos
- Supabase, Vercel y herramientas modernas permiten construir esto en semanas, no meses

---

## 5. Alternativas existentes

| Alternativa | Cómo la usa el cliente | Por qué no es suficiente |
|---|---|---|
| Cuaderno/papel | Registro manual | Se pierde, no tiene búsqueda, no da reportes |
| Excel básico | Lista de pedidos | Lento, no actualiza stock, no funciona bien en celular |
| Sistemas ERP genéricos | No los usa | Demasiado complejos, demasiado caros, en inglés |
| Notion/Airtable | Algunos emprendedores | Muy genérico, requiere configuración avanzada |

---

## 6. MVP — Alcance mínimo

**Incluido:**
- Registro y gestión de pedidos (crear, editar, ver estado)
- Directorio de clientes
- Catálogo de productos con precio y stock
- Control básico de inventario (descuenta stock al confirmar pedido)
- Reporte de ventas del día/semana/mes
- Sistema de suscripción con MercadoPago

**Excluido del MVP:**
- Integración directa con WhatsApp (sin API de Meta)
- Facturación electrónica
- Múltiples usuarios por negocio
- App móvil nativa
- Exportación a Excel/PDF

---

## 7. Métrica principal

| Métrica | Meta de validación |
|---|---|
| Clientes de pago | 5 en primeros 60 días |
| Retención mes 2 | > 60% |
| Pedidos registrados por cliente/semana | > 5 (señal de uso real) |

---

## 8. Supuestos críticos

1. **El cliente pagaría $15/mes** por no perder pedidos y tener control de stock → Validado parcialmente (3 de 8 entrevistados)
2. **El cliente usaría el sistema desde el celular** sin necesidad de computadora → Por validar en piloto
3. **El registro de pedidos es suficiente para el primer pago** — no necesita el módulo de reportes para valorar el producto → Por validar

---

## 9. Visión a largo plazo

En 18 meses: integración con WhatsApp Business API para registrar pedidos directamente desde los chats. En 2 años: plataforma completa para negocios de $1k-$20k/mes con facturación, múltiples empleados y análisis de negocio.

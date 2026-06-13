# 04_DATABASE.md — Modelo de datos MicroERP WhatsApp

---

## Motor y configuración

| Campo | Valor |
|---|---|
| Motor | PostgreSQL 15 via Supabase |
| ORM | Sin ORM — consultas con Supabase JS Client |
| Multi-tenant | Row Level Security (RLS) por `organization_id` |
| Migraciones | Scripts SQL en `/supabase/migrations/` |

---

## Diagrama de relaciones

```
[organizations]
    │
    ├──── 1:N ──── [customers]
    │                  │
    ├──── 1:N ──── [products]
    │                  │
    └──── 1:N ──── [orders]
                       │ 1:N
                   [order_items]
                       │ N:1 ───── [products]
```

---

## Tablas

### organizations

Cada negocio registrado es una organización.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| name | VARCHAR(200) | NOT NULL | Nombre del negocio |
| owner_id | UUID | FK → auth.users | Dueño de la organización |
| phone | VARCHAR(20) | | WhatsApp del negocio |
| plan | VARCHAR(20) | default 'free' | 'free' / 'basic' / 'pro' |
| trial_ends_at | TIMESTAMP | | Fin del período de prueba |
| created_at | TIMESTAMP | default NOW() | |

### customers

Directorio de clientes de cada negocio.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations | A qué negocio pertenece |
| name | VARCHAR(200) | NOT NULL | Nombre del cliente |
| phone | VARCHAR(20) | | WhatsApp del cliente |
| notes | TEXT | | Notas adicionales |
| created_at | TIMESTAMP | default NOW() | |

### products

Catálogo de productos con precio y stock.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations | A qué negocio pertenece |
| name | VARCHAR(200) | NOT NULL | Nombre del producto |
| description | TEXT | | Descripción opcional |
| price | DECIMAL(10,2) | NOT NULL, CHECK > 0 | Precio de venta |
| cost | DECIMAL(10,2) | | Costo de compra (para margen) |
| stock | INTEGER | NOT NULL, default 0 | Stock actual |
| min_stock | INTEGER | default 0 | Stock mínimo (alerta) |
| active | BOOLEAN | default true | Producto activo o archivado |
| created_at | TIMESTAMP | default NOW() | |
| updated_at | TIMESTAMP | default NOW() | |

### orders

Pedidos registrados.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| organization_id | UUID | FK → organizations | |
| customer_id | UUID | FK → customers | Cliente del pedido |
| status | VARCHAR(30) | NOT NULL | 'pending' / 'confirmed' / 'delivered' / 'cancelled' |
| total | DECIMAL(10,2) | NOT NULL | Total calculado del pedido |
| notes | TEXT | | Notas del pedido |
| delivery_date | DATE | | Fecha de entrega prometida |
| created_at | TIMESTAMP | default NOW() | |
| updated_at | TIMESTAMP | default NOW() | |

### order_items

Ítems de cada pedido.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders | |
| product_id | UUID | FK → products | |
| quantity | INTEGER | NOT NULL, CHECK > 0 | Cantidad pedida |
| unit_price | DECIMAL(10,2) | NOT NULL | Precio al momento del pedido |
| subtotal | DECIMAL(10,2) | NOT NULL | quantity × unit_price |

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. La política base es:

```sql
-- Ejemplo para tabla orders
CREATE POLICY "Solo ve sus propios datos"
  ON orders
  FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );
```

---

## Lógica de negocio en DB

### Descuento de stock al confirmar pedido

Trigger que se ejecuta cuando `orders.status` cambia a 'confirmed':

```sql
CREATE OR REPLACE FUNCTION decrement_stock_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    UPDATE products p
    SET stock = stock - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_confirm();
```

---

## Índices

| Tabla | Columna(s) | Tipo | Razón |
|---|---|---|---|
| orders | organization_id, created_at | COMPOSITE | Listado de pedidos por negocio |
| orders | customer_id | INDEX | Historial de pedidos por cliente |
| products | organization_id, active | COMPOSITE | Listado de productos activos |
| customers | organization_id | INDEX | Listado de clientes por negocio |
| order_items | order_id | INDEX | Ítems de un pedido |

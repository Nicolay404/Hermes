# 04_DATABASE.md — Modelo de Datos

> Actualizar cada vez que se añadan, modifiquen o eliminen tablas, columnas o relaciones.

---

## 1. Motor de base de datos

| Campo | Valor |
|---|---|
| Motor | [PostgreSQL / MySQL / MongoDB / SQLite] |
| Versión | [15.x] |
| Hosting | [Supabase / Railway / RDS / local] |
| ORM / Query Builder | [Prisma / Drizzle / TypeORM / Sequelize / sin ORM] |

---

## 2. Diagrama entidad-relación (descripción)

```
[users] 1 ─── N [organizations_members]
[organizations] 1 ─── N [organizations_members]
[organizations] 1 ─── N [products]
[orders] N ─── 1 [customers]
[orders] 1 ─── N [order_items]
[order_items] N ─── 1 [products]
```

*Agregar diagrama visual en herramienta preferida (dbdiagram.io, DrawSQL, etc.)*

---

## 3. Tablas

### users

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | Identificador único |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email del usuario |
| password_hash | VARCHAR(255) | NOT NULL | Hash bcrypt de contraseña |
| name | VARCHAR(100) | NOT NULL | Nombre completo |
| role | VARCHAR(50) | NOT NULL, default 'user' | Rol del usuario |
| created_at | TIMESTAMP | default NOW() | Fecha de creación |
| updated_at | TIMESTAMP | default NOW() | Última actualización |
| deleted_at | TIMESTAMP | NULL | Soft delete |

### [tabla_2]

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | |
| [columna] | [tipo] | [restricción] | [descripción] |

---

## 4. Relaciones

| Tabla origen | Relación | Tabla destino | Descripción |
|---|---|---|---|
| users | N:M | organizations | Un usuario puede ser miembro de varias organizaciones |
| organizations | 1:N | products | Una organización tiene muchos productos |
| orders | N:1 | customers | Muchos pedidos pertenecen a un cliente |

---

## 5. Índices

| Tabla | Columnas indexadas | Tipo | Motivo |
|---|---|---|---|
| users | email | UNIQUE | Búsqueda frecuente por email en login |
| orders | customer_id, created_at | COMPOSITE | Listado de pedidos por cliente ordenado |
| products | organization_id | INDEX | Filtro por organización |

---

## 6. Estrategia de migraciones

**Herramienta:** [Prisma Migrate / Flyway / scripts SQL manuales]

**Reglas:**
- Nunca modificar una migración ya aplicada en producción
- Toda migración debe tener su `up` y su `down`
- Nombrar: `YYYYMMDD_descripcion_del_cambio.sql`
- Probar en entorno local antes de aplicar en producción

**Directorio de migraciones:** `[ruta/al/directorio]`

---

## 7. Estrategia de soft delete

Los registros no se eliminan físicamente. Se marca `deleted_at` con la fecha.

Tablas con soft delete habilitado:
- [ ] users
- [ ] [tabla X]

Tablas donde sí se eliminan físicamente:
- [ ] [tabla Y — ej: sesiones temporales]

---

## 8. Datos de referencia / seeds

| Tabla | Datos base necesarios |
|---|---|
| roles | ['admin', 'user', 'viewer'] |
| [tabla] | [qué datos se precargan] |

**Cómo ejecutar seeds:** `[comando]`

---

## 9. Consideraciones de seguridad

- Row Level Security (RLS): [activado / no aplica] en [tablas]
- Datos sensibles cifrados: [columnas con cifrado adicional]
- Columnas que nunca deben exponerse en API: [password_hash, etc.]

---

## Historial de cambios

| Fecha | Cambio | Migración | CR/ADR | Autor |
|---|---|---|---|---|
| [YYYY-MM-DD] | Documento inicial | — | — | [Nombre] |

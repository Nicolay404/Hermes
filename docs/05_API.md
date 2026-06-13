# 05_API.md — Diseño de API

> Documentar todos los endpoints públicos y privados. Actualizar ante cualquier cambio de contrato.

---

## 1. Especificación general

| Campo | Valor |
|---|---|
| Tipo | [REST / GraphQL / tRPC] |
| Base URL (desarrollo) | `http://localhost:3000/api/v1` |
| Base URL (producción) | `https://[dominio]/api/v1` |
| Formato de datos | JSON |
| Autenticación | [Bearer Token JWT / API Key / Cookie] |
| Versionado | `/api/v1/` — versión en URL |

---

## 2. Autenticación

### Headers requeridos en rutas privadas

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Obtener token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Respuesta exitosa (200):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "name": "Nombre",
    "role": "user"
  }
}
```

**Error (401):**
```json
{
  "error": "Credenciales inválidas"
}
```

---

## 3. Formato estándar de respuestas

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "total": 50
  }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El campo email es requerido",
    "details": [ ... ]
  }
}
```

### Códigos de estado usados

| Código | Significado |
|---|---|
| 200 | Éxito |
| 201 | Creado exitosamente |
| 400 | Error de validación o datos inválidos |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: email ya existe) |
| 500 | Error interno del servidor |

---

## 4. Endpoints

### Autenticación

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| POST | `/auth/forgot-password` | Solicitar reset | No |
| POST | `/auth/reset-password` | Confirmar reset con token | No |

---

### [Módulo A]

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/[recurso]` | Listar todos | Sí |
| GET | `/[recurso]/:id` | Obtener uno | Sí |
| POST | `/[recurso]` | Crear | Sí |
| PUT | `/[recurso]/:id` | Actualizar completo | Sí |
| PATCH | `/[recurso]/:id` | Actualizar parcial | Sí |
| DELETE | `/[recurso]/:id` | Eliminar (soft) | Sí |

#### GET /[recurso]

**Query params:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `search` (string, opcional)
- `sort` (string, ej: `created_at:desc`)

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "campo": "valor",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

#### POST /[recurso]

**Body:**
```json
{
  "campo_requerido": "valor",
  "campo_opcional": "valor"
}
```

**Validaciones:**
- `campo_requerido`: string, requerido, max 255 chars
- `campo_opcional`: string, opcional

---

## 5. Webhooks (si aplica)

| Evento | URL destino | Payload |
|---|---|---|
| [pago.completado] | `/webhooks/[proveedor]` | [Estructura del payload] |

---

## 6. Rate limiting

| Endpoint | Límite |
|---|---|
| `/auth/login` | 10 requests/minuto por IP |
| `/auth/forgot-password` | 5 requests/hora por IP |
| Endpoints generales | 100 requests/minuto por usuario |

---

## 7. Contrato de API (versionado)

**Regla:** Nunca hacer breaking changes en una versión existente. Si el contrato cambia de forma incompatible, crear `v2`.

---

## Historial de cambios

| Fecha | Cambio | CR asociado | Autor |
|---|---|---|---|
| [YYYY-MM-DD] | Documento inicial | — | [Nombre] |

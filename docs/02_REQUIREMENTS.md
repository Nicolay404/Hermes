# 02_REQUIREMENTS.md — Requisitos del Sistema

> Actualizar cuando cambie el alcance. Toda funcionalidad debe tener al menos un criterio de aceptación medible.

---

## Versión del documento

| Campo | Valor |
|---|---|
| Versión | 1.0 |
| Fecha | [YYYY-MM-DD] |
| Estado | [Borrador / Revisado / Aprobado] |

---

## 1. Alcance del MVP

### Incluido en el MVP

- [Funcionalidad 1]
- [Funcionalidad 2]
- [Funcionalidad 3]

### Fuera del MVP (backlog futuro)

- [Funcionalidad diferida 1] — razón: [por qué no ahora]
- [Funcionalidad diferida 2]

---

## 2. Usuarios del sistema

| Rol | Descripción | Permisos principales |
|---|---|---|
| [Administrador] | [Quién es] | [Qué puede hacer] |
| [Usuario regular] | [Quién es] | [Qué puede hacer] |
| [Visitante/público] | [Quién es] | [Qué puede hacer] |

---

## 3. Requisitos Funcionales

### Módulo: [Nombre del módulo 1]

| ID | Requisito | Criterio de aceptación | Prioridad |
|---|---|---|---|
| RF-001 | [El sistema debe permitir...] | [Dado X, cuando Y, entonces Z] | Alta |
| RF-002 | | | Media |
| RF-003 | | | Baja |

### Módulo: [Nombre del módulo 2]

| ID | Requisito | Criterio de aceptación | Prioridad |
|---|---|---|---|
| RF-010 | | | Alta |
| RF-011 | | | Media |

### Módulo: Autenticación y acceso

| ID | Requisito | Criterio de aceptación | Prioridad |
|---|---|---|---|
| RF-100 | El sistema debe permitir registro de usuario con email y contraseña | El usuario puede crear cuenta, recibir email de verificación y acceder | Alta |
| RF-101 | El sistema debe permitir login seguro | El login falla con credenciales incorrectas y bloquea tras 5 intentos | Alta |
| RF-102 | El sistema debe permitir recuperar contraseña | El usuario recibe email con enlace de recuperación válido por 1 hora | Alta |

---

## 4. Requisitos No Funcionales

| ID | Categoría | Requisito | Métrica |
|---|---|---|---|
| RNF-001 | Rendimiento | El sistema debe responder en menos de 2 segundos | P95 < 2s en condiciones normales |
| RNF-002 | Disponibilidad | El sistema debe estar disponible al menos 99% del tiempo | <7 horas de downtime/mes |
| RNF-003 | Seguridad | Las contraseñas deben estar hasheadas | bcrypt con salt de al menos 10 rounds |
| RNF-004 | Seguridad | Las rutas privadas deben requerir autenticación | Retorna 401 sin token válido |
| RNF-005 | Usabilidad | La interfaz debe funcionar en móvil | Diseño responsive, funcional en Chrome móvil |
| RNF-006 | Escalabilidad | El sistema debe soportar [N] usuarios concurrentes | Sin degradación de rendimiento |

---

## 5. Restricciones técnicas

- **Stack obligatorio:** [Si hay restricciones de tecnología]
- **Integraciones requeridas:** [APIs externas obligatorias]
- **Compatibilidad:** [Navegadores, dispositivos, versiones]
- **Presupuesto de infraestructura:** [$X/mes máximo]

---

## 6. Reglas de negocio

| ID | Regla |
|---|---|
| RN-001 | [Un usuario solo puede pertenecer a una organización] |
| RN-002 | [El precio no puede ser negativo] |
| RN-003 | [Un pedido cancelado no puede volver a activo] |

---

## 7. Flujos principales (descripción textual)

### Flujo 1: [Nombre]

```
1. El usuario [acción]
2. El sistema [respuesta]
3. El usuario [siguiente acción]
4. El sistema [resultado final]
```

### Flujo alternativo / error: [Nombre]

```
Si en el paso 2 el sistema detecta [condición de error]:
  - El sistema [acción de recuperación]
  - El usuario [qué ve]
```

---

## 8. Dependencias

| Dependencia | Tipo | Impacto si falla |
|---|---|---|
| [API de pagos externa] | Externa | No se pueden procesar pagos |
| [Servicio de email] | Externa | No llegan notificaciones |
| [Base de datos] | Interna | Sistema inoperable |

---

## Historial de cambios

| Fecha | Cambio | CR asociado | Autor |
|---|---|---|---|
| [YYYY-MM-DD] | Documento inicial | — | [Nombre] |

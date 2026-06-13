# Feature Spec: [Nombre de la funcionalidad]

## Metadata

| Campo | Valor |
|---|---|
| ID | FEAT-[XXX] |
| CR asociado | CR-[XXX] |
| Módulo | [Módulo del sistema] |
| Fecha | [YYYY-MM-DD] |
| Autor | [Nombre] |
| Estado | [Borrador / Revisado / Aprobado para implementar] |

---

## Descripción

[Una o dos oraciones que expliquen qué hace esta funcionalidad y para quién.]

---

## Problema que resuelve

[Qué dolor del usuario resuelve. Si no resuelve un dolor real, reconsiderar si vale la pena construirlo.]

---

## Usuarios que la usan

| Rol | Cómo la usa |
|---|---|
| [Administrador] | [Qué hace con esta feature] |
| [Usuario] | [Qué hace con esta feature] |

---

## Flujo de usuario

**Flujo principal:**
```
1. El usuario [acción]
2. El sistema [respuesta]
3. El usuario [acción]
4. El sistema [resultado final]
```

**Flujo alternativo / caso de error:**
```
Si en el paso X ocurre Y:
→ El sistema hace Z
→ El usuario ve / puede hacer W
```

---

## Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-001 | El sistema debe... | Alta |
| RF-002 | El sistema debe... | Media |

## Criterios de aceptación

| ID | Criterio |
|---|---|
| CA-001 | Dado [contexto], cuando [acción], entonces [resultado medible] |
| CA-002 | |

---

## Diseño de UI (descripción)

[Describir cómo se ve la interfaz. Si hay wireframe, adjuntar o enlazar.]

**Componentes necesarios:**
- [Componente 1]
- [Componente 2]

**Estados de la interfaz:**
- Loading: [Qué se muestra]
- Empty: [Qué se muestra]
- Error: [Qué se muestra]
- Éxito: [Qué se muestra]

---

## API necesaria

| Método | Endpoint | Descripción |
|---|---|---|
| [GET/POST/PUT/DELETE] | `/api/v1/[ruta]` | [Qué hace] |

---

## Modelo de datos (si aplica)

[Nuevas tablas o campos necesarios. Si no hay cambios de DB, indicar "Sin cambios en BD".]

---

## Dependencias

- [Módulo o feature que debe existir]
- [API externa si aplica]

---

## Fuera de alcance

[Qué comportamientos o variaciones NO están incluidos en esta spec. Ser explícito.]

---

## Tests a implementar

| Tipo | Caso |
|---|---|
| Unitario | [Función a testear] |
| Integración | [Flujo a testear] |
| E2E | [Flujo completo] |

---

## Notas de implementación

[Sugerencias técnicas, gotchas conocidos o decisiones que el developer debe tomar.]

# 06_UI_UX_FLOWS.md — Flujos de UI/UX

---

## 1. Principios de diseño

- **Simplicidad primero:** Si el usuario necesita instrucciones para hacer algo básico, es demasiado complicado
- **Mobile first:** Diseñar para móvil, escalar a desktop
- **Feedback inmediato:** Toda acción debe tener respuesta visual en menos de 300ms
- **Errores claros:** Los mensajes de error deben decir qué salió mal y qué hacer

---

## 2. Mapa de pantallas

```
/ (landing)
├── /login
├── /register
├── /forgot-password
└── /app (requiere auth)
    ├── /app/dashboard
    ├── /app/[modulo-1]
    │   ├── /app/[modulo-1]/nuevo
    │   └── /app/[modulo-1]/:id
    ├── /app/[modulo-2]
    └── /app/configuracion
        ├── /app/configuracion/perfil
        └── /app/configuracion/cuenta
```

---

## 3. Flujos principales

### Flujo: Registro y onboarding

```
1. Usuario llega a landing
2. Hace clic en "Registrarse"
3. Formulario: nombre, email, contraseña
4. Submit → validación frontend → envío al backend
5. Backend: validar, crear usuario, enviar email de verificación
6. Frontend: mostrar "Revisa tu email"
7. Usuario hace clic en link del email
8. Sistema verifica token → activa cuenta → redirige a /app/dashboard
9. Dashboard muestra onboarding (si es primera vez)
```

**Puntos de error y fallback:**
- Email ya registrado → mostrar mensaje con opción de login
- Token de verificación expirado → botón "reenviar email"

---

### Flujo: Login

```
1. Usuario va a /login
2. Ingresa email + contraseña
3. Submit → backend verifica → retorna JWT
4. Frontend guarda token → redirige a /app/dashboard
```

**Puntos de error:**
- Credenciales incorrectas: "Email o contraseña incorrectos" (no decir cuál)
- 5 intentos fallidos: bloquear 15 minutos

---

### Flujo: [Funcionalidad principal]

```
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]
4. [Resultado exitoso]
```

**Casos alternativos:**
- [Caso alternativo 1]
- [Error posible y cómo manejarlo]

---

## 4. Componentes reutilizables

| Componente | Descripción | Estados |
|---|---|---|
| Button | Botón primario/secundario/peligro | Default, hover, loading, disabled |
| Input | Campo de texto con label y error | Default, focus, error, disabled |
| Modal | Diálogo de confirmación | Open, closing, closed |
| Toast | Notificación temporal | Success, error, warning, info |
| Table | Tabla con paginación | Loading, empty, con datos |
| Card | Contenedor de información | Default, clickable, loading |

---

## 5. Estados de interfaz

Cada pantalla con datos debe manejar:
- **Loading:** spinner o skeleton mientras carga
- **Empty:** mensaje y acción cuando no hay datos
- **Error:** mensaje de error con opción de retry
- **Éxito:** confirmación visual de acción completada

---

## 6. Navegación y permisos

| Rol | Acceso |
|---|---|
| Admin | Todas las secciones |
| Usuario | Solo sus propios datos y secciones habilitadas |
| Viewer | Solo lectura |

---

## 7. Formularios — reglas

- Validación en tiempo real (no esperar submit)
- Deshabilitar botón Submit mientras hay errores de validación
- Mostrar loader en el botón durante la petición
- Deshabilitar el formulario durante la petición (evitar doble submit)
- Limpiar formulario después de éxito

---

## 8. Responsive design

| Breakpoint | Comportamiento |
|---|---|
| < 640px (móvil) | Layout de una columna, navegación en bottom bar o hamburger |
| 640-1024px (tablet) | Layout de dos columnas, sidebar colapsable |
| > 1024px (desktop) | Layout completo con sidebar visible |

---

## Historial de cambios

| Fecha | Cambio | CR asociado | Autor |
|---|---|---|---|
| [YYYY-MM-DD] | Documento inicial | — | [Nombre] |

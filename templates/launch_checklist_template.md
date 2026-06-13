# Checklist de Lanzamiento — [Nombre del proyecto / versión]

**Fecha de lanzamiento objetivo:** [YYYY-MM-DD]
**Responsable:** [Nombre]

---

## Pre-lanzamiento técnico

### Seguridad
- [ ] Variables de entorno en producción configuradas (no hardcodeadas)
- [ ] HTTPS activo en todos los dominios
- [ ] Autenticación probada (login, registro, logout, recuperar contraseña)
- [ ] Rutas privadas protegidas (retornan 401 sin token)
- [ ] Inputs validados en backend
- [ ] Rate limiting activo en endpoints sensibles
- [ ] Dependencias actualizadas (sin vulnerabilidades críticas conocidas)

### Base de datos
- [ ] Migraciones ejecutadas en producción
- [ ] Backup automático configurado
- [ ] Seed de datos necesarios ejecutado
- [ ] Índices críticos creados

### Infraestructura
- [ ] Servidor de producción funcionando
- [ ] CI/CD configurado y probado
- [ ] Dominio configurado y DNS propagado
- [ ] SSL/TLS activo y válido
- [ ] Monitoreo de errores activo (Sentry o similar)
- [ ] UptimeRobot o alertas de caída configuradas

### Calidad
- [ ] Tests unitarios pasan en CI
- [ ] QA manual de todos los flujos críticos completado
- [ ] Prueba en móvil completada (Chrome + Safari)
- [ ] Prueba de registro → uso → pago completada end-to-end
- [ ] Sin console.log con información sensible
- [ ] Sin errores en consola del navegador en flujos críticos

---

## Pre-lanzamiento de producto

### Funcionalidades críticas probadas
- [ ] [Flujo 1 — Registro]
- [ ] [Flujo 2 — Core del producto]
- [ ] [Flujo 3 — Pago si aplica]
- [ ] [Flujo 4 — Soporte / contacto]

### Contenido
- [ ] Landing page lista y revisada
- [ ] Textos de la app revisados (sin errores, sin placeholder)
- [ ] Emails transaccionales probados (bienvenida, verificación, recuperar contraseña)
- [ ] FAQ básico preparado

---

## Pre-lanzamiento de negocio

### Ventas
- [ ] Precio definido y configurado en sistema de pagos
- [ ] Flujo de pago probado con tarjeta real
- [ ] Lista de primeros clientes potenciales lista
- [ ] Mensaje de WhatsApp para primer contacto preparado
- [ ] Demo / video de 2 minutos listo

### Operación
- [ ] Canal de soporte definido (WhatsApp / email)
- [ ] Proceso de onboarding definido
- [ ] Documento de operación actualizado (`docs/12_OPERATIONS.md`)

### Métricas
- [ ] Analytics configurado (Google Analytics / Plausible / Posthog)
- [ ] Métricas de `docs/13_METRICS.md` configuradas para seguimiento
- [ ] Dashboard de control semanal preparado

---

## Día de lanzamiento

- [ ] Deploy a producción ejecutado
- [ ] Verificación post-deploy (flujos críticos funcionando)
- [ ] Primer mensaje enviado a lista de potenciales clientes
- [ ] Post en redes sociales si aplica
- [ ] Monitoreo activo las primeras 2 horas post-lanzamiento

---

## Post-lanzamiento (primera semana)

- [ ] Seguimiento a primeros usuarios registrados
- [ ] Revisión de errores en Sentry
- [ ] Recolección de feedback inicial
- [ ] Actualizar `PROJECT_CONTEXT.md` con estado "En producción"
- [ ] Primer retrospectiva en `docs/16_RETROSPECTIVES.md`

---

**Estado:** [ ] Pendiente → [ ] En progreso → [ ] Lanzado ✅

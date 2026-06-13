# 12_OPERATIONS.md — Operaciones

---

## 1. Cómo se entrega el servicio

**Proceso de onboarding de un nuevo cliente:**

```
1. Cliente paga (Stripe / MercadoPago / transferencia)
2. Sistema crea cuenta automáticamente (o manual en MVP)
3. Cliente recibe email de bienvenida con credenciales
4. [Opcional] Llamada de onboarding de 30 min
5. Cliente configura su cuenta (datos básicos, primeros registros)
6. A los 3 días: mensaje de seguimiento por WhatsApp
7. A los 7 días: verificar que está usando el producto
8. A los 30 días: encuesta de satisfacción
```

---

## 2. Soporte al cliente

| Canal | Horario | Tiempo de respuesta objetivo |
|---|---|---|
| WhatsApp | Lunes a viernes, 9am-6pm | < 2 horas |
| Email | Cualquier hora | < 24 horas |
| [Otros] | | |

**Política de soporte en MVP:**
- Soporte 100% manual al inicio
- Documentar las consultas más frecuentes → crear FAQ
- Cuando una misma pregunta llega 3 veces → automatizar respuesta

---

## 3. Tareas operativas recurrentes

### Diarias
- [ ] Revisar mensajes de soporte
- [ ] Revisar alertas de errores (Sentry / logs)
- [ ] Revisar pagos pendientes o fallidos

### Semanales
- [ ] Revisar métricas en `docs/13_METRICS.md`
- [ ] Revisar clientes en riesgo de churn (sin actividad en 7+ días)
- [ ] Contactar clientes recientes para check-in
- [ ] Revisar backlog y priorizar

### Mensuales
- [ ] Revisar MRR y comparar con mes anterior
- [ ] Revisión de costos de infraestructura
- [ ] Encuesta de NPS o satisfacción
- [ ] Actualizar `docs/16_RETROSPECTIVES.md`

---

## 4. Automatizaciones implementadas

| Automatización | Herramienta | Trigger | Estado |
|---|---|---|---|
| Email de bienvenida | [SendGrid / Resend] | Nuevo registro | [Implementado / Pendiente] |
| Recordatorio de prueba gratis | [Email / WhatsApp] | A 2 días de expirar trial | [Pendiente] |
| Alerta de error crítico | [Sentry → Email] | Error 500 en producción | [Pendiente] |

---

## 5. Accesos y credenciales

> **NUNCA** guardar credenciales reales en este documento. Solo documentar dónde están guardadas.

| Sistema | Quién tiene acceso | Dónde están las credenciales |
|---|---|---|
| Servidor de producción | [Nombre/Rol] | [Gestor de contraseñas / Vault] |
| Base de datos producción | [Nombre/Rol] | [Gestor de contraseñas] |
| Panel de pagos | [Nombre/Rol] | [Gestor de contraseñas] |
| Panel de email | [Nombre/Rol] | [Gestor de contraseñas] |

---

## 6. Plan de continuidad / contingencia

| Escenario | Probabilidad | Acción |
|---|---|---|
| Caída del servidor | Media | Reiniciar instancia → si persiste, contactar soporte del hosting |
| Falla de base de datos | Baja | Restaurar desde último backup → notificar a clientes afectados |
| Falla de servicio de pagos | Media | Aceptar pagos por transferencia mientras se resuelve |
| Brecha de seguridad | Muy baja | Deshabilitar accesos → notificar clientes → investigar → parchear |

---

## 7. Proceso de deploy

**Ambientes:**
- `main` → producción (deploy automático vía CI/CD)
- `develop` → staging (deploy en cada PR mergeado)

**Proceso:**
```
1. Feature en rama separada (feat/nombre)
2. PR a develop → revisión de código → QA en staging
3. PR de develop a main → deploy a producción
4. Verificar en producción que funciona correctamente
5. Monitorear errores 30 minutos post-deploy
```

**Rollback:**
```
Si hay problema crítico en producción:
→ Revertir último commit en main
→ Deploy automático del estado anterior
→ Investigar en staging
```

---

## 8. Comunicación interna

| Tipo | Canal | Frecuencia |
|---|---|---|
| Estado del proyecto | [Slack / WhatsApp / Notion] | Semanal |
| Bugs críticos | [Slack / Email] | Inmediato |
| Decisiones técnicas | `docs/08_DECISIONS.md` | Por evento |
| Retrospectivas | `docs/16_RETROSPECTIVES.md` | Mensual |

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| [YYYY-MM-DD] | Documento inicial | [Nombre] |

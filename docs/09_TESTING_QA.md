# 09_TESTING_QA.md — Estrategia de Testing y QA

---

## 1. Estrategia general

**Pirámide de tests:**
```
        [E2E — pocos, críticos]
      [Integración — módulos principales]
    [Unitarios — lógica de negocio y utils]
```

**Filosofía:**
- Testear comportamiento, no implementación
- Un test que no puede fallar no sirve
- Priorizar tests de las rutas críticas (login, pago, core del negocio)
- No perseguir 100% de cobertura — perseguir cobertura de riesgos

---

## 2. Herramientas de testing

| Tipo | Herramienta | Propósito |
|---|---|---|
| Unit / Integration | [Jest / Vitest / Pytest] | Tests de lógica de negocio |
| E2E | [Playwright / Cypress] | Flujos completos de usuario |
| API testing | [Supertest / Thunder Client / Postman] | Tests de endpoints |
| Linting | [ESLint / Pylint] | Calidad de código |
| Formato | [Prettier / Black] | Estilo consistente |

---

## 3. Cobertura mínima requerida

| Área | Cobertura mínima |
|---|---|
| Lógica de negocio (services) | 80% |
| Controladores / endpoints | 70% |
| Utilidades compartidas | 90% |
| UI components | No requerida en MVP |

---

## 4. Casos de prueba por módulo

### Módulo: Autenticación

| ID | Caso | Tipo | Estado |
|---|---|---|---|
| TC-001 | Registro exitoso con email válido | Integración | [ ] |
| TC-002 | Registro falla con email duplicado | Integración | [ ] |
| TC-003 | Login exitoso retorna JWT | Integración | [ ] |
| TC-004 | Login falla con contraseña incorrecta | Integración | [ ] |
| TC-005 | Ruta privada retorna 401 sin token | Integración | [ ] |
| TC-006 | Recuperación de contraseña envía email | Integración | [ ] |

### Módulo: [Módulo principal]

| ID | Caso | Tipo | Estado |
|---|---|---|---|
| TC-010 | [Caso de éxito] | [Tipo] | [ ] |
| TC-011 | [Caso de error] | [Tipo] | [ ] |
| TC-012 | [Caso borde] | [Tipo] | [ ] |

---

## 5. Checklist de QA por PR / release

### Funcional
- [ ] Todos los criterios de aceptación del CR están cumplidos
- [ ] Los flujos principales funcionan end-to-end
- [ ] Los casos de error están manejados correctamente
- [ ] No hay regresiones en funcionalidades existentes

### Seguridad
- [ ] Las rutas privadas requieren auth
- [ ] Los inputs están validados y sanitizados
- [ ] No hay datos sensibles expuestos en respuestas de API
- [ ] No hay console.log con información sensible
- [ ] Variables de entorno no están hardcodeadas

### Rendimiento
- [ ] Endpoints responden en menos de 2 segundos (bajo carga normal)
- [ ] No hay N+1 queries obvios
- [ ] Las imágenes están optimizadas

### Código
- [ ] Linter pasa sin errores
- [ ] Tests unitarios pasan
- [ ] Sin código comentado innecesario
- [ ] Sin console.log de debugging

### Documentación
- [ ] Documentación actualizada si cambia funcionalidad
- [ ] ADR creado si hubo decisión técnica relevante
- [ ] CR actualizado con estado "Completado"

---

## 6. Proceso de reporte de bugs

Usar `templates/bug_report_template.md` para reportar bugs.

**Prioridades:**
- **Crítico:** Sistema inoperable, pérdida de datos, falla de seguridad → fix inmediato
- **Alto:** Flujo principal roto → fix en sprint actual
- **Medio:** Funcionalidad secundaria afectada → agregar al backlog prioritario
- **Bajo:** Mejora visual o de UX → backlog normal

---

## 7. Entornos

| Entorno | Propósito | URL | Datos |
|---|---|---|---|
| Local | Desarrollo individual | localhost | Seed de datos de prueba |
| Staging | QA antes de producción | [URL staging] | Copia anonimizada de producción |
| Producción | Usuarios reales | [URL prod] | Datos reales |

**Regla:** Nunca probar en producción. Nunca usar datos reales en local.

---

## Historial de cambios

| Fecha | Cambio | Autor |
|---|---|---|
| [YYYY-MM-DD] | Documento inicial | [Nombre] |

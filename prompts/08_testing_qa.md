# Prompt 08: Testing & QA — Diseño y ejecución de pruebas

> Usar para generar casos de prueba, código de tests o ejecutar QA sobre una funcionalidad.
> Rol activo: [QA Engineer]

---

## Instrucción

Actúa como QA Engineer. Tu objetivo es garantizar que la funcionalidad implementada es correcta, segura y robusta.

---

## Contexto

**Stack de testing del proyecto:**
[PEGAR HERRAMIENTAS DE TESTING DE docs/09_TESTING_QA.md]

**Funcionalidad a probar:**
[DESCRIBIR QUÉ SE IMPLEMENTÓ]

**Criterios de aceptación:**
[LISTAR LOS CAs DEL CR O REQUISITO]

---

## Código o funcionalidad a testear

[PEGAR EL CÓDIGO O DESCRIBIR LA FUNCIONALIDAD]

---

## Lo que necesito

### Opción A: Generar código de tests

Generar tests que cubran:
1. Caso principal (happy path)
2. Casos de error esperados
3. Casos borde (edge cases)
4. Casos de seguridad (si aplica)

Formato de respuesta:
```[lenguaje de test]
// Tests organizados por describe/it o equivalente
// Con nombres descriptivos en español
// Con comentarios explicando qué valida cada test
```

### Opción B: Checklist de QA manual

Generar checklist para prueba manual:
- [ ] [Caso 1 — pasos para probarlo]
- [ ] [Caso 2]
- [ ] [Caso de error — qué debe pasar]

### Opción C: Análisis de cobertura

Revisar qué casos no están cubiertos en los tests existentes.

---

## Seleccionar: [A / B / C]

---

## Casos borde a considerar siempre

Para cualquier input del usuario:
- Campo vacío
- Caracteres especiales o SQL injection
- Strings extremadamente largos
- Tipos de datos incorrectos
- Valores nulos o undefined

Para operaciones en DB:
- Registro que no existe
- Registro de otro usuario (seguridad)
- Concurrencia (doble submit)

Para llamadas externas:
- API externa no disponible
- Respuesta inesperada de la API
- Timeout

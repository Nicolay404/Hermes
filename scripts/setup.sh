#!/bin/bash

# setup.sh — Inicializar un nuevo proyecto basado en ai-project-operating-system
# Uso: bash setup.sh nombre-del-proyecto

set -e

PROJECT_NAME=${1:-"nuevo-proyecto"}
TEMPLATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET_DIR="$(pwd)/$PROJECT_NAME"

echo "================================================"
echo " AI Project Operating System — Setup"
echo "================================================"
echo ""
echo "Proyecto: $PROJECT_NAME"
echo "Destino:  $TARGET_DIR"
echo ""

# Verificar que no exista el directorio
if [ -d "$TARGET_DIR" ]; then
  echo "❌ Error: El directorio '$PROJECT_NAME' ya existe."
  exit 1
fi

# Copiar la estructura base
echo "📁 Copiando estructura base..."
cp -r "$TEMPLATE_DIR" "$TARGET_DIR"

# Limpiar el contenido del ejemplo si existe
if [ -d "$TARGET_DIR/examples" ]; then
  echo "🧹 Limpiando directorio de ejemplos..."
  rm -rf "$TARGET_DIR/examples/microerp-whatsapp"
  rm -rf "$TARGET_DIR/examples/marketplace-arriendos"
  rm -rf "$TARGET_DIR/examples/saas-contadores"
fi

# Limpiar tasks
echo "📋 Reiniciando tasks..."
cat > "$TARGET_DIR/tasks/backlog.md" << 'EOF'
# Backlog

| ID | Etiqueta | Descripción | Prioridad | Notas |
|---|---|---|---|---|
| B-001 | [feat] | Setup inicial del proyecto | Alta | |
EOF

cat > "$TARGET_DIR/tasks/active_sprint.md" << 'EOF'
# Sprint Activo

**Sprint:** 1
**Período:** [FECHA INICIO] → [FECHA FIN]
**Objetivo:** Setup inicial y primeras tareas de descubrimiento

## Tareas

| ID | Tarea | Prioridad | Estado | Responsable |
|---|---|---|---|---|
| T-001 | Completar docs/00_PROJECT_BRIEF.md | Alta | ⏳ Pendiente | [Nombre] |
| T-002 | Completar docs/01_PROBLEM_AND_MARKET.md | Alta | ⏳ Pendiente | [Nombre] |
| T-003 | Diseñar primer experimento de validación | Alta | ⏳ Pendiente | [Nombre] |
EOF

cat > "$TARGET_DIR/tasks/done.md" << 'EOF'
# Tareas Completadas

### [FECHA] — Sprint 1

| ID | Tarea | CR asociado | Notas |
|---|---|---|---|
| T-000 | Setup inicial del proyecto con ai-project-operating-system | — | Estructura base creada |
EOF

# Personalizar PROJECT_CONTEXT.md con el nombre del proyecto
echo "✏️  Personalizando PROJECT_CONTEXT.md..."
sed -i "s/\[NOMBRE_DEL_PROYECTO\]/$PROJECT_NAME/g" "$TARGET_DIR/PROJECT_CONTEXT.md"
sed -i "s/\[YYYY-MM-DD\]/$(date +%Y-%m-%d)/g" "$TARGET_DIR/PROJECT_CONTEXT.md"

# Dar permisos a los scripts
chmod +x "$TARGET_DIR/scripts/"*.sh

echo ""
echo "✅ Proyecto '$PROJECT_NAME' creado exitosamente."
echo ""
echo "Próximos pasos:"
echo "  1. cd $PROJECT_NAME"
echo "  2. Editar PROJECT_CONTEXT.md con la información de tu proyecto"
echo "  3. Completar docs/00_PROJECT_BRIEF.md con el brief del proyecto"
echo "  4. Usar prompts/01_project_discovery.md con tu IA para empezar"
echo "  5. Revisar CLAUDE.md (o el adaptador de tu IA preferida)"
echo ""
echo "================================================"

#!/bin/bash

# check.sh — Verificar que el proyecto tiene la documentación mínima requerida
# Uso: bash scripts/check.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0
WARNINGS=0

echo "================================================"
echo " AI Project Operating System — Check"
echo "================================================"
echo ""

check_file() {
  local file="$ROOT_DIR/$1"
  local description="$2"
  local required="${3:-true}"

  if [ -f "$file" ]; then
    # Verificar que no esté vacío y no sea solo el template
    local size=$(wc -c < "$file")
    if [ "$size" -lt 100 ]; then
      echo "⚠️  VACÍO:   $1 — $description"
      WARNINGS=$((WARNINGS + 1))
    else
      echo "✅ OK:      $1"
    fi
  else
    if [ "$required" = "true" ]; then
      echo "❌ FALTA:   $1 — $description"
      ERRORS=$((ERRORS + 1))
    else
      echo "ℹ️  OPCIONAL: $1 — $description (no existe todavía)"
    fi
  fi
}

check_content() {
  local file="$ROOT_DIR/$1"
  local pattern="$2"
  local description="$3"

  if [ -f "$file" ]; then
    if grep -q "\[NOMBRE_DEL_PROYECTO\]\|\[DESCRIBIR\]\|\[YYYY-MM-DD\]\|\[Stack\]" "$file" 2>/dev/null; then
      echo "⚠️  TEMPLATE: $1 — Aún tiene placeholders sin rellenar"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
}

echo "📁 Archivos raíz"
echo "---"
check_file "README.md" "Descripción del proyecto"
check_file "PROJECT_CONTEXT.md" "Estado actual del proyecto"
check_file "CLAUDE.md" "Adaptador para Claude"
check_file "AGENTS.md" "Adaptador genérico"
echo ""

echo "📄 Documentación core"
echo "---"
check_file "docs/00_PROJECT_BRIEF.md" "Brief del proyecto" "true"
check_file "docs/01_PROBLEM_AND_MARKET.md" "Problema y mercado" "true"
check_file "docs/02_REQUIREMENTS.md" "Requisitos" "true"
check_file "docs/03_ARCHITECTURE.md" "Arquitectura" "true"
check_file "docs/04_DATABASE.md" "Base de datos" "false"
check_file "docs/05_API.md" "API" "false"
check_file "docs/07_CHANGE_REQUESTS.md" "Change requests" "true"
check_file "docs/08_DECISIONS.md" "Decisiones (ADRs)" "true"
check_file "docs/09_TESTING_QA.md" "Testing y QA" "false"
check_file "docs/10_BUSINESS_MODEL.md" "Modelo de negocio" "false"
check_file "docs/14_RISKS.md" "Riesgos" "true"
echo ""

echo "📋 Gestión de tareas"
echo "---"
check_file "tasks/backlog.md" "Backlog"
check_file "tasks/active_sprint.md" "Sprint activo"
echo ""

echo "⚠️  Verificando placeholders no rellenados"
echo "---"
check_content "PROJECT_CONTEXT.md"
check_content "docs/00_PROJECT_BRIEF.md"
check_content "docs/03_ARCHITECTURE.md"
echo ""

echo "================================================"
if [ $ERRORS -gt 0 ]; then
  echo "❌ $ERRORS error(es) encontrado(s) — documentación obligatoria faltante"
  echo "⚠️  $WARNINGS advertencia(s)"
  echo ""
  echo "El proyecto no está listo para que una IA trabaje en él."
  echo "Completa los archivos faltantes primero."
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "✅ Sin errores críticos"
  echo "⚠️  $WARNINGS advertencia(s) — revisar archivos marcados"
  echo ""
  echo "El proyecto puede funcionar pero tiene documentación incompleta."
  exit 0
else
  echo "✅ Todo OK — el proyecto tiene la documentación mínima requerida"
  exit 0
fi

#!/bin/bash

# test.sh — Ejecutar tests del proyecto
# Adaptar según el stack del proyecto

set -e

echo "================================================"
echo " Ejecutando tests"
echo "================================================"
echo ""

# Detectar tipo de proyecto y ejecutar el comando correcto
if [ -f "package.json" ]; then
  echo "📦 Proyecto Node.js detectado"

  if grep -q '"vitest"' package.json 2>/dev/null; then
    echo "🧪 Ejecutando Vitest..."
    npx vitest run
  elif grep -q '"jest"' package.json 2>/dev/null; then
    echo "🧪 Ejecutando Jest..."
    npx jest --passWithNoTests
  else
    echo "⚠️  No se encontró configuración de tests (Jest/Vitest)"
    echo "   Instalar con: npm install -D vitest"
    exit 1
  fi

elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  echo "🐍 Proyecto Python detectado"

  if command -v pytest &>/dev/null; then
    echo "🧪 Ejecutando pytest..."
    pytest -v
  else
    echo "⚠️  pytest no encontrado"
    echo "   Instalar con: pip install pytest"
    exit 1
  fi

elif [ -f "Cargo.toml" ]; then
  echo "🦀 Proyecto Rust detectado"
  cargo test

elif [ -f "go.mod" ]; then
  echo "🐹 Proyecto Go detectado"
  go test ./...

else
  echo "⚠️  No se pudo detectar el tipo de proyecto automáticamente"
  echo "   Edita este script para agregar el comando de tests de tu proyecto"
  exit 1
fi

echo ""
echo "✅ Tests completados"

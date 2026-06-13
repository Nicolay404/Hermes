#!/bin/bash

# lint.sh — Ejecutar linter y verificador de formato
# Adaptar según el stack del proyecto

set -e

echo "================================================"
echo " Linting y formato de código"
echo "================================================"
echo ""

EXIT_CODE=0

# Node.js — ESLint + Prettier
if [ -f "package.json" ]; then
  echo "📦 Proyecto Node.js detectado"

  if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
    echo "🔍 Ejecutando ESLint..."
    if npx eslint . --ext .js,.ts,.jsx,.tsx --max-warnings 0; then
      echo "✅ ESLint: sin problemas"
    else
      echo "❌ ESLint: errores encontrados"
      EXIT_CODE=1
    fi
  else
    echo "ℹ️  ESLint no configurado (opcional pero recomendado)"
  fi

  if [ -f ".prettierrc" ] || [ -f "prettier.config.js" ]; then
    echo ""
    echo "🎨 Verificando formato con Prettier..."
    if npx prettier --check .; then
      echo "✅ Prettier: formato correcto"
    else
      echo "❌ Prettier: hay archivos con formato incorrecto"
      echo "   Ejecuta: npx prettier --write . para corregirlos"
      EXIT_CODE=1
    fi
  fi

fi

# Python — Flake8 + Black
if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
  echo "🐍 Proyecto Python detectado"

  if command -v flake8 &>/dev/null; then
    echo "🔍 Ejecutando flake8..."
    if flake8 .; then
      echo "✅ Flake8: sin problemas"
    else
      EXIT_CODE=1
    fi
  fi

  if command -v black &>/dev/null; then
    echo "🎨 Verificando formato con Black..."
    if black --check .; then
      echo "✅ Black: formato correcto"
    else
      echo "❌ Black: hay archivos con formato incorrecto"
      echo "   Ejecuta: black . para corregirlos"
      EXIT_CODE=1
    fi
  fi

fi

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Lint completado sin errores"
else
  echo "❌ Lint encontró problemas — corregir antes de hacer commit"
fi

exit $EXIT_CODE

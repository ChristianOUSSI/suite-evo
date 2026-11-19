#!/usr/bin/env bash
# Arrête tous les serveurs de la suite evo (uvicorn + next).
pkill -f "uvicorn app.main:app" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null
pkill -f "next start" 2>/dev/null
echo "Suite arrêtée."

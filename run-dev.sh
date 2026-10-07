#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "🚀 Iniciando App-Recibos Frontend (Porta 3000)..."
cd "$DIR/interface"
exec npm run dev

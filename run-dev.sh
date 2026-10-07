#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PATH="$HOME/.dotnet:$PATH"

echo "=========================================================="
echo "🚀 Iniciando App-Recibos (Ambiente Integrado C# + React)"
echo "=========================================================="

cleanup() {
    echo ""
    echo "🛑 Encerrando serviços..."
    if [ -n "$API_PID" ] && kill -0 "$API_PID" 2>/dev/null; then
        kill "$API_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup INT TERM EXIT

if [ "$1" != "--frontend-only" ]; then
    echo "⚙️ Iniciando Backend C# .NET 9 (Porta 5000)..."
    (cd "$DIR/core/src/AppRecibos.Api" && dotnet run --no-launch-profile) &
    API_PID=$!
    sleep 2
fi

echo "🌐 Iniciando Frontend React/Vite (Porta 3000)..."
(cd "$DIR/interface" && npm run dev)

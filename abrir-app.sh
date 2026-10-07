#!/usr/bin/env bash
# ==============================================================================
# App-Recibos - Launcher do Aplicativo Desktop (.NET 9 + Photino + React)
# ==============================================================================

set -e

# Diretório base do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$PROJECT_DIR"

# Configura o ambiente .NET (auto-detecta ~/.dotnet ou caminhos padrão)
if [ -z "$DOTNET_ROOT" ]; then
    if [ -d "$HOME/.dotnet" ]; then
        export DOTNET_ROOT="$HOME/.dotnet"
    elif [ -d "/usr/share/dotnet" ]; then
        export DOTNET_ROOT="/usr/share/dotnet"
    fi
fi
if [ -n "$DOTNET_ROOT" ]; then
    export PATH="$DOTNET_ROOT:$PATH"
fi

# Verifica se o binário compilado existe; caso não, compila automaticamente
if [ ! -f "publish/AppRecibos.Desktop" ]; then
    echo "[App-Recibos] Publicação inicial não encontrada. Compilando..."
    dotnet publish core/src/AppRecibos.Desktop/AppRecibos.Desktop.csproj -c Release -o publish/
    mkdir -p publish/wwwroot publish/interface/dist
    if [ -d "interface/dist" ]; then
        cp -r interface/dist/* publish/wwwroot/
        cp -r interface/dist/* publish/interface/dist/
    fi
fi

# Se foi solicitado modo apenas navegador via argumento
if [ "$1" == "--browser" ]; then
    echo "[App-Recibos] Iniciando em modo Navegador Web..."
    # Inicia o backend em background se não estiver rodando
    if ! curl -s http://127.0.0.1:5000/api/health >/dev/null 2>&1; then
        ./publish/AppRecibos.Desktop --api-only &
        API_PID=$!
        sleep 1
    fi
    xdg-open "http://127.0.0.1:5000" 2>/dev/null || sensible-browser "http://127.0.0.1:5000" 2>/dev/null
    wait $API_PID 2>/dev/null || true
    exit 0
fi

# Executa o aplicativo desktop nativo
echo "[App-Recibos] Iniciando aplicativo Desktop..."
exec ./publish/AppRecibos.Desktop "$@"

#!/usr/bin/env bash
# ==============================================================================
# App-Recibos Nativo - Launcher Avalonia UI (.NET 9 + SkiaSharp GPU)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$SCRIPT_DIR"

# Configura o ambiente .NET 9
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

PROJECT_CSPROJ="AppRecibos.Native/AppRecibos.Native.csproj"
PUBLISH_DIR="publish"

rebuild_app() {
    echo "[App-Recibos Nativo] Compilando e publicando aplicativo 100% nativo (.NET 9 + Avalonia UI)..."
    dotnet publish "$PROJECT_CSPROJ" -c Release -o "$PUBLISH_DIR/"
    echo "[App-Recibos Nativo] Publicação concluída com sucesso em $PUBLISH_DIR/."
}

# Se solicitado apenas atualizar/recompilar
if [ "$1" == "--build" ] || [ "$1" == "--update" ] || [ "$1" == "--rebuild" ]; then
    rebuild_app
    exit 0
fi

# Se não estiver compilado ou se os arquivos fonte forem mais novos, compila automaticamente
NEEDS_BUILD=false
if [ ! -f "$PUBLISH_DIR/AppRecibos.Native" ]; then
    NEEDS_BUILD=true
elif [ -n "$(find AppRecibos.Native -type f -newer "$PUBLISH_DIR/AppRecibos.Native" 2>/dev/null)" ]; then
    NEEDS_BUILD=true
fi

if [ "$NEEDS_BUILD" = true ]; then
    rebuild_app
fi

# Encerra qualquer processo anterior travado
if pgrep -f "AppRecibos.Native" >/dev/null 2>&1; then
    pkill -9 -f "AppRecibos.Native" 2>/dev/null || true
fi

echo "[App-Recibos Nativo] Iniciando aplicativo nativo (renderização direta GPU SkiaSharp)..."
exec "$PUBLISH_DIR/AppRecibos.Native" "$@"

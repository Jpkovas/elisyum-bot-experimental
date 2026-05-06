#!/bin/bash
# Script de setup/deploy do Elisyum Bot

set -e  # Para na primeira erro

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BIN_DIR="${PROJECT_ROOT}/bin"

cd "${PROJECT_ROOT}"
mkdir -p "${BIN_DIR}"

if [ "${OS}" = "Windows_NT" ]; then
    YTDLP_FILENAME="yt-dlp.exe"
else
    YTDLP_FILENAME="yt-dlp"
fi
LOCAL_YTDLP="${BIN_DIR}/${YTDLP_FILENAME}"
YTDLP_VERSION="${YTDLP_VERSION:-2025.12.08}"
YTDLP_LINUX_SHA256="aed043cabf6b352dfd5438afff595e31532538d5af7c8f4f95ced1e6f1b35c2a"
YTDLP_WINDOWS_SHA256="86c3280caa696b567c917ac138bbe0d17e45dc2b329f67562302ee4c3973a06f"
if [ "${OS}" = "Windows_NT" ]; then
    YTDLP_SHA256="${YTDLP_SHA256:-${YTDLP_WINDOWS_SHA256}}"
else
    YTDLP_SHA256="${YTDLP_SHA256:-${YTDLP_LINUX_SHA256}}"
fi
YTDLP_DOWNLOAD_URL="https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/${YTDLP_FILENAME}"

echo "🚀 Elisyum Bot - Setup/Deploy Script"
echo "======================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

calculate_sha256() {
    if command_exists shasum; then
        shasum -a 256 "$1" | awk '{print $1}'
    elif command_exists sha256sum; then
        sha256sum "$1" | awk '{print $1}'
    else
        echo -e "${RED}✗${NC} Instale shasum ou sha256sum para verificar o yt-dlp."
        return 1
    fi
}

verify_ytdlp_hash() {
    if [ -z "${YTDLP_SHA256}" ]; then
        echo -e "${RED}✗${NC} Defina YTDLP_SHA256 para instalar yt-dlp nesta plataforma."
        return 1
    fi

    local actual_hash
    actual_hash="$(calculate_sha256 "$1")"

    if [ "${actual_hash}" != "${YTDLP_SHA256}" ]; then
        echo -e "${RED}✗${NC} Checksum do yt-dlp invalido."
        echo "Esperado: ${YTDLP_SHA256}"
        echo "Obtido:   ${actual_hash}"
        return 1
    fi
}

download_ytdlp_local() {
    local tmp_path="${LOCAL_YTDLP}.tmp"

    rm -f "${tmp_path}"
    curl -fL "${YTDLP_DOWNLOAD_URL}" -o "${tmp_path}"
    verify_ytdlp_hash "${tmp_path}"

    if [ "${OS}" != "Windows_NT" ]; then
        chmod +x "${tmp_path}"
    fi

    mv "${tmp_path}" "${LOCAL_YTDLP}"
}

# Verificar Node.js
echo "📦 Verificando Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js instalado: $NODE_VERSION"

    # Verificar se é v20+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -lt 20 ]; then
        echo -e "${RED}✗${NC} Node.js v20+ é obrigatório (versão detectada: $NODE_VERSION)"
        echo "Atualize o Node.js antes de continuar."
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Node.js não instalado!"
    echo "Instale Node.js v20+ pelo gerenciador oficial da sua distribuição antes de continuar."
    exit 1
fi

# Verificar Bun
echo "📦 Verificando Bun..."
if command_exists bun; then
    BUN_VERSION=$(bun --version)
    echo -e "${GREEN}✓${NC} Bun instalado: v$BUN_VERSION"
else
    echo -e "${RED}✗${NC} Bun não instalado."
    echo "Instale o Bun por um canal confiável e execute este script novamente."
    exit 1
fi

# Verificar FFmpeg
echo "🎬 Verificando FFmpeg..."
if command_exists ffmpeg; then
    FFMPEG_VERSION=$(ffmpeg -version | head -n1)
    echo -e "${GREEN}✓${NC} FFmpeg instalado: $FFMPEG_VERSION"
else
    echo -e "${RED}✗${NC} FFmpeg não instalado!"
    echo "Execute: sudo apt install -y ffmpeg"
    exit 1
fi

# Verificar/Instalar yt-dlp
echo "📹 Verificando yt-dlp..."
YTDLP_INSTALLED=false

if command_exists yt-dlp; then
    YTDLP_GLOBAL_VERSION=$(yt-dlp --version)
    echo -e "${GREEN}✓${NC} yt-dlp instalado globalmente: $YTDLP_GLOBAL_VERSION"
    YTDLP_INSTALLED=true
fi

# Sempre garantir que existe o binário local também
if [ -f "${LOCAL_YTDLP}" ]; then
    if [ "${OS}" != "Windows_NT" ] && [ ! -x "${LOCAL_YTDLP}" ]; then
        echo "🔧 Corrigindo permissões do yt-dlp local..."
        chmod +x "${LOCAL_YTDLP}"
    fi

    if "${LOCAL_YTDLP}" --version >/dev/null 2>&1 && verify_ytdlp_hash "${LOCAL_YTDLP}"; then
        YTDLP_LOCAL_VERSION=$("${LOCAL_YTDLP}" --version)
        echo -e "${GREEN}✓${NC} yt-dlp local encontrado e verificado: $YTDLP_LOCAL_VERSION"
        YTDLP_INSTALLED=true
    else
        echo -e "${YELLOW}⚠${NC}  yt-dlp local inválido ou checksum divergente. Reinstalando..."
        download_ytdlp_local
        YTDLP_LOCAL_VERSION=$("${LOCAL_YTDLP}" --version)
        echo -e "${GREEN}✓${NC} yt-dlp local reinstalado e verificado: $YTDLP_LOCAL_VERSION"
        YTDLP_INSTALLED=true
    fi
else
    echo "📥 Baixando yt-dlp local..."
    download_ytdlp_local
    echo -e "${GREEN}✓${NC} yt-dlp local instalado e verificado!"
    YTDLP_INSTALLED=true
fi

if [ "$YTDLP_INSTALLED" = false ]; then
    echo -e "${RED}✗${NC} Falha ao instalar yt-dlp!"
    exit 1
fi

echo ""
echo "🔧 Instalando dependências..."
rm -rf node_modules
bun install --frozen-lockfile

echo ""
echo "🧾 Gerando inventário do storage (antes do build)..."
bun run preflight:storage > storage-preflight.before.json

echo ""
echo "🏗️  Compilando projeto..."
bun run build

echo ""
echo "🧾 Gerando inventário do storage (após o build)..."
bun run preflight:storage > storage-preflight.after.json

echo ""
echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo "Para iniciar o bot:"
echo "  bun start"
echo ""
echo "Para usar PM2 (recomendado para produção):"
echo "  npm install -g pm2"
echo "  pm2 start bun --name elisyum-bot -- start"
echo "  pm2 save"
echo ""

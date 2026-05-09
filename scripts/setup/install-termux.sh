#!/usr/bin/env bash

set -euo pipefail

REPO_URL="${ELISYUM_REPO_URL:-https://github.com/Jpkovas/elisyum-bot-experimental.git}"
TARGET_DIR="${ELISYUM_INSTALL_DIR:-$HOME/LBOT}"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "== Elisyum Bot Termux installer =="

if command_exists pkg; then
    pkg update -y
    pkg install -y git wget ffmpeg nodejs-lts python make clang pkg-config cairo pango libjpeg-turbo giflib librsvg

    if ! command_exists bun; then
        pkg install -y bun
    fi
fi

if ! command_exists git; then
    echo "Git nao foi encontrado. Instale o git e execute novamente."
    exit 1
fi

if ! command_exists bun; then
    echo "Bun nao foi encontrado. Instale o Bun por um canal confiavel e execute novamente."
    exit 1
fi

if [ -d "$TARGET_DIR/.git" ]; then
    git -C "$TARGET_DIR" pull --ff-only
elif [ -e "$TARGET_DIR" ] && [ "$(ls -A "$TARGET_DIR")" ]; then
    echo "O diretorio $TARGET_DIR ja existe e nao esta vazio."
    exit 1
else
    git clone "$REPO_URL" "$TARGET_DIR"
fi

cd "$TARGET_DIR"

bun install --frozen-lockfile
mkdir -p storage/audios session temp logs/session

if [ ! -f ".env" ]; then
    cat > .env <<'ENV'
BOT_NAME="Elisyum Bot"
BOT_PREFIX="!"
ADMIN_NUMBERS=""
BOT_OWNER_BOOTSTRAP_TOKEN=""
DEEPGRAM_API_KEY=""
TMDB_API_KEY=""
WEATHER_API_KEY=""
ACRCLOUD_HOST=""
ACRCLOUD_ACCESS_KEY=""
ACRCLOUD_SECRET_KEY=""
DEBUG=false
ENV
fi

bun run build

echo ""
echo "Instalacao concluida em: $TARGET_DIR"
echo "Revise o .env antes de iniciar: nano $TARGET_DIR/.env"
echo "Para iniciar: cd $TARGET_DIR && bun start"

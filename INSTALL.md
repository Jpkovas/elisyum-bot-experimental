# 🚀 Instalação Rápida - Elisyum Bot

## Instalação com Script Local Revisável

```bash
git clone https://github.com/paulocesarcustodio/elisyum-bot.git
cd elisyum-bot
./scripts/setup/install.sh
```

**Isso vai:**
- ✅ Usar o script versionado dentro do repositório clonado
- ✅ Validar Bun já instalado
- ✅ Instalar FFmpeg
- ✅ Instalar todas as dependências
- ✅ Compilar o TypeScript
- ✅ Criar estrutura de diretórios
- ✅ Criar arquivo `.env` template

---

## Após a Instalação

### 1️⃣ Entre no diretório
```bash
cd elisyum-bot
```

### 2️⃣ Configure o `.env`
```bash
nano .env
```

**Configurações importantes:**
```env
# Números dos administradores (com código do país)
ADMIN_NUMBERS="5519983084398"

# Token de uso unico para cadastrar o primeiro dono com !admin <token>
BOT_OWNER_BOOTSTRAP_TOKEN=""

# API Deepgram (opcional - para transcrição de áudio)
DEEPGRAM_API_KEY=""

# APIs opcionais usadas por comandos de filme, clima e reconhecimento musical
TMDB_API_KEY=""
WEATHER_API_KEY=""
ACRCLOUD_HOST=""
ACRCLOUD_ACCESS_KEY=""
ACRCLOUD_SECRET_KEY=""
```

### 3️⃣ Inicie o bot
```bash
bun start
```

Para trocar o número conectado sem apagar os áudios salvos:
```bash
bun start -- --clear-session
# ou apenas limpar a sessão e sair
bun run session:clear
```

### 4️⃣ Escaneie o QR Code
Use seu WhatsApp para escanear o código que aparecerá no terminal.

---

## 🎯 Pronto!

Agora você pode usar comandos como:
- `!menu` - Ver todos os comandos
- `!save` - Salvar áudios
- `!a` - Reproduzir ou listar áudios salvos
- `!p` - Baixar áudio do YouTube
- `!mp3` - Converter vídeo em áudio
- Enviar link suportado - Baixar automaticamente
- E muito mais!

---

## 📖 Documentação Completa

- [INSTALLATION.md](docs/guides/INSTALLATION.md) - Guia detalhado
- [COMANDOS.md](docs/reference/COMANDOS.md) - Lista de comandos
- [README.md](README.md) - Informações gerais

---

## ⚠️ Problemas?

Se algo der errado, veja a [documentação completa](docs/guides/INSTALLATION.md#-solução-de-problemas) ou abra uma [issue no GitHub](https://github.com/paulocesarcustodio/elisyum-bot/issues).

---

## 🔒 Segurança

Se preferir revisar o script antes de executar:

```bash
# Clone o repositório e entre nele
git clone https://github.com/paulocesarcustodio/elisyum-bot.git
cd elisyum-bot

# Revise o conteúdo
less scripts/setup/install.sh

# Execute manualmente
./scripts/setup/install.sh
```

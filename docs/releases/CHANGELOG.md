# Notas de atualização
Colocarei neste arquivos as mudanças significativas em cada versão começando na versão 3.0.0

## 3.5.0 - 18/01/2026

### ✨ NOVIDADES
- 🔧 **Correção automática de comandos**: O bot agora detecta e corrige erros de digitação automaticamente (ex: !plai → !play)
- 🤖 **Assistente AI melhorado**: Respostas mais rápidas com sistema de cache inteligente
- ⚙️ **Comando !config ajuda**: Configure o nível de ajuda que você recebe ao errar comandos
  - `simple` - Apenas mensagem de erro
  - `detailed` - Erro + guia do comando (padrão)
  - `with-ai` - Erro + guia + assistente AI
- 🎵 **Download de músicas mais rápido**: Conversão para MP3 até 50% mais rápida

### 🎯 MELHORIAS
- Prefixo fixado permanentemente como `!`
- Respostas da IA mais precisas e diretas
- !ask agora edita a mensagem ao invés de enviar múltiplas
- Sistema de cache para perguntas frequentes da IA
- Ajuda adaptativa: após 2 erros no mesmo comando, o assistente é ativado automaticamente

## Unreleased

### 🔧 Correções de update e setup - revisão PR 45
- Atualizador agora mantém suporte a releases legadas com apenas um `.zip`, validando checksum quando o sidecar `.sha256` estiver disponível.
- Instaladores locais do `yt-dlp` passaram a ter checksum padrão também para Windows.

### 🔧 Correções de comandos e persistência - auditoria batch 5
- Cache do `!ask` agora isola respostas por tipo de usuário.
- Atualizações parciais de grupo preservam valores válidos como `false`, `0` e múltiplos campos no mesmo evento.
- Antiflood, reset de avisos e comandos batch passaram a aguardar a persistência antes de responder.
- Bloqueio de comandos aceita as subcategorias documentadas de utilidade, downloads, stickers e variados.
- `!add` aceita múltiplos números separados por vírgula.
- `!save` valida MIME, tamanho e quotas antes de salvar áudios globais.
- Migração de áudios globais agora mantém backup e relatório de conflitos.

### 🔧 Correções de confiabilidade - auditoria batch 4
- Instalações de produção agora usam `bun install --frozen-lockfile`, com `bun.lock` rastreável.
- Removidas dependências antigas de busca/upload/TTS que puxavam cadeias HTTP depreciadas.
- Patch notes agora reconhecem a última seção do changelog e só marcam versão como notificada quando o envio aos grupos termina sem erro.
- O scheduler passou a ser idempotente para evitar cron jobs duplicados após reconexões.

### 🎨 MUDANÇAS - Consolidação de Menus v3.1
**Simplificação da estrutura de menus com visibilidade baseada em roles**

#### 🔄 Categorias Consolidadas
- **Redução de 7 para 4 categorias**:
  - ~~STICKER~~ → Integrado em **UTILIDADE**
  - ~~DOWNLOAD~~ → Integrado em **UTILIDADE**
  - ~~VARIADO~~ → Integrado em **UTILIDADE**
  - Categorias finais: **INFO**, **UTILIDADE**, **GRUPO**, **ADMIN**

#### 📥 Comandos de Download Simplificados
- **Comandos removidos** (redundantes com `!d`):
  - ~~`!yt`~~ - Vídeos do YouTube → Use `!d` com link do YouTube
  - ~~`!fb`~~ - Vídeos do Facebook → Use `!d` com link do Facebook
  - ~~`!ig`~~ - Instagram → Use `!d` com link do Instagram
  - ~~`!x`~~ - Twitter/X → Use `!d` com link do Twitter/X
  - ~~`!tk`~~ - TikTok → Use `!d` com link do TikTok

- **Comandos mantidos**:
  - `!d` - Download automático universal (detecta plataforma automaticamente)
  - `!play` - Áudio do YouTube (mais usado para músicas por nome)
  - `!img` - Busca de imagens (agora retorna apenas 2 imagens ao invés de 5)

#### 🖼️ Correção do Comando !ssf (Sticker Sem Fundo)
- **Problema identificado**: Serviço externo imageonline.co com erro de certificado SSL
- **Solução implementada**: Migração para biblioteca local `@imgly/background-removal`
- **Benefícios**:
  - ✅ Funciona 100% offline (sem dependência de APIs externas)
  - ✅ Sem necessidade de API keys
  - ✅ Processamento mais rápido
  - ✅ Maior privacidade (imagens não são enviadas para servidores externos)
  - ✅ Mais confiável (não depende de disponibilidade de serviços terceiros)

#### 🎯 Nova Estrutura de Menus
- **Menu 0 - INFO** (apenas dono):
  - `!info`, `!reportar`, `!meusdados`
  
- **Menu 1 - UTILIDADE** (todos os usuários):
  - **Downloads**: `!d` (universal), `!play` (YouTube áudio), `!img` (2 imagens)
  - **Stickers**: `!s`, `!simg`, `!ssf`
  - **Ferramentas**: `!revelar`, `!save`, `!audio`, `!audios`
  - **Variados**: `!vtnc`
  
- **Menu 2 - GRUPO** (admins do grupo + dono):
  - Comandos de moderação e recursos do grupo
  
- **Menu 3 - ADMIN** (apenas dono):
  - Comandos administrativos do bot

#### 👁️ Visibilidade Baseada em Roles
- **Membros comuns**: Veem apenas menu 1 (UTILIDADE)
- **Admins do grupo**: Veem menus 1 (UTILIDADE) + 2 (GRUPO)
- **Dono do bot**: Vê todos os menus (0, 1, 2, 3)

#### 🔧 Mudanças Técnicas
- Integração do `PermissionService` no comando `!menu`
- Validação de permissões ao acessar cada categoria
- Menu principal dinâmico baseado no role do usuário
- Arquivos consolidados:
  - `sticker.list.commands.ts` → `utility.list.commands.ts`
  - `download.list.commands.ts` → `utility.list.commands.ts`
  - `misc.list.commands.ts` → `utility.list.commands.ts`

#### 📊 Benefícios
- ✅ **UX Melhorado**: Usuários veem apenas menus relevantes ao seu nível de acesso
- ✅ **Código Simplificado**: Redução de arquivos e lógica de menu duplicada
- ✅ **Manutenção**: Centralização de comandos relacionados
- ✅ **Segurança**: Validação de permissões integrada

---

### ⚠️ BREAKING CHANGES - Sistema de Permissões v3.0
**IMPORTANTE**: Esta é uma atualização que altera significativamente o sistema de permissões do bot. Leia atentamente antes de atualizar.

#### 🔧 Mudanças Estruturais
- **Removido conceito de "admin do bot"**: O bot agora reconhece apenas o **dono** (owner) para comandos administrativos
- **Sistema simplificado de 3 roles**:
  - `owner`: Dono do bot (acesso total aos comandos administrativos)
  - `group_moderator`: Administradores do grupo WhatsApp (comandos de grupo)
  - `member`: Membros comuns (comandos públicos)

#### 🗑️ Comandos Removidos
Os seguintes comandos foram **permanentemente removidos**:
- `!addadmin` - Adicionar admin do bot
- `!rmadmin` - Remover admin do bot  
- `!admins` - Listar admins do bot
- `!modoadmin` - Ativar/desativar modo admin

#### 🔄 Comportamento Alterado
- **Comandos no PV**: Agora seguem as mesmas permissões de membros comuns quando `commands_pv` está ativado
- **Cache de owner**: Reduzido de 5 minutos para 2 minutos (TTL)
- **Validação centralizada**: Todas as verificações de permissão agora ocorrem no command invoker

#### 📊 Migração Automática (v3)
Ao iniciar o bot após a atualização:
- Campo `admin` será removido de todos os usuários
- Campo `admin_mode` será removido da configuração do bot
- Apenas o owner cadastrado mantém privilégios administrativos
- **Ação necessária**: Use `!admin` novamente se nenhum owner estiver cadastrado

#### 🎯 Impacto
- ✅ **Performance**: Remoção de 39+ verificações redundantes de permissão
- ✅ **Simplicidade**: Sistema mais claro com apenas 3 níveis de acesso
- ✅ **Segurança**: Validação centralizada evita bypass de permissões
- ⚠️ **Compatibilidade**: Scripts/integrações que usavam comandos removidos precisam ser atualizados

#### 📚 Documentação
- Comandos de grupo agora mostram claramente a necessidade de permissão de admin do grupo
- Sistema de roles hierárquico (owner inclui todas as permissões de group_moderator e member)

---

## 3.4.8 - 10/01/2026

### NOVIDADES
- 🎥 **Agendamento Kasino**: Sistema automático que busca e envia o vídeo "Kasino no Sabadaço" todo sábado às 12:00 em todos os grupos
- ⏰ **Scheduler Service**: Nova infraestrutura de agendamento usando node-cron para tarefas automáticas
- 🧪 **Comando de teste**: Novo comando `!testkasino` para administradores testarem o envio manual

### MELHORIAS
- 📅 Agendamento configurável por timezone (America/Sao_Paulo)
- 🔄 Delay automático entre envios para evitar bloqueio
- 📊 Logs detalhados do processo de busca, download e envio
- 🛡️ Tratamento de erros individual por grupo

## 3.4.7 - 10/01/2026

### MELHORIAS
- ✅ **Download do YouTube**: Progresso em tempo real baseado em fragmentos HLS
- 🔄 **Compressão automática**: Vídeos > 16MB são comprimidos automaticamente para envio no WhatsApp
- 🚀 **Performance**: Otimizações no download com yt-dlp (spawn direto, 16 fragmentos concorrentes)
- 📊 **Barras de progresso**: Atualizações suaves durante download, conversão e compressão
- 🔔 **Patch Notes**: Sistema automático que fixa mensagens com atualizações em todos os grupos

### CORREÇÕES
- Removido prompt de confirmação do arquivo .env ao iniciar o bot

## Unreleased

### ALTERAÇÕES
- Adicionado controle persistente de membros mutados nos grupos e limpeza automática ao remover participantes.

### CORREÇÕES
- Impedimos que eventos `modify` sem flag de admin removam o status de administrador no cadastro do grupo.

## 3.4.6 - 09/06/2025

### CORREÇÕES
- Corrigido erro dos comandos do Youtube (**!play** e **!yt**) revertendo para a biblioteca **ytdl-core**

## 3.4.5 - 07/06/2025

### CORREÇÕES
- Corrigido o comando no README para fazer instalação no Termux

### ALTERAÇÕES
- Revertida a versão da API do Tiktok

### DEPENDENCIAS
- As dependencias do projeto foram atualizadas para as versões mais recentes.

## 3.4.4 - 01/06/2025

### CORREÇÕES
- Corrigida a conexão por código de pareamento.

### DEPENDENCIAS
- As dependencias do projeto foram atualizadas para as versões mais recentes.

## 3.4.3 - 23/05/2025

### ALTERAÇÕES
- Alterada versão da API do Tiktok

## 3.4.2 - 20/05/2025

### DEPENDENCIAS
- As dependencias do projeto foram atualizadas para as versões mais recentes.

## 3.4.1 - 06/05/2025

### CORREÇÃO
- Correção na conexão com código de pareamento
- Correção no download de mídias do Instagram

## 3.4.0 - 02/05/2025

### GERAL
- Melhoria na migração de dados que acontece após cada atualização.
- O menu de grupo foi reorganizado e agora exibe os recursos do grupo em categorias separadas.
- A mensagem de erro quando um usuário fazia um comando incorretamente agora exibe diretamente o guia do comando.

### NOVO
- Recurso **Respostas automáticas (Grupo)**: Novo recurso de **GRUPO** para configurar mensagens automáticas de acordo com as palavras configuradas.
- Comando **!audio**: Novo comando **UTILITÁRIO** para extrair áudio de vídeos.

### ALTERAÇÕES
- Recurso **Anti-fake**: O Anti-fake recebeu comandos para adicionar/remover exceções de prefixos internacionais ou até mesmo um número especifico, e as configurações não serão zeradas quando este recurso for desabilitado.
- Recurso **Anti-link**: O Anti-link recebeu comandos para adicionar/remover exceções de links, e as configurações não serão zeradas quando este recurso for desabilitado.
- Comando **!audio**: O comando de efeito de áudio agora foi renomeado para **!efeitoaudio**

### CORREÇÃO
- Correção no **Anti-fake** que não incluía o DDI 55 automaticamente quando configurava as exceções e podia gerar bans acidentais.
- Correções nos efeitos de grave/agudo no comando **!efeitoaudio**

## 3.3.7 - 25/04/2025

### GERAL
- Agora o bot sincroniza todas as mensagens antes de iniciar, isso pode demorar dependendo de quantos grupos o bot está e por quanto tempo o bot estava offline recebendo mensagens.

### CORREÇÃO
- Corrigido possíveis erros na reconstrução do banco de dados
- Corrigido erros nos comandos do Youtube **!play** e **!yt**
- Corrigido erro na criação de stickers em imagens com formato **webp**
- Corrigido envio incorreto de imagem que poderia acontecer no comando **!detector**


## 3.3.6 - 21/04/2025

### CORREÇÃO
- Corrigido o registro de grupos, agora as mensagens de grupo devem ser reconhecidas corretamente.

## 3.3.5 - 21/04/2025

### GERAL
- O registro do Baileys agora está ativo para indicar qualquer problema no bot, não se assuste se aparecer mais letras no console.
- Foram adicionadas mais mensagens de erro nos caso de não conseguir ler a mensagem ou a mensagem não poder ser formatada de forma correta.

### CORREÇÃO
- Correção no registro de usuários, alguns grupos estavam sendo registrados como usuário indevidamente.

## 3.3.4 - 21/04/2025

### GERAL
- Revertida versão do Baileys para a última versão original
- O problema de grupos ainda não foi resolvido, estarei aguardando uma nova versão do Baileys.

## 3.3.3 - 21/04/2025

### CORREÇÕES
- Mais uma tentativa em corrigir as sessões em grupos

## 3.3.2 - 20/04/2025

### CORREÇÕES
- Correção de erro ao tentar usar o código de pareamento
- O armazenamento de sessão foi revertido para a versão antiga já que vários usuários de Termux relataram problemas

## 3.3.1 - 20/04/2025

### CORREÇÕES
- Correção na mensagem de espera do comando **!ig**
- Correção na sessão que não estava detectando corretamente algumas mensagens de grupo.

## 3.3.0 - 18/04/2025

### Com as novas mudanças na sessão após essa atualização você terá que se conectar novamente lendo o código QR ou código de pareamento.

### GERAL
- O armazenamento de dados da sessão foi melhorado, isso deve ajudar a resolver alguns problemas do bot parar de responder do nada e alguns outros erros que aconteciam raramente.
- O bot agora só lê as mensagens após iniciar totalmente para garantir que as mensagens recebidas são novas e não de quando ele estava desligado.
- Os stickers criados agoram recebem o nome de quem fez o comando como autor do sticker.
- As imagens enviadas pelos comandos da categoria **VARIADO** agora ficam armazenadas localmente.
- Adicionado suporte a exceções de links no recurso **ANTI-LINK**

### COMANDOS
- Comando **!nomeautor** foi removido
- Comando **!nomepack**  foi removido

### CORREÇÕES
- Correção da exibição da lista no comando **!top5**
- Correção da conversão de sticker para imagem no comando **!simg**
- Correção do erro 429 em comandos da categoria **VARIADO**

## 3.2.0 - 11/04/2025

### GERAL
- A partir dessa versão o banco de dados é reconstruído a cada atualização não sendo mais necessário perder os dados para atualizar.
- Melhoria na sincronização de grupos.
- Melhoria na fila de eventos para evitar eventos desnecessários.
- Pequenas alterações nos textos exibidos no terminal em cada inicialização.

### COMANDOS
- Todos os comandos que necessitavam de uma chave API (com pouco limite) foram removidos, no momento apenas o **!ia** e **!criarimg** por serem altamente requisitados e acabar rápido o limite.
- Adicionada mensagem de erro ao usar o **!grupos** se o bot não estiver em nenhum grupo.

### CORREÇÕES
- Correção ao remover administrador do grupo que não era reconhecido pelo bot que um membro não já não era mais administrador.

## 3.2.0 - 11/04/2025

### GERAL
- A partir dessa versão o banco de dados é reconstruído a cada atualização não sendo mais necessário perder os dados para atualizar.
- Melhoria na sincronização de grupos.
- Melhoria na fila de eventos para evitar eventos desnecessários.
- Pequenas alterações nos textos exibidos no terminal em cada inicialização.

### COMANDOS
- Todos os comandos que necessitavam de uma chave API (com pouco limite) foram removidos, no momento apenas o **!ia** e **!criarimg** por serem altamente requisitados e acabar rápido o limite.
- Adicionada mensagem de erro ao usar o **!grupos** se o bot não estiver em nenhum grupo.

### CORREÇÕES
- Correção ao remover administrador do grupo que não era reconhecido pelo bot que um membro não já não era mais administrador.

## 3.1.5 - 04/04/2025

### CORREÇÕES
- Correção na escolha de método de autenticação no Termux

## 3.1.4 - 04/04/2025

### GERAL
- Adicionado suporte a código de pareamento, quando iniciar o bot pela primeira vez será perguntado se deseja se conectar pelo QR Code ou Código de pareamento.
- Removida a necessidade de configurar API Key para funcionamento de certos comandos.
- Erros de chamadas externas de API/Bibliotecas agoras são exibidas no console.
- Novo recurso de grupo para **filtrar palavras e deletar mensagem** se alguma palavra do filtro for detectada.

### COMANDOS
- Novo comando de admin **!modoadmin** para apenas administradores do bot conseguirem usar comandos.
- Novo comando de grupo **!rmaviso** para remover aviso de um membro.
- Novo comando de grupo **!zeraravisos** para zerar os avisos de todos os membros.
- Novo comando de grupo **!addfiltros** para adicionar palavras ao filtro do grupo.
- Novo comando de grupo **!rmfiltros** para remover palavas do filtro do grupo.
- Comando **!grupo** agora também exibe os filtros de palavras ativos no grupo.
- Suporte ao campeonato de 2025 no comando **!brasileirao**.

### CORREÇÕES
- Correção na reprodução do video no comando **!qualanime**


## 3.1.3 - 31/03/2025

### COMANDOS
- Comando **!ia** foi adicionado novamente
- Comando **!criarimg** foi adicionado novamente

### CORREÇÕES
- Correção na mensagem de espera do comando **!play**
- Correção no problema de download dos comandos **!play** e **!yt**
- Correção no antiflood que ficava sempre ativo mesmo ele estando desativado.


## 3.1.2 - 29/03/2025

### CORREÇÕES
- Corrigida a sincronização inicial de grupos e da lista negra
- Corrigida resposta quando não encontra nenhuma letra de música pelo comando **!letra**


## 3.1.1 - 28/03/2025

### CORREÇÕES
- Corrigida a atualização de grupos quando o bot inicia, agora ele remove corretamente os participantes do banco de dados que já sairam do grupo.
- Corrigido banimento do comando **!aviso**, agora ao chegar aos 3 avisos ele irá banir corretamente e adicionar a lista negra.


## 3.1.0 - 28/03/2025

### GERAL
- Reorganização na estrutura do projeto para me facilitar na manutenção.
- O atualizador agora verifica se a versão nova é compativel com os dados atuais, caso não seja será perguntado se deseja instalar a versão nova e deletar os dados antigos.
- Implementação de banco de dados para guardar os dados de participantes dos grupos.

### COMANDOS
- Comando **!menu** agora não exibe a categoria grupo quando é usado no privado.
- Comando **!contador** foi removido e agora o contador já está integrado com o grupo.
- Comando **!atividade** foi renomeado para **!membro** e foram adicionadas informações adicionais sobre o membro do grupo.
- Comando **!verusuario** foi renomeado para **!usuario**
- Comando **!veradmins** foi renomeado para **!admins**
- Comando **!vergrupos** foi renomeado para **!grupos**
- Novo comando de grupo **!aviso** (Se o membro receber 3 avisos será automaticamente adicionado a lista negra).

### CORREÇÕES
- Corrigida a resposta do comando **!par**
- Modificado visual do menu para corrigir o visual quebrado em alguns navegadores no PC.
- Corrigida falha que se o usuário fosse bloqueado pelo bot ele não passava pelos filtros dos recursos de segurança do grupo.


## 3.0.2 - 24/03/2025

### GERAL
- Agora quando uma atualização é feita a pasta da versão anterior é deletada para evitar os arquivos que não são mais usados se acumulem.
- Projeto foi reorganizado e agora as API's estão juntas com o bot para facilitar nas atualizações.

### COMANDOS
- Novo comando **!steamverde** para procurar links de "jogos alternativos" para PC.
- Comando **!simi** removido do bot.

### CORREÇÕES
- Os comandos **!ouvir** e **!qualmusica** foram corrigidos e agora recebem a chave de API corretamente.

## 3.0.1 - 21/03/2025

### NOVO
- Novos comandos **!sorteio** para sortear um número.
- Novo comando **!sorteiomembro** para sortear um membro do grupo.

### MUDANÇAS
- O comando **!roletarussa** foi reescrito para ficar mais fiel ao jogo real e agora funciona também em chat privado.

### CORREÇÕES
- Agora se o atualizador não se conseguir se conectar ao GitHub ele não irá impedir de inicializar o bot.

## 3.0.0 - 21/03/2025

### GERAL
- O projeto foi totalmente reescrito para Typescript.
- Agora o projeto utiliza a [**biblioteca-lbot**](https://www.npmjs.com/package/@victorsouzaleal/biblioteca-lbot) para obter dados externos para os comandos.
- Adicionada verificação de versão ao iniciar e se for possível ele fará a atualização automaticamente.
- O visual dos menus e das mensagens de resposta foram reformulados.
- Adicionado suporte a chats que tem mensagens temporárias que desaparecem com o tempo.
- Adicionado recurso de **múltiplos administradores do bot**.
- A configuração de chaves de API agora é feita por comando.
- O recurso de grupo **contador** foi reescrito
- O recurso **Taxa de comandos** foi reescrito
- O recurso **Anti-flood** foi reescrito 
- Os recursos de **Limite diário de comandos** e de **Tipo de usuário** foram removidos.
- O recurso de **Revelar mensagens de visualização única** foi removido.
- Melhoria na fila de eventos em espera enquanto o bot inicializa.
- Melhoria no tratamento de erro nos comandos para o usuário saber o que houve de errado.
- Melhoria no armazenamento de mensagens do bot.
- Melhorias em geral em comandos.
- A categoria de comando **DIVERSÃO** foi renomeada para **VARIADO**


### COMANDOS 

#### Mudanças
- Melhoria nos comandos da categoria DOWNLOAD dando mais informações sobre a mídia baixada e agora permite downloads de no máximo **6 MINUTOS**.
- Melhorias nos comandos da categoria VARIADO, alguns comandos foram reescritos.
- Comando **!s** agora possibilita fazer sticker sem redimensionar a imagem original usando o comando **!s 2**.
- Comando **!status** foi renomeado para **!grupo** e agora exibe mais informações sobre o grupo inclusive quantos comandos foram feitos e quais recursos estão ativos/desativados.
- Comando **!info** agora exibe o contatos de todos que estão registrados como administrador do bot.
- Comando **!reportar** agora reporta a mensagem para todos que estão registrados como administrador do bot.
- Comando **!remlista** foi renomeado para **!rmlista** e agora não é mais necessário digitar o número completo da pessoa que você quer remover da lista negra, é só usar o **!listanegra** e ver qual posição da lista a pessoa que você quer remover está e usar o rmlista. Por exemplo **!rmlista 1** remove a pessoa da posição 1 da lista negra.
- Comando **!listanegra** agora exibe quantos usuários estão na lista negra, e se o usuário que está na lista já tiver tido contato com o bot também será exibido o nome dele ao lado do número.
- Comando **!tw** foi renomeado para **!x**
- Comando **!nomeadm** foi renomeado para **!nomeautor** e agora serve para renomear o nome do autor das figurinhas.
- Comando **!nomesticker** foi renomeado para **!nomepack** e agora serve para renomear o nome do pack das figurinhas.
- Comando **!alink** foi renomeado para **!antilink**.
- Comando **!afake** foi renomeado para **!antifake**.
- Comando **!aflood** foi renomeado para **!antiflood**.
- Comando **!bv** foi renomeado para **!bemvindo**.
- Comando **!fch** foi renomeado para **!frase**.
- Comando **!add** teve a resposta melhorada e só adiciona 1 membro pro comando ao grupo para evitar banimentos.
- Comando **!ban** teve a resposta melhorada e exibe se conseguiu banir ou não o participante.
- Todos os comandos de marcação **!mm**, **!mt** e **!adms** agora usam marcação silenciosa para evitar mostrar uma lista muito grande de pessoas marcadas.
- Comando **!topativos** como padrão agora exibe o ranking dos 10 membros com mais mensagens no grupo.
- Comando **imarcar** foi renomeado para **!inativos**.
- Comando **!verdados** foi renomeado para **!verusuario**
- Comando **!grupos** foi renomeado para **!vergrupos**
- Comando **!estado** foi renomeado para **!recado** e agora pode ser usado para colocar qualquer texto na parte de recado/status no perfil do bot.
- Os comandos **!sair** , **!linkgrupo** e **!sairgrupos** não ficarão mais expostos no menu de admin, eles serão subcomandos do comando **!vergrupos**.
- Comando **!pvliberado** foi renomeado para **!comandospv**
- Comando **!info** agora exibe quais recursos do bot estão ligados/desligados se quem fizer o comando for administrador do bot.

#### Novo
- Novos comandos **!addadmin**, **!rmadmin**, **!veradmins** para adicionar, remover e listar os administradores do bot.
- Novo comando **!api** para configurar as chaves de API sem a necessidade de alterar o .env.

#### Removidos
- Comandos de limite diário e de tipos de usuários **!limitediario**, **!usuarios**, **!tipos**, **!novotipo**, **!tipotitulo**, **!deltipo**, **!usuariotipo**, **!limpartipo**, **!tipocomandos**, **!rtodos**, **!r** foram removidos.
- Comandos de revelar mensagens **!autorevelar** e **!revelar** foram removidos.
- Comando **!rt** foi removido.
- Comando **!enquete** foi removido.
- Comando **!regras** foi removido e foi integrado ao **!grupo**
- Comando **!rastreio** foi removido por não ter mais suporte dos Correios.
- Comandos **!ia** e **!criarimg** removidos, e serão adicionados novamente se voltarem a funcionar ou eu achar alguma alternativa gratuita.
- Comando **!bantodos** foi removido.
- Comando **ibanir** foi removido.
- Comando **!infobot** foi removido, o comando **!info** vai servir para a função dele.


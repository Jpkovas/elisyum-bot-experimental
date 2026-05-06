# improvements.md

## 1. System summary

- Bun/TypeScript WhatsApp bot with Baileys socket handling, command dispatch, NeDB/SQLite persistence, media conversion/download utilities, AI-assisted command help, scheduler jobs, setup/deploy scripts, and generated command documentation.
- Main risk surfaces: WhatsApp message ingress, first-owner bootstrap, command permission metadata, media/download processing, updater/deploy paths, webhook deployment, runtime credentials, persisted chat/log data, and dependency supply chain.
- Audit boundary: read-only repository audit. No source, config, test, storage, or dependency files were modified; only this `improvements.md` report was written.
- Sensitive data handling: suspected credential findings are reported by file and line range only. Raw credential values are intentionally not reproduced.

## 2. Conventions

- Categories: `Bug`, `Performance`, `Security`, `Duplication`, `Code Quality`, `Architecture`, `Maintainability`, `Observability`, `Tests`, `Dependencies`.
- Severity: `Critical`, `High`, `Medium`, `Low`.
- Finding IDs use `A001`, `A002`, ... after synthesis.

## 3. Progress Tracking

- [x] `.gitignore` - reviewed
  File fully reviewed: .gitignore
- [x] `INSTALL.md` - reviewed
  File fully reviewed: INSTALL.md
- [x] `MIGRACAO_BUN.md` - reviewed
  File fully reviewed: MIGRACAO_BUN.md
- [x] `README.md` - reviewed
  File fully reviewed: README.md
- [x] `RECENT_CHANGES.md` - reviewed
  File fully reviewed: RECENT_CHANGES.md
- [x] `TODO.md` - reviewed
  File fully reviewed: TODO.md
- [x] `bin/yt-dlp` - reviewed
  File fully reviewed: bin/yt-dlp
- [x] `bun.lock` - reviewed
  File fully reviewed: bun.lock
- [x] `bunfig.toml` - reviewed
  File fully reviewed: bunfig.toml
- [x] `docs/commands/ai-friendly-admin.txt` - reviewed
  File fully reviewed: docs/commands/ai-friendly-admin.txt
- [x] `docs/commands/ai-friendly-groupadmin.txt` - reviewed
  File fully reviewed: docs/commands/ai-friendly-groupadmin.txt
- [x] `docs/commands/ai-friendly-owner.txt` - reviewed
  File fully reviewed: docs/commands/ai-friendly-owner.txt
- [x] `docs/commands/ai-friendly-usuario.txt` - reviewed
  File fully reviewed: docs/commands/ai-friendly-usuario.txt
- [x] `docs/commands/comandos-admin.txt` - reviewed
  File fully reviewed: docs/commands/comandos-admin.txt
- [x] `docs/commands/comandos-usuario.txt` - reviewed
  File fully reviewed: docs/commands/comandos-usuario.txt
- [x] `docs/guides/DEPLOY.md` - reviewed
  File fully reviewed: docs/guides/DEPLOY.md
- [x] `docs/guides/GLOBAL_AUDIOS.md` - reviewed
  File fully reviewed: docs/guides/GLOBAL_AUDIOS.md
- [x] `docs/guides/INSTALLATION.md` - reviewed
  File fully reviewed: docs/guides/INSTALLATION.md
- [x] `docs/guides/KASINO_SCHEDULER.md` - reviewed
  File fully reviewed: docs/guides/KASINO_SCHEDULER.md
- [x] `docs/guides/PATCH_NOTES.md` - reviewed
  File fully reviewed: docs/guides/PATCH_NOTES.md
- [x] `docs/guides/PERFORMANCE_OPTIMIZATION.md` - reviewed
  File fully reviewed: docs/guides/PERFORMANCE_OPTIMIZATION.md
- [x] `docs/guides/WEBHOOK_DEPLOY.md` - reviewed
  File fully reviewed: docs/guides/WEBHOOK_DEPLOY.md
- [x] `docs/guides/YOUTUBE_QUALITY.md` - reviewed
  File fully reviewed: docs/guides/YOUTUBE_QUALITY.md
- [x] `docs/proposals/MELHORIA_STICKER_NOMES.md` - reviewed
  File fully reviewed: docs/proposals/MELHORIA_STICKER_NOMES.md
- [x] `docs/proposals/MELHORIA_STICKER_NOMES_v2.md` - reviewed
  File fully reviewed: docs/proposals/MELHORIA_STICKER_NOMES_v2.md
- [x] `docs/reference/COMANDOS.md` - reviewed
  File fully reviewed: docs/reference/COMANDOS.md
- [x] `docs/releases/CHANGELOG.md` - reviewed
  File fully reviewed: docs/releases/CHANGELOG.md
- [x] `package.json` - reviewed
  File fully reviewed: package.json
- [x] `run.sh` - reviewed
  File fully reviewed: run.sh
- [x] `scripts/generate-ai-friendly-docs.ts` - reviewed
  File fully reviewed: scripts/generate-ai-friendly-docs.ts
- [x] `scripts/generate-commands-docs.ts` - reviewed
  File fully reviewed: scripts/generate-commands-docs.ts
- [x] `scripts/migrate-audios-to-global.ts` - reviewed
  File fully reviewed: scripts/migrate-audios-to-global.ts
- [x] `scripts/setup/deploy.sh` - reviewed
  File fully reviewed: scripts/setup/deploy.sh
- [x] `scripts/setup/install-ytdlp.js` - reviewed
  File fully reviewed: scripts/setup/install-ytdlp.js
- [x] `scripts/setup/install.sh` - reviewed
  File fully reviewed: scripts/setup/install.sh
- [x] `scripts/storage-preflight.ts` - reviewed
  File fully reviewed: scripts/storage-preflight.ts
- [x] `setup.js` - reviewed
  File fully reviewed: setup.js
- [x] `src/app.ts` - reviewed
  File fully reviewed: src/app.ts
- [x] `src/commands/admin.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/admin.functions.commands.ts
- [x] `src/commands/admin.list.commands.ts` - reviewed
  File fully reviewed: src/commands/admin.list.commands.ts
- [x] `src/commands/download.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/download.functions.commands.ts
- [x] `src/commands/group.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/group.functions.commands.ts
- [x] `src/commands/group.list.commands.ts` - reviewed
  File fully reviewed: src/commands/group.list.commands.ts
- [x] `src/commands/info.admin.commands.ts` - reviewed
  File fully reviewed: src/commands/info.admin.commands.ts
- [x] `src/commands/info.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/info.functions.commands.ts
- [x] `src/commands/info.list.commands.ts` - reviewed
  File fully reviewed: src/commands/info.list.commands.ts
- [x] `src/commands/misc.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/misc.functions.commands.ts
- [x] `src/commands/sticker.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/sticker.functions.commands.ts
- [x] `src/commands/utility.functions.commands.ts` - reviewed
  File fully reviewed: src/commands/utility.functions.commands.ts
- [x] `src/commands/utility.list.commands.ts` - reviewed
  File fully reviewed: src/commands/utility.list.commands.ts
- [x] `src/config.ts` - reviewed
  File fully reviewed: src/config.ts
- [x] `src/config/ai.config.ts` - reviewed
  File fully reviewed: src/config/ai.config.ts
- [x] `src/config/youtube.config.ts` - reviewed
  File fully reviewed: src/config/youtube.config.ts
- [x] `src/constants.ts` - reviewed
  File fully reviewed: src/constants.ts
- [x] `src/controllers/bot.controller.ts` - reviewed
  File fully reviewed: src/controllers/bot.controller.ts
- [x] `src/controllers/group.controller.ts` - reviewed
  File fully reviewed: src/controllers/group.controller.ts
- [x] `src/controllers/user.controller.ts` - reviewed
  File fully reviewed: src/controllers/user.controller.ts
- [x] `src/database/db.ts` - reviewed
  File fully reviewed: src/database/db.ts
- [x] `src/events/connection.event.ts` - reviewed
  File fully reviewed: src/events/connection.event.ts
- [x] `src/events/contacts-update.event.ts` - reviewed
  File fully reviewed: src/events/contacts-update.event.ts
- [x] `src/events/group-added.event.ts` - reviewed
  File fully reviewed: src/events/group-added.event.ts
- [x] `src/events/group-partial-update.event.ts` - reviewed
  File fully reviewed: src/events/group-partial-update.event.ts
- [x] `src/events/group-participants-updated.event.ts` - reviewed
  File fully reviewed: src/events/group-participants-updated.event.ts
- [x] `src/events/message-received.event.ts` - reviewed
  File fully reviewed: src/events/message-received.event.ts
- [x] `src/events/newsletter-chats-update.event.ts` - reviewed
  File fully reviewed: src/events/newsletter-chats-update.event.ts
- [x] `src/events/newsletter-message.event.ts` - reviewed
  File fully reviewed: src/events/newsletter-message.event.ts
- [x] `src/events/newsletter-update.event.ts` - reviewed
  File fully reviewed: src/events/newsletter-update.event.ts
- [x] `src/helpers/ask.cache.helper.ts` - reviewed
  File fully reviewed: src/helpers/ask.cache.helper.ts
- [x] `src/helpers/blocked-contacts.cache.ts` - reviewed
  File fully reviewed: src/helpers/blocked-contacts.cache.ts
- [x] `src/helpers/bot.texts.helper.ts` - reviewed
  File fully reviewed: src/helpers/bot.texts.helper.ts
- [x] `src/helpers/bot.updater.helper.ts` - reviewed
  File fully reviewed: src/helpers/bot.updater.helper.ts
- [x] `src/helpers/command.fuzzy.helper.ts` - reviewed
  File fully reviewed: src/helpers/command.fuzzy.helper.ts
- [x] `src/helpers/command.invoker.helper.ts` - reviewed
  File fully reviewed: src/helpers/command.invoker.helper.ts
- [x] `src/helpers/contacts.store.helper.ts` - reviewed
  File fully reviewed: src/helpers/contacts.store.helper.ts
- [x] `src/helpers/database.migrate.helper.ts` - reviewed
  File fully reviewed: src/helpers/database.migrate.helper.ts
- [x] `src/helpers/events.queue.helper.ts` - reviewed
  File fully reviewed: src/helpers/events.queue.helper.ts
- [x] `src/helpers/groups.sync.helper.ts` - reviewed
  File fully reviewed: src/helpers/groups.sync.helper.ts
- [x] `src/helpers/menu.builder.helper.ts` - reviewed
  File fully reviewed: src/helpers/menu.builder.helper.ts
- [x] `src/helpers/message.handler.helper.ts` - reviewed
  File fully reviewed: src/helpers/message.handler.helper.ts
- [x] `src/helpers/message.procedures.helper.ts` - reviewed
  File fully reviewed: src/helpers/message.procedures.helper.ts
- [x] `src/helpers/patch-notes.helper.ts` - reviewed
  File fully reviewed: src/helpers/patch-notes.helper.ts
- [x] `src/helpers/session.auth.helper.ts` - reviewed
  File fully reviewed: src/helpers/session.auth.helper.ts
- [x] `src/interfaces/bot.interface.ts` - reviewed
  File fully reviewed: src/interfaces/bot.interface.ts
- [x] `src/interfaces/command.interface.ts` - reviewed
  File fully reviewed: src/interfaces/command.interface.ts
- [x] `src/interfaces/group.interface.ts` - reviewed
  File fully reviewed: src/interfaces/group.interface.ts
- [x] `src/interfaces/library.interface.ts` - reviewed
  File fully reviewed: src/interfaces/library.interface.ts
- [x] `src/interfaces/message.interface.ts` - reviewed
  File fully reviewed: src/interfaces/message.interface.ts
- [x] `src/interfaces/user.interface.ts` - reviewed
  File fully reviewed: src/interfaces/user.interface.ts
- [x] `src/modules.d.ts` - reviewed
  File fully reviewed: src/modules.d.ts
- [x] `src/services/bot.service.ts` - reviewed
  File fully reviewed: src/services/bot.service.ts
- [x] `src/services/group.service.ts` - reviewed
  File fully reviewed: src/services/group.service.ts
- [x] `src/services/participant.service.ts` - reviewed
  File fully reviewed: src/services/participant.service.ts
- [x] `src/services/permission.service.ts` - reviewed
  File fully reviewed: src/services/permission.service.ts
- [x] `src/services/scheduler.service.ts` - reviewed
  File fully reviewed: src/services/scheduler.service.ts
- [x] `src/services/user.service.ts` - reviewed
  File fully reviewed: src/services/user.service.ts
- [x] `src/socket.ts` - reviewed
  File fully reviewed: src/socket.ts
- [x] `src/types/custom-ambient.d.ts` - reviewed
  File fully reviewed: src/types/custom-ambient.d.ts
- [x] `src/types/permission.types.ts` - reviewed
  File fully reviewed: src/types/permission.types.ts
- [x] `src/types/yt-search.d.ts` - reviewed
  File fully reviewed: src/types/yt-search.d.ts
- [x] `src/utils/ai.util.ts` - reviewed
  File fully reviewed: src/utils/ai.util.ts
- [x] `src/utils/audio.util.ts` - reviewed
  File fully reviewed: src/utils/audio.util.ts
- [x] `src/utils/command.aliases.util.ts` - reviewed
  File fully reviewed: src/utils/command.aliases.util.ts
- [x] `src/utils/commands.util.ts` - reviewed
  File fully reviewed: src/utils/commands.util.ts
- [x] `src/utils/convert.util.ts` - reviewed
  File fully reviewed: src/utils/convert.util.ts
- [x] `src/utils/download.util.ts` - reviewed
  File fully reviewed: src/utils/download.util.ts
- [x] `src/utils/general.util.ts` - reviewed
  File fully reviewed: src/utils/general.util.ts
- [x] `src/utils/image.util.ts` - reviewed
  File fully reviewed: src/utils/image.util.ts
- [x] `src/utils/mention.util.ts` - reviewed
  File fully reviewed: src/utils/mention.util.ts
- [x] `src/utils/misc.util.ts` - reviewed
  File fully reviewed: src/utils/misc.util.ts
- [x] `src/utils/quote.util.ts` - reviewed
  File fully reviewed: src/utils/quote.util.ts
- [x] `src/utils/sticker.util.ts` - reviewed
  File fully reviewed: src/utils/sticker.util.ts
- [x] `src/utils/updater.util.ts` - reviewed
  File fully reviewed: src/utils/updater.util.ts
- [x] `src/utils/whatsapp.util.ts` - reviewed
  File fully reviewed: src/utils/whatsapp.util.ts
- [x] `start-bot.sh` - reviewed
  File fully reviewed: start-bot.sh
- [x] `start.js` - reviewed
  File fully reviewed: start.js
- [x] `storage/last-version.json` - reviewed
  File fully reviewed: storage/last-version.json
- [x] `tsconfig.json` - reviewed
  File fully reviewed: tsconfig.json
- [x] `webhook-deploy.js` - reviewed
  File fully reviewed: webhook-deploy.js

## 4. Complete finding inventory

### A001
Category: Security
Severity: High
Location: `src/helpers/message.procedures.helper.ts:31-37`
Problem: When no owner exists, the first sender who uses the admin registration command is registered as bot owner from chat alone.
Impact: A fresh install, lost users database, or exposed bot during bootstrap can hand full administrative control to any reachable sender.
Suggestion: Require an explicit configured owner, local console confirmation, pairing proof, or one-time bootstrap token before accepting first-owner registration.
Correlation notes: Message ingress flows through `src/socket.ts`, `src/events/message-received.event.ts`, and `src/helpers/message.handler.helper.ts`.
Security (if applicable): Attacker messages the bot before the real operator and becomes owner; mitigation is out-of-band bootstrap authorization.

### A002
Category: Security
Severity: High
Location: `src/helpers/command.invoker.helper.ts:51-55`, `src/commands/info.list.commands.ts:5-24`
Problem: Info-category commands are invoked without checking command permission metadata, and admin telemetry commands are registered under `info`.
Impact: Non-owners can reach database stats, recent command logs, cached contacts, and error summaries.
Suggestion: Apply one centralized permission gate before invoking any command, independent of command category.
Correlation notes: `src/commands/info.admin.commands.ts:32-64` formats log arguments/errors for chat.
Security (if applicable): Low-privilege users can disclose operational and personal data; mitigation is uniform permission enforcement plus restrictive metadata.

### A003
Category: Security
Severity: Medium
Location: `src/helpers/message.handler.helper.ts:55-108`, `src/helpers/message.handler.helper.ts:177-247`
Problem: Unknown prefixed commands can call Gemini help outside the command-rate guard because rate limiting only runs for known commands or autosticker flows.
Impact: Public users can create repeated AI calls with invalid commands, causing cost and availability pressure.
Suggestion: Rate-limit unknown prefixed commands before fuzzy matching or AI help, and add a separate AI-call budget.
Correlation notes: Uses `askGemini` in `src/utils/ai.util.ts`.
Security (if applicable): Abuse path is repeated invalid command spam; mitigation is pre-AI throttling.

### A004
Category: Security
Severity: High
Location: `src/utils/misc.util.ts:102-103`
Problem: A third-party API credential is hardcoded in source for movie trending requests.
Impact: The credential is exposed to anyone with repo access and cannot be rotated independently from code.
Suggestion: Move the value to secret-backed configuration and rotate the exposed credential.
Correlation notes: Do not copy the credential into logs, docs, or future reports.
Security (if applicable): Credential reuse or quota theft is possible; mitigation is secret storage and rotation.

### A005
Category: Security
Severity: High
Location: `src/utils/misc.util.ts:208-209`
Problem: A Weather API credential is hardcoded and used over plain HTTP.
Impact: The key and request data can be exposed in source and on the network path.
Suggestion: Move the key to secret storage, rotate it, and use HTTPS.
Correlation notes: This is separate from the movie API key finding.
Security (if applicable): Network observer can capture credential material; mitigation is HTTPS plus secret rotation.

### A006
Category: Security
Severity: High
Location: `src/utils/audio.util.ts:17-23`, `src/utils/audio.util.ts:51-58`
Problem: Provider credentials are fetched from an external short URL at runtime.
Impact: Credential supply can change outside deploy control, making the bot dependent on an external redirect/service for privileged secrets.
Suggestion: Load provider keys from controlled environment secrets or a trusted server-side vault.
Correlation notes: Affects transcription and music-recognition paths.
Security (if applicable): Compromised short URL or destination can feed malicious credentials/config; mitigation is owned secret management.

### A007
Category: Security
Severity: High
Location: `src/utils/audio.util.ts:58-89`
Problem: ACRCloud requests are sent to an HTTP URL built from credential response data.
Impact: Signed credential material and uploaded user audio samples can traverse the network unencrypted.
Suggestion: Use HTTPS, validate allowed provider hosts, and reject insecure endpoints.
Correlation notes: Relates to A006 because the host also comes from runtime credential data.
Security (if applicable): Interception can expose audio samples and signatures; mitigation is HTTPS and host allowlisting.

### A008
Category: Security
Severity: Critical
Location: `src/utils/updater.util.ts:30-37`
Problem: The updater downloads the first GitHub release asset and extracts it directly into the application path without checksum/signature verification or zip-entry path validation.
Impact: A compromised release asset or malicious archive can overwrite application files and execute arbitrary code on the next run.
Suggestion: Pin and verify expected asset names, checksums/signatures, and perform zip-slip checks before atomic staged replacement.
Correlation notes: `src/helpers/bot.updater.helper.ts:26-31` trusts the updater result.
Security (if applicable): Supply-chain RCE via release asset; mitigation is signed, staged, validated updates.

### A009
Category: Bug
Severity: Medium
Location: `src/utils/updater.util.ts:37-37`, `src/helpers/bot.updater.helper.ts:28-31`
Problem: `extractAllToAsync` is called without awaiting completion.
Impact: Update state can be marked complete while files are still extracting.
Suggestion: Await extraction and surface extraction failures to the caller.
Correlation notes: The updater helper flips migration state immediately after `makeUpdate`.
Security (if applicable): Not directly security, but it worsens A008 by making partial updates harder to detect.

### A010
Category: Bug
Severity: Medium
Location: `src/helpers/bot.updater.helper.ts:26-29`
Problem: The updater deletes `./dist` before verifying a new artifact was downloaded, validated, and extracted.
Impact: A transient network or extraction failure can leave the install without built output.
Suggestion: Extract to a staging directory, validate, then swap atomically.
Correlation notes: Coupled with A008 and A009.
Security (if applicable): Not directly applicable.

### A011
Category: Security
Severity: Medium
Location: `src/utils/download.util.ts:350-357`
Problem: yt-dlp is invoked with `--no-check-certificate`.
Impact: TLS certificate validation is disabled for media downloads, allowing interception or tampering on hostile networks.
Suggestion: Remove the flag and handle certificate failures explicitly.
Correlation notes: Used by YouTube download flows and scheduled video sending.
Security (if applicable): MITM can alter downloaded content; mitigation is certificate validation.

### A012
Category: Performance
Severity: High
Location: `src/utils/download.util.ts:299-326`, `src/utils/download.util.ts:431-432`
Problem: Remote downloads and downloaded files are loaded fully into memory without max-size enforcement.
Impact: Large or endless responses can exhaust memory before WhatsApp size checks happen later.
Suggestion: Stream with byte limits, content-length checks, timeout, and per-platform size policies.
Correlation notes: Callers include download, mp3, image/media, and scheduler flows.
Security (if applicable): DoS by large media URL; mitigation is bounded streaming.

### A013
Category: Security
Severity: Medium
Location: `src/utils/general.util.ts:204-225`, `src/commands/download.functions.commands.ts:591-613`
Problem: Platform detection uses substring matching against the whole URL rather than parsing and allowlisting the host.
Impact: A URL on an attacker-controlled host containing a supported-domain substring can be routed into platform-specific handlers incorrectly.
Suggestion: Parse URLs with `URL`, normalize hostnames, and require exact/known suffix matches.
Correlation notes: `xMedia` also rewrites substrings in `src/utils/download.util.ts:68-72`.
Security (if applicable): SSRF/wrong-host fetch risk; mitigation is strict host allowlisting.

### A014
Category: Security
Severity: High
Location: `webhook-deploy.js:7-9`, `webhook-deploy.js:23-37`, `webhook-deploy.js:59-77`
Problem: Webhook deploy has a predictable default secret, unbounded request body, plain string signature comparison, and shell interpolation of `DEPLOY_PATH`.
Impact: Misconfiguration or malicious environment data can weaken webhook auth or turn deploy into command execution.
Suggestion: Require non-default secret, cap body size, use timing-safe comparison, parse JSON after verification, and execute commands with argument arrays.
Correlation notes: Documentation encourages this webhook flow in README and deploy guides.
Security (if applicable): Attacker can abuse weak deploy endpoint; mitigation is hardened request and process execution.

### A015
Category: Security
Severity: Medium
Location: `docs/guides/WEBHOOK_DEPLOY.md:48-53`, `docs/guides/WEBHOOK_DEPLOY.md:79-84`, `README.md:241-257`
Problem: Webhook docs show plain HTTP exposure before later advising HTTPS.
Impact: Operators may expose webhook secrets and deploy triggers over cleartext.
Suggestion: Make HTTPS/tunnel termination mandatory in the primary instructions and avoid HTTP public examples.
Correlation notes: Relates to A014.
Security (if applicable): Network observer can capture webhook payload/signatures; mitigation is HTTPS-only guidance.

### A016
Category: Dependencies
Severity: High
Location: `package.json:15-17`, `bunfig.toml:9-12`
Problem: Normal startup runs `bun install` via `prestart`, and Bun install scripts are broadly trusted.
Impact: Routine `bun start` can execute newly resolved third-party install hooks in production.
Suggestion: Remove `prestart` installs; make dependency installation an explicit deploy step with a locked dependency set.
Correlation notes: Amplified by A017.
Security (if applicable): Dependency install hook execution at runtime; mitigation is no install on app startup.

### A017
Category: Dependencies
Severity: Medium
Location: `.gitignore:23-27`, `package.json:20-21`, `webhook-deploy.js:64-69`, `scripts/setup/deploy.sh:123-127`
Problem: `bun.lock` is ignored/untracked while deploy commands expect frozen-lockfile behavior.
Impact: Fresh deploys can fail or resolve different dependency versions than local development.
Suggestion: Track `bun.lock` or remove frozen-lockfile expectations and document non-reproducible installs explicitly.
Correlation notes: Current working tree contains a local lockfile, but `.gitignore` excludes it.
Security (if applicable): Dependency drift weakens reviewability; mitigation is tracked lockfile.

### A018
Category: Security
Severity: Medium
Location: `INSTALL.md:5-7`, `README.md:14-16`, `scripts/setup/install.sh:73-75`, `scripts/setup/install-ytdlp.js:28-33`, `scripts/setup/deploy.sh:100-112`, `docs/guides/DEPLOY.md:18-22`
Problem: Install/deploy paths recommend or automate remote executable/bootstrap downloads without checksum or signature verification.
Impact: Compromised transport, release, or install endpoint can ship malicious tools.
Suggestion: Pin versions and verify checksums/signatures for bootstrap scripts and yt-dlp binaries.
Correlation notes: Related to committed `bin/yt-dlp` provenance in A019.
Security (if applicable): Supply-chain execution; mitigation is verified downloads.

### A019
Category: Dependencies
Severity: Low
Location: `bin/yt-dlp:1-2`, `scripts/setup/install-ytdlp.js:21-33`, `scripts/setup/deploy.sh:87-115`
Problem: A large executable zipapp is committed without in-repo provenance metadata or expected hash verification.
Impact: Reviewers cannot easily verify whether the binary matches a trusted upstream release.
Suggestion: Document version, source URL, expected SHA-256, and verification procedure; prefer downloading verified pinned releases.
Correlation notes: Sub-agent observed local version/hash but this report does not rely on that as a trust guarantee.
Security (if applicable): Binary provenance gap; mitigation is reproducible verification.

### A020
Category: Dependencies
Severity: Medium
Location: `bun.lock:499-501`, `bun.lock:1171-1177`, `bun.lock:1323-1323`, `bun.lock:1615-1615`, `bun.lock:1689-1695`
Problem: Lockfile includes old/deprecated dependency chains in runtime download/search paths, including nested old HTTP/client packages.
Impact: Known-deprecated libraries increase maintenance and security exposure.
Suggestion: Run a current advisory audit with explicit approval, upgrade transitive owners where possible, and replace libraries that pull abandoned chains.
Correlation notes: A network-backed `bun audit` was attempted but could not complete inside the sandbox; escalation was rejected because it would export private dependency metadata.
Security (if applicable): Possible known-vulnerability exposure; mitigation is current advisory review and dependency upgrades.

### A021
Category: Dependencies
Severity: Medium
Location: `package.json:107-109`, `bun.lock:81-83`, `bun.lock:1089-1089`
Problem: The manifest pin for `libsignal` and the resolved lock entry appear to reference different commits.
Impact: Reviewers cannot easily confirm which libsignal code is actually installed.
Suggestion: Regenerate and track the lockfile after confirming the intended commit, or align the manifest and lock.
Correlation notes: Impacts reproducibility of Baileys cryptographic dependency chain.
Security (if applicable): Supply-chain review ambiguity; mitigation is exact commit alignment.

### A022
Category: Security
Severity: Medium
Location: `scripts/storage-preflight.ts:56-89`, `scripts/setup/deploy.sh:129-138`, `webhook-deploy.js:66-71`, `.gitignore:1-27`
Problem: Storage preflight reports include operational/user metadata and are written to JSON files not covered by `.gitignore`.
Impact: Generated reports can leak project paths, storage filenames, audio names, and audio file paths if accidentally committed or exposed.
Suggestion: Redact report fields and ignore `storage-preflight*.json`.
Correlation notes: Deploy scripts generate before/after reports.
Security (if applicable): Metadata leakage; mitigation is redaction and ignore rules.

### A023
Category: Security
Severity: Medium
Location: `src/events/contacts-update.event.ts:21-22`, `src/events/newsletter-message.event.ts:43-56`, `src/events/newsletter-update.event.ts:17-22`, `src/database/db.ts:31-43`, `src/database/db.ts:243-267`
Problem: Logs and persisted command logs can include contact identifiers, names, newsletter text/metadata, command args, and errors.
Impact: Personal data or secrets typed into chats can be retained in local logs/databases and later exposed via admin commands.
Suggestion: Redact/harden logging, store minimal fields, and gate log display strictly to owners.
Correlation notes: A002 makes this more severe because some log views are reachable from info commands.
Security (if applicable): Sensitive chat data leakage; mitigation is minimization and access control.

### A024
Category: Bug
Severity: Medium
Location: `src/database/db.ts:130-140`, `src/database/db.ts:463-505`
Problem: `ask_cache` uses globally unique `question_hash`, while reads are scoped by `question_hash` plus `user_type`.
Impact: Owner/admin/user answers for the same normalized question can overwrite each other or miss cache isolation.
Suggestion: Use composite uniqueness on `(question_hash, user_type)` and update conflict logic accordingly.
Correlation notes: `src/helpers/ask.cache.helper.ts:45-99` relies on user-type separation.
Security (if applicable): Owner-scoped AI answer could be mixed with lower-privilege cache data; mitigation is composite keying.

### A025
Category: Bug
Severity: Medium
Location: `src/helpers/patch-notes.helper.ts:76-94`, `src/helpers/patch-notes.helper.ts:133-137`
Problem: Changelog regex only matches a version section when another `## ` heading follows it, so the final/latest section can be missed.
Impact: Latest patch notes can be skipped and then marked as notified.
Suggestion: Allow end-of-file in the lookahead and only save notification state after notes are found/sent.
Correlation notes: Current version state is stored in `storage/last-version.json`.
Security (if applicable): Not applicable.

### A026
Category: Reliability
Severity: Medium
Location: `src/helpers/patch-notes.helper.ts:155-183`
Problem: Patch notes save the current version as notified even when some group sends fail.
Impact: Failed groups are never retried for that version.
Suggestion: Persist per-group delivery status or retry failures before marking global success.
Correlation notes: Uses group list from `GroupController`.
Security (if applicable): Not applicable.

### A027
Category: Bug
Severity: Medium
Location: `src/socket.ts:77-97`, `src/services/scheduler.service.ts:20-39`
Problem: Every successful reconnect creates a new `SchedulerService` and schedules cron jobs again.
Impact: Reconnects can duplicate weekly media sends and cache-maintenance jobs.
Suggestion: Make scheduler initialization singleton/idempotent and expose stop/destroy handling on reconnect.
Correlation notes: Scheduler jobs include `sendKasinoVideo` and ask-cache maintenance.
Security (if applicable): Not applicable.

### A028
Category: Bug
Severity: Medium
Location: `src/services/group.service.ts:150-156`
Problem: Partial group updates ignore falsy valid values and only apply one field because of an `if/else if` chain.
Impact: Updates such as `announce=false`, `ephemeralDuration=0`, or multi-field updates can be missed.
Suggestion: Check property presence with `in`/`hasOwnProperty` and apply each changed field independently.
Correlation notes: Triggered by `src/events/group-partial-update.event.ts`.
Security (if applicable): Not applicable.

### A029
Category: Bug
Severity: Low
Location: `src/services/participant.service.ts:355-357`
Problem: `removeParticipantsWarnings` updates only one matching participant because NeDB update lacks `{ multi: true }`.
Impact: The plural method leaves most participants' warnings untouched.
Suggestion: Add `{ multi: true }` and test warning reset across multiple participants.
Correlation notes: Group warning commands depend on participant service semantics.
Security (if applicable): Not applicable.

### A030
Category: Bug
Severity: Medium
Location: `src/helpers/message.procedures.helper.ts:262-275`
Problem: Anti-flood enforcement checks stale `participant.antiflood.msgs` after incrementing storage.
Impact: Enforcement is off by one relative to persisted message count.
Suggestion: Compute the next count before persistence or reload the updated participant before comparing.
Correlation notes: Similar pattern exists in command-rate logic.
Security (if applicable): Abuse threshold can be exceeded by one message; mitigation is atomic counter logic.

### A031
Category: Bug
Severity: Medium
Location: `src/commands/admin.functions.commands.ts:74-81`, `src/commands/admin.functions.commands.ts:275-289`, `src/commands/group.functions.commands.ts:579-590`, `src/commands/group.functions.commands.ts:610-621`, `src/commands/group.functions.commands.ts:633-644`, `src/commands/group.functions.commands.ts:685-705`, `src/commands/group.functions.commands.ts:721-743`
Problem: Several commands start async work inside `forEach` without awaiting completion.
Impact: Replies can be sent before persistence/network operations finish, and failures can bypass command error handling.
Suggestion: Replace async `forEach` with `for...of` awaits or controlled `Promise.allSettled`.
Correlation notes: Affects broadcast, auto-reply exceptions, antifake exceptions, and related group/admin flows.
Security (if applicable): Not directly applicable.

### A032
Category: Bug
Severity: Medium
Location: `src/commands/admin.functions.commands.ts:164-180`, `src/commands/admin.functions.commands.ts:205-227`, `src/commands/group.functions.commands.ts:884-900`, `src/commands/group.functions.commands.ts:925-948`, `src/utils/commands.util.ts:41-52`
Problem: Command blocking accepts labels such as `sticker`, `download`, and `misc` that `getCommandsByCategory` cannot return.
Impact: Documented category-block operations can produce `undefined` and crash iteration or misreport results.
Suggestion: Align categories with resolver categories or implement utility subcategory expansion explicitly.
Correlation notes: Documented in admin/group command list guides.
Security (if applicable): Not applicable.

### A033
Category: Bug
Severity: Low
Location: `src/commands/group.list.commands.ts:170-171`, `src/commands/group.functions.commands.ts:322-344`
Problem: Group add documentation advertises comma-separated multiple numbers, but implementation converts the full text into one JID and adds only once.
Impact: Multi-add usage fails as one invalid number.
Suggestion: Split, validate, and add multiple numbers or correct the documentation.
Correlation notes: Related to command docs drift in A054.
Security (if applicable): Not applicable.

### A034
Category: Bug
Severity: Low
Location: `src/commands/admin.functions.commands.ts:257-261`
Problem: `entrargrupoCommand` can send both pending and success replies for the same join attempt.
Impact: Users receive contradictory status.
Suggestion: Return after pending response or branch success/pending explicitly.
Correlation notes: Uses `joinGroupInviteLink`.
Security (if applicable): Not applicable.

### A035
Category: Security
Severity: Medium
Location: `src/commands/utility.functions.commands.ts:83-125`, `src/commands/utility.functions.commands.ts:127-135`
Problem: Global audio save writes quoted audio to disk without size, quota, or MIME enforcement in the command path.
Impact: Users can grow disk usage or store unexpected media under global audio storage.
Suggestion: Enforce max file size, per-user quota, total quota, allowed MIME types, and cleanup on DB failure.
Correlation notes: Stored in `storage/audios` and indexed by `audiosDb`.
Security (if applicable): Disk exhaustion abuse; mitigation is quota and validation.

### A036
Category: Security
Severity: High
Location: `src/database/db.ts:334-339`, `src/database/db.ts:425-430`
Problem: Saved-audio deletion trusts persisted `file_path` and unlinks it without constraining it to `storage/audios`.
Impact: If a DB record is poisoned, delete can remove an arbitrary process-accessible path.
Suggestion: Store relative filenames only, resolve under a fixed storage root, and reject paths escaping that root.
Correlation notes: Save path currently writes under `storage/audios`, but delete trusts the database.
Security (if applicable): Arbitrary file deletion after DB poisoning; mitigation is path root enforcement.

### A037
Category: Performance
Severity: Low
Location: `src/services/participant.service.ts:122-133`, `src/services/participant.service.ts:268-273`
Problem: Participant sync is O(n²) because each participant check reloads all participant IDs.
Impact: Large groups sync slowly and create unnecessary datastore reads.
Suggestion: Build one Set of current participant IDs before the loop.
Correlation notes: Called during group sync/startup.
Security (if applicable): Not applicable.

### A038
Category: Performance
Severity: Low
Location: `src/services/scheduler.service.ts:82-86`
Problem: Scheduled video sending regenerates the same thumbnail once per group from the same buffer.
Impact: CPU and temp-file work scale unnecessarily with group count.
Suggestion: Generate the thumbnail once before the send loop.
Correlation notes: Related to scheduler duplication in A027.
Security (if applicable): Not applicable.

### A039
Category: Performance
Severity: Low
Location: `src/services/bot.service.ts:51-67`, `src/services/bot.service.ts:110-114`, `src/helpers/message.handler.helper.ts:67-70`, `src/helpers/message.handler.helper.ts:193-197`
Problem: Hot command paths synchronously read/write JSON bot state.
Impact: Event-loop blocking and lost updates are possible under concurrent message handling.
Suggestion: Move counters/state into a single datastore with atomic increments or async serialized writes.
Correlation notes: `incrementExecutedCommands` is called per command.
Security (if applicable): Not applicable.

### A040
Category: Maintainability
Severity: Low
Location: `src/services/group.service.ts:194-199`, `src/services/group.service.ts:210-215`, `src/services/group.service.ts:222-235`, `src/services/group.service.ts:276-281`, `src/services/group.service.ts:311-323`
Problem: List mutators use `$push` without datastore-level de-duplication.
Impact: Repeated commands can grow duplicate filters, exceptions, replies, and block rules.
Suggestion: Use `$addToSet` where supported or normalize arrays before persistence.
Correlation notes: Some command-layer checks try to prevent duplicates, but service methods do not enforce it.
Security (if applicable): Not applicable.

### A041
Category: Observability
Severity: Low
Location: `src/app.ts:9-11`
Problem: FFmpeg installer failure is swallowed at startup.
Impact: Media commands can fail later without a clear startup warning.
Suggestion: Log a structured warning with expected remediation when FFmpeg setup fails.
Correlation notes: Media conversion utilities depend on FFmpeg.
Security (if applicable): Not applicable.

### A042
Category: Observability
Severity: Low
Location: `src/config.ts:10-16`
Problem: Baileys logger is forced to `silent`.
Impact: Connection/auth diagnostics are unavailable during degraded production behavior.
Suggestion: Make log level environment-configurable and redact sensitive data.
Correlation notes: Useful for socket lifecycle failures.
Security (if applicable): Not applicable.

### A043
Category: Reliability
Severity: Medium
Location: `src/socket.ts:45-46`, `src/socket.ts:132-150`, `src/helpers/events.queue.helper.ts:29-63`
Problem: Pre-ready events are stored in an unbounded in-memory array with no TTL, size cap, or backpressure.
Impact: Long readiness failures can grow memory, and queued state is lost on process exit.
Suggestion: Bound queue size, coalesce by key, add metrics, and persist critical events if needed.
Correlation notes: Queue handles group participant/group update events before readiness.
Security (if applicable): Event-flood memory DoS; mitigation is queue limits.

### A044
Category: Bug
Severity: Low
Location: `src/utils/general.util.ts:89-90`
Problem: Duration formatting uses wall-clock formatting and wraps hours instead of total elapsed time.
Impact: Long videos can display incorrect durations.
Suggestion: Format durations with arithmetic or a duration library, not date formatting.
Correlation notes: Used by YouTube metadata display.
Security (if applicable): Not applicable.

### A045
Category: Bug
Severity: Low
Location: `src/utils/convert.util.ts:284-299`
Problem: Video compression divides by duration without guarding zero or missing metadata.
Impact: Invalid media can produce infinite/invalid bitrate values passed to FFmpeg.
Suggestion: Validate duration before computing target bitrate and fail with a controlled error.
Correlation notes: Called after media download/compression paths.
Security (if applicable): Not applicable.

### A046
Category: Bug
Severity: Low
Location: `src/utils/misc.util.ts:295-299`
Problem: Currency conversion parses values with `parseInt`, truncating decimals.
Impact: Inputs such as decimal monetary values produce incorrect conversions.
Suggestion: Normalize locale separators and use `Number`/decimal parsing with validation.
Correlation notes: User-facing utility command behavior.
Security (if applicable): Not applicable.

### A047
Category: Reliability
Severity: Low
Location: `src/utils/whatsapp.util.ts:492-497`
Problem: Thumbnail generation is raced against a timeout, but the underlying FFmpeg work is not cancelled.
Impact: Timed-out conversions can continue consuming CPU/temp files after sending without thumbnail.
Suggestion: Add cancellable conversion or child-process timeout/kill support in the conversion helper.
Correlation notes: Affects video sends from buffers.
Security (if applicable): Not applicable.

### A048
Category: Reliability
Severity: Medium
Location: `src/utils/whatsapp.util.ts:573-588`
Problem: Message caches are keyed only by `message.key.id`.
Impact: If IDs collide across chats, lookup can return media/content from the wrong conversation.
Suggestion: Include remote JID and participant in cache keys.
Correlation notes: Used by message retry/view-once cache flows.
Security (if applicable): Cross-chat content mix-up risk; mitigation is scoped cache keys.

### A049
Category: Observability
Severity: Low
Location: `src/helpers/ask.cache.helper.ts:77-99`
Problem: Ask-cache logging includes user question text.
Impact: Questions can contain personal data from WhatsApp chats and be retained in logs.
Suggestion: Log hashes, lengths, or redacted previews instead of raw question snippets.
Correlation notes: Related to broader logging/data retention in A023.
Security (if applicable): PII leakage; mitigation is log redaction.

### A050
Category: Tests
Severity: Low
Location: `src/types/custom-ambient.d.ts:1-45`, `src/modules.d.ts:7-24`
Problem: Broad `any` declarations hide integration breakage for external libraries and database APIs.
Impact: Typecheck can pass despite incompatible API use in media, zip, search, and datastore calls.
Suggestion: Replace broad ambient declarations with specific types or maintained `@types` packages.
Correlation notes: No test/spec files were found in the repository.
Security (if applicable): Not applicable.

### A051
Category: Bug
Severity: Medium
Location: `scripts/migrate-audios-to-global.ts:69-89`, `scripts/migrate-audios-to-global.ts:96-101`, `docs/guides/GLOBAL_AUDIOS.md:146-155`, `docs/guides/GLOBAL_AUDIOS.md:212-217`
Problem: Audio migration collapses duplicate audio names to `MIN(id)` and drops the old table, while docs/comments describe a different selection rule.
Impact: User audio records can be silently discarded during migration.
Suggestion: Produce a conflict report, back up old rows, and choose duplicates by documented criteria before dropping data.
Correlation notes: Affects global audio feature.
Security (if applicable): Not applicable.

### A052
Category: Bug
Severity: Low
Location: `scripts/setup/install.sh:46-52`, `scripts/setup/install.sh:273-291`
Problem: Installer writes a wrapper to `elisyum-bot/run.sh` after it may already have `cd`'d into `elisyum-bot`.
Impact: `set -e` can abort late after build because the nested path does not exist.
Suggestion: Write to `./run.sh` in the current project root or track the clone target separately.
Correlation notes: Separate from top-level `run.sh`.
Security (if applicable): Not applicable.

### A053
Category: Security
Severity: Low
Location: `INSTALL.md:32-39`, `docs/guides/INSTALLATION.md:76-82`
Problem: Documentation includes real-looking admin phone-number examples.
Impact: Readers may treat examples as real identifiers or accidentally publish personal numbers.
Suggestion: Use clearly fake placeholders such as `55XXXXXXXXXXX` consistently.
Correlation notes: Do not include real personal identifiers in docs.
Security (if applicable): Privacy risk; mitigation is fake placeholders.

### A054
Category: Maintainability
Severity: Low
Location: `docs/commands/ai-friendly-admin.txt:29-43`, `docs/commands/ai-friendly-usuario.txt:30-45`
Problem: Generated command docs are stale/inconsistent around preferred command aliases.
Impact: AI help can provide outdated command guidance depending on user role document.
Suggestion: Regenerate docs from canonical command metadata and add a check that generated docs are in sync.
Correlation notes: AI help loads these docs from `src/utils/ai.util.ts:14-50`.
Security (if applicable): Not applicable.

## 5. Planning assumptions and constraints

- This report is a read-only audit artifact; remediation must happen in separate implementation work.
- Findings prioritize exploitable security/correctness first, then reliability, dependency reproducibility, performance, observability, and documentation drift.
- Unknowns: live WhatsApp/Baileys behavior was not exercised; network-backed CVE audit was not completed; some dependency risk requires current advisory confirmation before exact version choices.

## 6. Prioritized backlog (all findings)

- Priority 1: A008 (L, Security), A001 (M, Security), A002 (M, Security), A004 (S, Security), A005 (S, Security), A006 (M, Security), A007 (M, Security), A014 (M, Security), A016 (S, Security), A036 (M, Security).
- Priority 2: A003 (M, Security), A011 (S, Security), A012 (M, Reliability), A013 (M, Security), A017 (S, Reliability), A018 (M, Security), A020 (M, Security), A021 (S, Security), A022 (S, Security), A023 (M, Security), A024 (M, Correctness), A043 (M, Reliability), A048 (M, Reliability).
- Priority 3: A009 (S, Correctness), A010 (M, Reliability), A015 (S, Security), A025 (S, Correctness), A026 (M, Reliability), A027 (M, Reliability), A028 (S, Correctness), A030 (S, Correctness), A031 (M, Correctness), A032 (M, Correctness), A035 (M, Reliability), A051 (M, Correctness).
- Priority 4: A019 (S, Maintainability), A029 (S, Correctness), A033 (S, Correctness), A034 (S, Correctness), A037 (S, Performance), A038 (S, Performance), A039 (M, Performance), A040 (M, Maintainability), A041 (S, Observability), A042 (S, Observability), A044 (S, Correctness), A045 (S, Correctness), A046 (S, Correctness), A047 (M, Reliability), A049 (S, Observability), A050 (M, Maintainability), A052 (S, Correctness), A053 (S, Security), A054 (S, Maintainability).

Effort rationale: `S` is local single-flow change; `M` needs cross-file tests or migration care; `L` requires staged/security-sensitive updater design.

## 7. Detailed phased remediation plan

### Phase 1: Contain critical security and privilege risks
- Objective: remove immediate admin/data/supply-chain exposure.
- Findings included: A001, A002, A004, A005, A006, A007, A008, A014, A016, A036.
- Dependencies and ordering constraints: fix A001/A002 before expanding admin telemetry; rotate credentials after removing hardcoded/public fetch paths; disable updater or harden it before using it again.
- Validation gates: permission tests for every command category; first-owner bootstrap tests; secret scan with no raw keys; updater tests against malicious zip paths; webhook signature/body/path tests.
- Exit criteria: no public chat path grants owner/telemetry access; no hardcoded runtime credentials; update/deploy entrypoints reject unsafe defaults and unverified artifacts.

### Phase 2: Bound network, media, and data-exposure surfaces
- Objective: make user-controlled external input resource-bounded and host-validated.
- Findings included: A003, A011, A012, A013, A018, A022, A023, A043, A048, A049.
- Dependencies and ordering constraints: build a shared safe-fetch/download contract before patching individual callers; redaction rules should be defined before changing logs.
- Validation gates: tests for URL allowlisting, max download size, timeout, queue cap, cache key scoping, AI rate limiting, and redacted logs.
- Exit criteria: unsupported/malicious URLs are rejected; downloads are bounded; queued events cannot grow unbounded; logs avoid chat content/credentials by default.

### Phase 3: Restore reproducibility and update reliability
- Objective: prevent drift, partial updates, and skipped notifications.
- Findings included: A009, A010, A017, A019, A020, A021, A025, A026, A027.
- Dependencies and ordering constraints: decide lockfile policy before dependency upgrades; updater staging should precede re-enabling automatic replacement.
- Validation gates: tracked/frozen install preflight; updater staged extraction tests; changelog parser tests for final section; reconnect scheduler idempotency tests.
- Exit criteria: fresh clone installs deterministically; updates are atomic; patch notes retry failures; reconnects do not duplicate scheduled jobs.

### Phase 4: Correct command and persistence behavior
- Objective: align command docs, command execution, and datastore semantics.
- Findings included: A024, A028, A029, A030, A031, A032, A033, A034, A035, A051, A052.
- Dependencies and ordering constraints: command permission work from Phase 1 should land before broad command refactors; migration fixes must preserve backups.
- Validation gates: tests for ASK cache by role, partial group updates, warnings reset, anti-flood threshold, async batch commands, command-category blocking, multi-add behavior, audio quotas, and audio migration conflicts.
- Exit criteria: command responses reflect completed work; docs match behavior; migrations do not silently discard data.

### Phase 5: Improve performance, observability, and maintainability
- Objective: reduce operational drag and make failures diagnosable.
- Findings included: A037, A038, A039, A040, A041, A042, A044, A045, A046, A047, A050, A053, A054.
- Dependencies and ordering constraints: logging changes should preserve redaction from Phase 2; type tightening should follow behavior tests for risky integrations.
- Validation gates: participant sync benchmark on large synthetic groups; thumbnail generation count test; duration/currency unit tests; configurable log-level check; generated-doc sync check.
- Exit criteria: hot paths avoid unnecessary synchronous or repeated work; diagnostics are available without leaking sensitive data; generated docs stay current.

## 8. Delivery roadmap

- Wave 1: A001, A002, A004, A005, A006, A007, A014, A016, A036. Expected risk reduction: closes the easiest privilege/secret/deploy abuse paths. Verification focus: auth gates, secret absence, webhook hardening.
- Wave 2: A008, A009, A010, A011, A012, A013, A018. Expected risk reduction: closes update and external media supply-chain/resource risks. Verification focus: malicious archives, host allowlists, bounded downloads.
- Wave 3: A003, A022, A023, A043, A048, A049. Expected risk reduction: lowers data leakage and DoS risk from chat/network behavior. Verification focus: redaction, queue caps, AI throttling.
- Wave 4: A017, A020, A021, A025, A026, A027. Expected risk reduction: reproducible deploys and reliable lifecycle behavior. Verification focus: frozen install, reconnect, patch notes.
- Wave 5: A024, A028, A029, A030, A031, A032, A033, A034, A035, A051, A052. Expected risk reduction: fixes user-visible correctness and migration defects. Verification focus: command and migration tests.
- Wave 6: A019, A037, A038, A039, A040, A041, A042, A044, A045, A046, A047, A050, A053, A054. Expected risk reduction: operational quality, maintainability, and documentation accuracy. Verification focus: benchmarks, type tightening, doc generation checks.

## 9. Auxiliary checks

- `bun run tsc --noEmit`: passed.
- Test/spec file search: no repository test/spec files found outside `node_modules`/`.git`.
- `bun audit`: initial sandboxed run failed with `ConnectionRefused`. Escalated rerun was rejected because it would export private dependency metadata to an external advisory service. Dependency findings that require current advisory data are therefore marked as lockfile/deprecated-chain risks rather than confirmed live CVEs.
- Live WhatsApp, deployment, updater, network media, and webhook production behavior were not executed because this was a read-only audit and those paths can mutate external systems or local state.

## 10. Completeness checkpoint

- Canonical reviewed file count: 118.
- Reviewed rows in Progress Tracking: 118.
- `Progress Tracking` appears once.
- All validated findings include file and line references.

## 11. Batch 1 remediation notes

- Date: 2026-05-06.
- Scope implemented: Wave 1 / batch 1 findings A001, A002, A004, A005, A006, A007, A014, A016, and A036.
- WhatsApp authentication boundary: no changes were made to `src/helpers/session.auth.helper.ts`, `src/socket.ts`, `src/config.ts`, or `src/events/connection.event.ts`.
- Owner bootstrap now requires `BOT_OWNER_BOOTSTRAP_TOKEN` with `!admin <token>` only when no owner exists; existing owner behavior is unchanged.
- Info telemetry commands now carry owner-only metadata and all command categories pass through a centralized permission gate before command execution.
- TMDB, Weather API, Deepgram, and ACRCloud runtime credentials now come from environment variables. The old public key bundle fetch path and HTTP ACRCloud/Weather calls were removed.
- Webhook deploy now requires an explicit secret, verifies GitHub HMAC with timing-safe comparison, caps request body size, parses JSON after verification, and runs deploy steps without shell interpolation.
- Runtime `bun start` no longer performs `bun install`, and Bun install scripts are restricted to the known native packages required by the project.
- Saved-audio delete/save paths are constrained to `storage/audios` before filesystem writes or unlinks.
- Verification added: `tests/batch1.command-security.test.ts`, `tests/batch1.env-credentials.test.ts`, and `tests/batch1.deploy-and-storage.test.ts`.
- Sub-agent packets reconciled:
  - Commands and command metadata: reconciled into A002, A031, A032, A033, A034, A035.
  - Services/database/socket/events: reconciled into A001, A003, A023, A024, A027, A028, A029, A030, A036, A037, A038, A039, A040, A041, A042, A043.
  - Utilities/integrations/types: reconciled into A004, A005, A006, A007, A008, A009, A010, A011, A012, A013, A025, A026, A044, A045, A046, A047, A048, A049, A050.
  - Configs/scripts/docs/dependencies: reconciled into A014, A015, A016, A017, A018, A019, A020, A021, A022, A051, A052, A053, A054.
- Raw credential values were not copied into this report.

## 12. Batch 2 remediation notes

- Date: 2026-05-06.
- Scope implemented: Wave 2 / batch 2 findings A008, A009, A010, A011, A012, A013, and A018.
- WhatsApp authentication boundary: no changes were made to `src/helpers/session.auth.helper.ts`, `src/socket.ts`, `src/config.ts`, or `src/events/connection.event.ts`.
- The self-updater now requires the expected release zip plus a `.sha256` checksum asset, verifies SHA-256 before extraction, rejects unsafe zip entry paths, extracts into a staging directory, and only swaps `dist/` after validation.
- The bot update helper no longer deletes `dist/` before `makeUpdate()` validates the downloaded archive.
- External media URL detection now validates the parsed hostname instead of matching supported domains anywhere in the string.
- Remote media downloads now stream with a configurable byte limit, reject oversized `content-length`, and stop streams that grow past the limit.
- YouTube downloads now keep TLS certificate verification enabled and pass a maximum file size to `yt-dlp`.
- `yt-dlp` setup/deploy paths are pinned to version `2025.12.08` and verify SHA-256 before installing or replacing the local binary.
- Documentation now avoids pipe-to-shell install flows for the project script and documents checksum verification for `yt-dlp`.
- Verification added: `tests/batch2.updater-security.test.ts`, `tests/batch2.download-security.test.ts`, and `tests/batch2.install-verification.test.ts`.

## 13. Batch 3 remediation notes

- Date: 2026-05-06.
- Scope implemented: Wave 3 / batch 3 findings A003, A022, A023, A043, A048, and A049.
- WhatsApp authentication boundary: no changes were made to `src/helpers/session.auth.helper.ts`, `src/socket.ts`, `src/config.ts`, or `src/events/connection.event.ts`.
- Unknown prefixed commands now pass through command-rate limiting before fuzzy correction or AI help, and AI helper suggestions use a separate per-user budget.
- Storage preflight reports now avoid raw project paths, storage filenames, audio names, and audio file paths; generated `storage-preflight*.json` files are ignored by git.
- Command logs now hash user/chat identifiers and redact args, user names, and error text before persistence.
- Contact/newsletter logs now avoid raw names, JIDs, message text, and metadata payloads.
- ASK cache logging now reports hash/length metadata instead of raw question text, and admin cache stats show redacted question references.
- Pre-ready event queue now expires stale entries, coalesces group updates by group id, and enforces `EVENT_QUEUE_MAX_SIZE`.
- Normal and view-once message caches now store scoped keys by chat/participant/message id and fail closed on ambiguous id-only lookups.
- Verification added: `tests/batch3.ai-rate-limit.test.ts`, `tests/batch3.queue-and-cache.test.ts`, `tests/batch3.privacy-redaction.test.ts`, `tests/batch3.ask-cache-logging.test.ts`, and `tests/batch3.storage-preflight.test.ts`.

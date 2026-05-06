import { WASocket } from '@whiskeysockets/baileys'
import { GroupController } from '../controllers/group.controller.js'
import { getCurrentBotVersion } from '../utils/general.util.js'
import { hashForLog } from '../utils/privacy.util.js'
import fs from 'fs'
import path from 'path'

interface VersionInfo {
    lastNotifiedVersion: string
}

export interface PatchNotesNotificationDecision {
    hasPatchNotes: boolean
    groupCount: number
    errorCount: number
}

const VERSION_FILE = path.join(process.cwd(), 'storage', 'last-version.json')
const DEFAULT_PATCH_NOTES_SEND_DELAY_MS = 2000

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractPatchNotesFromChangelog(changelog: string, currentVersion: string): string | null {
    const versionRegex = new RegExp(`^##\\s+v?${escapeRegExp(currentVersion)}(?![\\d.])[^\\n]*\\n`, 'm')
    const match = versionRegex.exec(changelog)

    if (!match) {
        return null
    }

    const contentStart = match.index + match[0].length
    const remainingChangelog = changelog.slice(contentStart)
    const nextVersionMatch = /^##\s+/m.exec(remainingChangelog)
    const contentEnd = nextVersionMatch ? contentStart + nextVersionMatch.index : changelog.length
    const notes = changelog.slice(contentStart, contentEnd).trim()

    return notes || null
}

export function shouldMarkPatchNotesVersionNotified(decision: PatchNotesNotificationDecision) {
    if (!decision.hasPatchNotes) {
        return false
    }

    if (decision.groupCount === 0) {
        return true
    }

    return decision.errorCount === 0
}

function getPatchNotesSendDelayMs() {
    const configuredDelay = Number(process.env.PATCH_NOTES_SEND_DELAY_MS)

    if (Number.isFinite(configuredDelay) && configuredDelay >= 0) {
        return configuredDelay
    }

    return DEFAULT_PATCH_NOTES_SEND_DELAY_MS
}

/**
 * Lê a última versão que teve patch notes enviadas
 */
function getLastNotifiedVersion(): string | null {
    try {
        if (fs.existsSync(VERSION_FILE)) {
            const data = fs.readFileSync(VERSION_FILE, 'utf8')
            const versionInfo: VersionInfo = JSON.parse(data)
            return versionInfo.lastNotifiedVersion
        }
    } catch (err) {
        console.error('[PatchNotes] Erro ao ler última versão:', err)
    }
    return null
}

/**
 * Salva a versão atual como última notificada
 */
function saveLastNotifiedVersion(version: string): void {
    try {
        const versionInfo: VersionInfo = { lastNotifiedVersion: version }
        fs.mkdirSync(path.dirname(VERSION_FILE), { recursive: true })
        fs.writeFileSync(VERSION_FILE, JSON.stringify(versionInfo, null, 2), 'utf8')
        console.log(`[PatchNotes] Versão ${version} salva como última notificada`)
    } catch (err) {
        console.error('[PatchNotes] Erro ao salvar versão:', err)
    }
}

/**
 * Extrai as patch notes da versão atual do CHANGELOG.md
 */
function getCurrentPatchNotes(currentVersion: string): string | null {
    try {
        // Tenta múltiplos caminhos possíveis para o CHANGELOG
        const possiblePaths = [
            path.join(process.cwd(), 'docs', 'releases', 'CHANGELOG.md'),
            path.join(__dirname, '..', '..', 'docs', 'releases', 'CHANGELOG.md'),
            '/root/elisyum-bot/docs/releases/CHANGELOG.md'
        ]
        
        let changelogPath: string | null = null
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath)) {
                changelogPath = testPath
                break
            }
        }
        
        if (!changelogPath) {
            console.error('[PatchNotes] CHANGELOG.md não encontrado. Caminhos testados:', possiblePaths)
            console.error('[PatchNotes] process.cwd():', process.cwd())
            console.error('[PatchNotes] __dirname:', __dirname)
            return null
        }

        console.log('[PatchNotes] CHANGELOG encontrado em:', changelogPath)
        const changelog = fs.readFileSync(changelogPath, 'utf8')
        console.log('[PatchNotes] CHANGELOG lido com sucesso, tamanho:', changelog.length, 'caracteres')
        
        const patchNotes = extractPatchNotesFromChangelog(changelog, currentVersion)
        
        if (patchNotes) {
            console.log('[PatchNotes] ✓ Conteúdo extraído com sucesso')
            return patchNotes
        }
        
        console.log(`[PatchNotes] Patch notes para versão ${currentVersion} não encontradas no CHANGELOG`)
        return null
    } catch (err) {
        console.error('[PatchNotes] Erro ao ler CHANGELOG:', err)
        return null
    }
}

/**
 * Formata as patch notes para WhatsApp
 */
function formatPatchNotes(version: string, notes: string): string {
    return `🤖 *ELISYUM BOT - Atualização v${version}*\n\n${notes}\n\n_Mensagem automática de atualização_`
}

/**
 * Verifica se há uma nova versão e envia patch notes para todos os grupos
 */
export async function checkAndNotifyPatchNotes(client: WASocket): Promise<void> {
    try {
        const currentVersion = getCurrentBotVersion()
        
        if (!currentVersion) {
            console.error('[PatchNotes] Versão do bot não encontrada')
            return
        }

        const lastNotifiedVersion = getLastNotifiedVersion()

        // Se já notificamos essa versão, não faz nada
        if (lastNotifiedVersion === currentVersion) {
            console.log(`[PatchNotes] Versão ${currentVersion} já foi notificada anteriormente`)
            return
        }

        console.log(`[PatchNotes] Nova versão detectada: ${currentVersion} (última: ${lastNotifiedVersion || 'nenhuma'})`)

        // Busca as patch notes da versão atual
        const patchNotes = getCurrentPatchNotes(currentVersion)
        
        if (!patchNotes) {
            console.log('[PatchNotes] Nenhuma patch note encontrada para esta versão')
            return
        }

        // Formata a mensagem
        const message = formatPatchNotes(currentVersion, patchNotes)

        // Busca todos os grupos
        const groupController = new GroupController()
        const allGroups = await groupController.getAllGroups()

        if (!allGroups || allGroups.length === 0) {
            console.log('[PatchNotes] Nenhum grupo encontrado')
            if (shouldMarkPatchNotesVersionNotified({ hasPatchNotes: true, groupCount: 0, errorCount: 0 })) {
                saveLastNotifiedVersion(currentVersion)
            }
            return
        }

        console.log(`[PatchNotes] Enviando patch notes para ${allGroups.length} grupos...`)

        let successCount = 0
        let errorCount = 0
        const sendDelayMs = getPatchNotesSendDelayMs()

        // Envia a mensagem em cada grupo
        for (const group of allGroups) {
            try {
                console.log(`[PatchNotes] Tentando enviar para grupo ${hashForLog(group.id)}`)
                
                // Envia a mensagem
                await client.sendMessage(group.id, { 
                    text: message 
                })

                console.log(`[PatchNotes] Enviado para grupo ${hashForLog(group.id)}`)
                successCount++

                // Aguarda 2 segundos entre cada grupo para evitar spam
                if (sendDelayMs > 0) {
                    await new Promise(resolve => setTimeout(resolve, sendDelayMs))
                }

            } catch (err) {
                console.error(`[PatchNotes] Erro ao enviar para grupo ${hashForLog(group.id)}:`, err)
                errorCount++
            }
        }

        console.log(`[PatchNotes] Conclusão: ${successCount} sucessos, ${errorCount} erros`)

        if (shouldMarkPatchNotesVersionNotified({ hasPatchNotes: true, groupCount: allGroups.length, errorCount })) {
            saveLastNotifiedVersion(currentVersion)
        } else {
            console.warn(`[PatchNotes] Versão ${currentVersion} não será marcada como notificada; grupos com erro serão tentados novamente`)
        }

    } catch (err) {
        console.error('[PatchNotes] Erro geral:', err)
    }
}

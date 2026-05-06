import { createHash } from 'node:crypto'
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync, chmodSync, readFileSync } from 'node:fs'
import https from 'node:https'
import { platform } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..', '..')
const binDir = join(projectRoot, 'bin')

const isWindows = platform() === 'win32'
const fileName = isWindows ? 'yt-dlp.exe' : 'yt-dlp'
const ytDlpPath = join(binDir, fileName)
const tmpPath = `${ytDlpPath}.tmp`

const YTDLP_VERSION = process.env.YTDLP_VERSION || '2025.12.08'
const DEFAULT_YTDLP_SHA256 = isWindows
    ? '86c3280caa696b567c917ac138bbe0d17e45dc2b329f67562302ee4c3973a06f'
    : 'aed043cabf6b352dfd5438afff595e31532538d5af7c8f4f95ced1e6f1b35c2a'
const YTDLP_SHA256 = process.env.YTDLP_SHA256 || DEFAULT_YTDLP_SHA256
const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/download/${YTDLP_VERSION}/${fileName}`

function sha256File(filePath) {
    return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function requireChecksum() {
    if (!YTDLP_SHA256) {
        console.error('Defina YTDLP_SHA256 para instalar yt-dlp nesta plataforma.')
        process.exit(1)
    }
}

function downloadFile(url, destination) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, response => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                response.resume()
                downloadFile(response.headers.location, destination).then(resolve, reject)
                return
            }

            if (response.statusCode !== 200) {
                response.resume()
                reject(new Error(`Download falhou com status HTTP ${response.statusCode}`))
                return
            }

            const output = createWriteStream(destination, { mode: 0o755 })
            response.pipe(output)
            output.on('finish', () => output.close(resolve))
            output.on('error', reject)
        })

        request.setTimeout(60000, () => {
            request.destroy(new Error('Download timeout'))
        })
        request.on('error', reject)
    })
}

function verifyChecksum(filePath) {
    const actualChecksum = sha256File(filePath)

    if (actualChecksum !== YTDLP_SHA256.toLowerCase()) {
        throw new Error(`Checksum do yt-dlp invalido: esperado ${YTDLP_SHA256}, obtido ${actualChecksum}`)
    }
}

requireChecksum()

if (!existsSync(binDir)) {
    mkdirSync(binDir, { recursive: true })
}

if (existsSync(ytDlpPath)) {
    try {
        verifyChecksum(ytDlpPath)
        console.log('✓ yt-dlp ja esta instalado e verificado em:', ytDlpPath)
        process.exit(0)
    } catch {
        console.warn('yt-dlp existente nao bate com o checksum fixado. Reinstalando...')
    }
}

console.log(`Baixando yt-dlp ${YTDLP_VERSION}...`)

try {
    rmSync(tmpPath, { force: true })
    await downloadFile(downloadUrl, tmpPath)
    verifyChecksum(tmpPath)

    if (!isWindows) {
        chmodSync(tmpPath, 0o755)
    }

    renameSync(tmpPath, ytDlpPath)
    console.log('✓ yt-dlp baixado e verificado em:', ytDlpPath)
} catch (err) {
    rmSync(tmpPath, { force: true })
    console.error('Erro ao baixar yt-dlp:', err.message)
    process.exit(1)
}

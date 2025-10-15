import { spawn } from 'node:child_process'

let ffmpegPathPromise: Promise<string> | undefined

async function resolveFfmpegPath(): Promise<string> {
    if (!ffmpegPathPromise) {
        ffmpegPathPromise = (async () => {
            try {
                const installer = await import('@ffmpeg-installer/ffmpeg') as { path?: string }
                if (installer?.path) {
                    return installer.path
                }
            } catch (_) {
                // Optional dependency may be missing on some platforms.
            }

            return 'ffmpeg'
        })()
    }

    return ffmpegPathPromise
}

export async function runFfmpeg(args: string[]): Promise<void> {
    const binary = await resolveFfmpegPath()

    await new Promise<void>((resolve, reject) => {
        const child = spawn(binary, args, { stdio: ['ignore', 'ignore', 'pipe'] })
        let stderr = ''

        child.stderr?.on('data', (data: Buffer) => {
            stderr += data.toString()
        })

        child.on('error', (err) => {
            reject(err)
        })

        child.on('close', (code) => {
            if (code === 0) {
                resolve()
            } else {
                const errorMessage = stderr.trim()
                reject(new Error(`ffmpeg exited with code ${code}${errorMessage ? `: ${errorMessage}` : ''}`))
            }
        })
    })
}

export async function warmupFfmpeg(): Promise<void> {
    await resolveFfmpegPath()
}

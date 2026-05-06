import crypto from 'node:crypto'

export function hashForLog(value?: string | null) {
    if (!value) {
        return null
    }

    const hash = crypto.createHash('sha256').update(value).digest('hex')
    return `sha256:${hash.slice(0, 16)}`
}

export function redactText(value?: string | null) {
    if (!value) {
        return null
    }

    const hash = hashForLog(value)
    return `[redacted len=${value.length} hash=${hash}]`
}

export function safeCount(value?: string | null) {
    return typeof value === 'string' ? value.length : 0
}

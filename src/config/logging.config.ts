const CONTEXT_DEBUG_ENV_KEYS = [
    "WHATSAPP_CONTEXT_DEBUG",
    "DEBUG_WHATSAPP_CONTEXT"
] as const

let overrideValue: boolean | null = null

function normalizeBoolean(value: string | undefined): boolean | null {
    if (value == null) {
        return null
    }

    const normalized = value.trim().toLowerCase()

    if (["1", "true", "yes", "on"].includes(normalized)) {
        return true
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
        return false
    }

    return null
}

export function isWhatsappContextDebugEnabled(): boolean {
    if (overrideValue !== null) {
        return overrideValue
    }

    for (const key of CONTEXT_DEBUG_ENV_KEYS) {
        const parsed = normalizeBoolean(process.env[key])

        if (parsed !== null) {
            return parsed
        }
    }

    return false
}

/**
 * Allows tests (or tooling) to override the runtime flag without mutating process.env.
 */
export function setWhatsappContextDebugOverride(value: boolean | null) {
    overrideValue = value
}

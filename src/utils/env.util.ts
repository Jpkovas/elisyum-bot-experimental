export function getRequiredEnv(name: string){
    const value = process.env[name]?.trim()

    if (!value) {
        throw new Error(`${name} is not configured`)
    }

    return value
}

export function getEnvList(name: string){
    return process.env[name]
        ?.split(',')
        .map(value => value.trim())
        .filter(Boolean) || []
}

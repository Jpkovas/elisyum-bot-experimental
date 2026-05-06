import { expect, test } from "bun:test"

test("storage preflight output avoids raw local paths and audio names", async () => {
    const output = await Bun.$`bun scripts/storage-preflight.ts`.text()
    const report = JSON.parse(output)
    const serialized = JSON.stringify(report)

    expect(report.projectRoot).toBeUndefined()
    expect(report.storage?.files).toBeUndefined()
    expect(report.audios?.fileSamples).toBeUndefined()
    expect(report.audios?.rowSamples?.some((row: Record<string, unknown>) => "audioName" in row || "filePath" in row)).toBe(false)
    expect(report.audios?.brokenRefSamples?.some((row: Record<string, unknown>) => "audioName" in row || "filePath" in row)).toBe(false)
    expect(serialized).not.toContain(process.cwd())
    expect(serialized).not.toContain("/storage/audios/")
})

test("generated storage preflight reports are ignored by git", async () => {
    const gitignore = await Bun.file(new URL("../.gitignore", import.meta.url)).text()

    expect(gitignore).toContain("storage-preflight*.json")
})

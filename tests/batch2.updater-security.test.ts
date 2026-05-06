import { beforeEach, expect, mock, test } from "bun:test"
import AdmZip from "adm-zip"
import crypto from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

let axiosGetImpl: (url: string, config?: any) => Promise<any> = async () => {
    throw new Error("unexpected axios call")
}

const axiosGetMock = mock((url: string, config?: any) => axiosGetImpl(url, config))

mock.module("axios", () => ({
    default: { get: axiosGetMock },
    get: axiosGetMock,
}))

const { makeUpdate } = await import("../src/utils/updater.util.ts")

function makeZip(entries: Record<string, string>) {
    const zip = new AdmZip()

    for (const [entryName, content] of Object.entries(entries)) {
        zip.addFile(entryName, Buffer.from(content))
    }

    return zip.toBuffer()
}

function makeRawStoredZip(entryName: string, content: string) {
    const nameBuffer = Buffer.from(entryName)
    const dataBuffer = Buffer.from(content)
    const localHeader = Buffer.alloc(30 + nameBuffer.length + dataBuffer.length)

    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt32LE(0, 14)
    localHeader.writeUInt32LE(dataBuffer.length, 18)
    localHeader.writeUInt32LE(dataBuffer.length, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    nameBuffer.copy(localHeader, 30)
    dataBuffer.copy(localHeader, 30 + nameBuffer.length)

    const centralDirectory = Buffer.alloc(46 + nameBuffer.length)
    centralDirectory.writeUInt32LE(0x02014b50, 0)
    centralDirectory.writeUInt16LE(20, 4)
    centralDirectory.writeUInt16LE(20, 6)
    centralDirectory.writeUInt16LE(0, 8)
    centralDirectory.writeUInt16LE(0, 10)
    centralDirectory.writeUInt32LE(0, 16)
    centralDirectory.writeUInt32LE(dataBuffer.length, 20)
    centralDirectory.writeUInt32LE(dataBuffer.length, 24)
    centralDirectory.writeUInt16LE(nameBuffer.length, 28)
    centralDirectory.writeUInt32LE(0, 42)
    nameBuffer.copy(centralDirectory, 46)

    const eocd = Buffer.alloc(22)
    eocd.writeUInt32LE(0x06054b50, 0)
    eocd.writeUInt16LE(1, 8)
    eocd.writeUInt16LE(1, 10)
    eocd.writeUInt32LE(centralDirectory.length, 12)
    eocd.writeUInt32LE(localHeader.length, 16)

    return Buffer.concat([localHeader, centralDirectory, eocd])
}

function sha256(buffer: Buffer) {
    return crypto.createHash("sha256").update(buffer).digest("hex")
}

function mockLatestRelease(zipBuffer: Buffer, checksum: string, assetName = "LBOT-v3.5.1.zip") {
    axiosGetImpl = async (url: string) => {
        if (url.includes("/releases/latest")) {
            return {
                data: {
                    tag_name: "3.5.1",
                    assets: [
                        { name: assetName, browser_download_url: "https://example.test/release.zip" },
                        { name: `${assetName}.sha256`, browser_download_url: "https://example.test/release.zip.sha256" },
                    ],
                },
            }
        }

        if (url.endsWith(".sha256")) {
            return { data: `${checksum}  ${assetName}\n` }
        }

        if (url.endsWith(".zip")) {
            return { data: zipBuffer }
        }

        throw new Error(`unexpected url ${url}`)
    }
}

beforeEach(() => {
    axiosGetMock.mockClear()
})

test("makeUpdate refuses checksum mismatches and keeps existing dist intact", async () => {
    const appDir = mkdtempSync(path.join(tmpdir(), "elisyum-update-"))
    const distDir = path.join(appDir, "dist")
    mkdirSync(distDir, { recursive: true })
    writeFileSync(path.join(distDir, "app.js"), "old")
    mockLatestRelease(makeZip({ "dist/app.js": "new" }), "0".repeat(64))

    try {
        await expect(makeUpdate(appDir)).rejects.toThrow(/checksum|sha256/i)
        expect(readFileSync(path.join(distDir, "app.js"), "utf8")).toBe("old")
    } finally {
        rmSync(appDir, { recursive: true, force: true })
    }
})

test("makeUpdate rejects zip-slip entries before replacing dist", async () => {
    const appDir = mkdtempSync(path.join(tmpdir(), "elisyum-update-"))
    const distDir = path.join(appDir, "dist")
    const zipBuffer = makeRawStoredZip("../evil.txt", "owned")
    mkdirSync(distDir, { recursive: true })
    writeFileSync(path.join(distDir, "app.js"), "old")
    mockLatestRelease(zipBuffer, sha256(zipBuffer))

    try {
        await expect(makeUpdate(appDir)).rejects.toThrow(/zip|path|archive|fora/i)
        expect(readFileSync(path.join(distDir, "app.js"), "utf8")).toBe("old")
        expect(existsSync(path.join(appDir, "..", "evil.txt"))).toBe(false)
    } finally {
        rmSync(appDir, { recursive: true, force: true })
    }
})

test("makeUpdate verifies checksum, extracts to staging, and then replaces dist", async () => {
    const appDir = mkdtempSync(path.join(tmpdir(), "elisyum-update-"))
    const distDir = path.join(appDir, "dist")
    const zipBuffer = makeZip({ "dist/app.js": "new", "package.json": "{\"version\":\"3.5.1\"}" })
    mkdirSync(distDir, { recursive: true })
    writeFileSync(path.join(distDir, "app.js"), "old")
    mockLatestRelease(zipBuffer, sha256(zipBuffer))

    try {
        await makeUpdate(appDir)
        expect(readFileSync(path.join(distDir, "app.js"), "utf8")).toBe("new")
        expect(readFileSync(path.join(appDir, "package.json"), "utf8")).toBe("{\"version\":\"3.5.1\"}")
    } finally {
        rmSync(appDir, { recursive: true, force: true })
    }
})

test("bot updater no longer removes dist before makeUpdate validates the archive", async () => {
    const source = await Bun.file(new URL("../src/helpers/bot.updater.helper.ts", import.meta.url)).text()

    expect(source).not.toContain("removeSync('./dist')")
    expect(source).not.toContain('removeSync("./dist")')
})

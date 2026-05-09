import { expect, test } from "bun:test"
import { buildSafeStickerMediaUrl, normalizeFileLength, validateStickerMedia } from "../src/commands/sticker.functions.commands.ts"

test("sticker media validation accepts videos when optional duration metadata is absent", () => {
    expect(() => validateStickerMedia("videoMessage", undefined, 1024)).not.toThrow()
})

test("sticker media validation rejects oversized media before download", () => {
    expect(() => validateStickerMedia("imageMessage", undefined, 10 * 1024 * 1024 + 1)).toThrow(/10MB|segundos/)
})

test("sticker file length normalization supports Long-like values", () => {
    expect(normalizeFileLength({ toNumber: () => 4096 } as Long)).toBe(4096)
})

test("safe sticker media URL rejects host-smuggling direct paths", () => {
    expect(() => buildSafeStickerMediaUrl("//evil.test/media")).toThrow(/stickers/)
    expect(() => buildSafeStickerMediaUrl("/safe/../escape")).toThrow(/stickers/)
})

test("safe sticker media URL pins valid paths to the WhatsApp media host", () => {
    expect(buildSafeStickerMediaUrl("/v/t62.15575-24/file.enc?ccb=11-4")).toBe("https://mmg.whatsapp.net/v/t62.15575-24/file.enc?ccb=11-4")
})

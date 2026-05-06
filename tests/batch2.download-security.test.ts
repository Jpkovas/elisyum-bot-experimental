import { beforeEach, expect, mock, test } from "bun:test"
import { Readable } from "node:stream"

let axiosGetImpl: (url: string, config?: any) => Promise<any> = async () => {
    throw new Error("unexpected axios.get")
}

const axiosGetMock = mock((url: string, config?: any) => axiosGetImpl(url, config))
const axiosHeadMock = mock(async () => ({ headers: {} }))

mock.module("axios", () => ({
    default: {
        get: axiosGetMock,
        head: axiosHeadMock,
    },
    get: axiosGetMock,
    head: axiosHeadMock,
}))

const { detectPlatform, getFirstSupportedDownloadUrl } = await import("../src/utils/general.util.ts")
const { downloadFromUrl, xMedia } = await import("../src/utils/download.util.ts")

beforeEach(() => {
    axiosGetMock.mockClear()
    axiosHeadMock.mockClear()
})

test("platform detection requires real supported hostnames", () => {
    expect(detectPlatform("https://youtube.com.evil/watch?v=abc")).toBe("unknown")
    expect(detectPlatform("https://notinstagram.com/p/abc")).toBe("unknown")
    expect(detectPlatform("https://safe.example/?next=https://x.com/post")).toBe("unknown")
    expect(detectPlatform("https://youtu.be/abc")).toBe("youtube")
    expect(detectPlatform("https://www.instagram.com/p/abc")).toBe("instagram")
    expect(detectPlatform("https://fb.watch/abc")).toBe("facebook")
    expect(detectPlatform("https://vt.tiktok.com/abc")).toBe("tiktok")
    expect(detectPlatform("https://x.com/user/status/1")).toBe("twitter")
})

test("auto-download URL selection ignores supported-domain substrings on attacker hosts", () => {
    expect(getFirstSupportedDownloadUrl("https://youtube.com.evil/watch?v=abc")).toBeNull()
    expect(getFirstSupportedDownloadUrl("look https://safe.example/?u=https://instagram.com/p/abc")).toBeNull()
    expect(getFirstSupportedDownloadUrl("look https://www.youtube.com/watch?v=abc")).toBe("https://www.youtube.com/watch?v=abc")
})

test("xMedia maps only validated Twitter/X hosts to the vxtwitter API host", async () => {
    let requestedUrl = ""
    axiosGetImpl = async (url: string) => {
        requestedUrl = url
        return {
            data: {
                text: "post",
                media_extended: [{ type: "video", url: "https://video.example/media.mp4" }],
            },
        }
    }

    const result = await xMedia("https://x.com/user/status/1?lang=pt")

    expect(requestedUrl).toBe("https://api.vxtwitter.com/user/status/1?lang=pt")
    expect(result?.media[0].url).toBe("https://video.example/media.mp4")
    await expect(xMedia("https://x.com.evil/user/status/1")).rejects.toThrow("Houve um erro interno")
})

test("downloadFromUrl rejects content-length over the configured limit before buffering", async () => {
    axiosGetImpl = async () => ({
        headers: { "content-length": "10" },
        data: Readable.from(["0123456789"]),
    })

    await expect(downloadFromUrl("https://cdn.example/file.mp4", undefined, { maxBytes: 5 })).rejects.toThrow(/limite|excede|bytes/i)
})

test("downloadFromUrl rejects streams that grow beyond the configured limit", async () => {
    axiosGetImpl = async () => ({
        headers: {},
        data: Readable.from(["0123", "456"]),
    })

    await expect(downloadFromUrl("https://cdn.example/file.mp4", undefined, { maxBytes: 6 })).rejects.toThrow(/limite|excede|bytes/i)
})

test("YouTube downloader keeps TLS verification enabled and enforces a max filesize", async () => {
    const source = await Bun.file(new URL("../src/utils/download.util.ts", import.meta.url)).text()

    expect(source).not.toContain("--no-check-certificate")
    expect(source).toContain("--max-filesize")
})

import { expect, mock, test } from "bun:test"

const axiosGetMock = mock(async (url: string) => {
    if (url.startsWith("https://translate.google.com/translate_tts")) {
        return { data: new Uint8Array([1, 2, 3]).buffer }
    }

    if (url.startsWith("https://duckduckgo.com/?")) {
        return { data: 'window.__DDG={"vqd":"token-123"};' }
    }

    if (url.startsWith("https://duckduckgo.com/i.js")) {
        return {
            data: {
                results: [{
                    height: 480,
                    image: "https://images.example/result.jpg",
                    source: "Example Images",
                    thumbnail: "https://images.example/thumb.jpg",
                    title: "Example result",
                    url: "https://origin.example/page",
                    width: 640,
                }],
            },
        }
    }

    if (url.startsWith("https://news.google.com/rss")) {
        return {
            data: [
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
                "<rss><channel><item>",
                "<title>Noticia exemplo</title>",
                "<pubDate>Wed, 06 May 2026 12:00:00 GMT</pubDate>",
                "<source>Fonte exemplo</source>",
                "<link>https://news.example/item</link>",
                "</item></channel></rss>",
            ].join(""),
        }
    }

    throw new Error(`Unexpected GET ${url}`)
})

const axiosPostMock = mock(async () => ({
    data: {
        files: [{
            url: "https://uguu.se/example.png",
        }],
    },
}))

mock.module("axios", () => ({
    default: {
        get: axiosGetMock,
        post: axiosPostMock,
        request: mock(),
    },
    get: axiosGetMock,
    post: axiosPostMock,
    request: mock(),
}))

const { textToVoice } = await import("../src/utils/audio.util.ts")
const { uploadImage, imageSearchGoogle } = await import("../src/utils/image.util.ts")
const { newsGoogle } = await import("../src/utils/misc.util.ts")

test("text to voice fetches Google TTS audio without node-gtts", async () => {
    const audio = await textToVoice("pt", "olá mundo")

    expect(Buffer.isBuffer(audio)).toBe(true)
    expect([...audio]).toEqual([1, 2, 3])
})

test("image upload posts multipart data and returns the uploaded URL", async () => {
    const url = await uploadImage(Buffer.from([1, 2, 3]))

    expect(url).toBe("https://uguu.se/example.png")
    expect(axiosPostMock).toHaveBeenCalled()
})

test("image search maps DuckDuckGo image results into the existing image contract", async () => {
    const images = await imageSearchGoogle("teste")

    expect(images).toHaveLength(1)
    expect(images[0].url).toBe("https://images.example/result.jpg")
    expect(images[0].preview.url).toBe("https://images.example/thumb.jpg")
    expect(images[0].origin.website.domain).toBe("origin.example")
})

test("news search maps Google News RSS entries into the existing news contract", async () => {
    const news = await newsGoogle("pt")

    expect(news).toEqual([{
        title: "Noticia exemplo",
        published: "Wed, 06 May 2026 12:00:00 GMT",
        author: "Fonte exemplo",
        url: "https://news.example/item",
    }])
})

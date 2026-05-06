import { afterAll, beforeEach, expect, mock, test } from "bun:test"

let axiosGetImpl: (...args: any[]) => Promise<any> = async () => {
    throw new Error("unexpected axios.get call")
}
let axiosRequestImpl: (...args: any[]) => Promise<any> = async () => {
    throw new Error("unexpected axios.request call")
}

const axiosGetMock = mock((...args: any[]) => axiosGetImpl(...args))
const axiosRequestMock = mock((...args: any[]) => axiosRequestImpl(...args))
const axiosPostMock = mock(async () => ({ data: {} }))
const createClientMock = mock((key: string) => ({
    listen: {
        prerecorded: {
            transcribeFile: mock(async () => ({
                result: {
                    results: {
                        channels: [
                            {
                                alternatives: [
                                    { transcript: `transcript:${key}` },
                                ],
                            },
                        ],
                    },
                },
                error: null,
            })),
        },
    },
}))

mock.module("axios", () => ({
    default: {
        get: axiosGetMock,
        post: axiosPostMock,
        request: axiosRequestMock,
    },
    get: axiosGetMock,
    post: axiosPostMock,
    request: axiosRequestMock,
}))

mock.module("@deepgram/sdk", () => ({
    createClient: createClientMock,
}))

mock.module("file-type", () => ({
    fileTypeFromBuffer: mock(async () => ({ mime: "audio/mpeg", ext: "mp3" })),
}))

mock.module("../src/utils/convert.util.js", () => ({
    convertMp4ToMp3: mock(async (_source: string, buffer: Buffer) => buffer),
}))

mock.module("../src/utils/general.util.js", () => ({
    getTempPath: () => "/tmp/elisyum-test.mp3",
    showConsoleLibraryError: mock(() => undefined),
    timestampToDate: (value: number) => new Date(value).toISOString(),
}))

const { moviedbTrendings, wheatherInfo } = await import("../src/utils/misc.util.ts")
const { audioTranscription, musicRecognition } = await import("../src/utils/audio.util.ts")

afterAll(() => {
    mock.restore()
})

beforeEach(() => {
    delete process.env.TMDB_API_KEY
    delete process.env.WEATHER_API_KEY
    delete process.env.DEEPGRAM_API_KEY
    delete process.env.DEEPGRAM_API_KEYS
    delete process.env.ACRCLOUD_HOST
    delete process.env.ACRCLOUD_ACCESS_KEY
    delete process.env.ACRCLOUD_SECRET_KEY

    axiosGetImpl = async () => {
        throw new Error("unexpected axios.get call")
    }
    axiosRequestImpl = async () => {
        throw new Error("unexpected axios.request call")
    }

    axiosGetMock.mockClear()
    axiosRequestMock.mockClear()
    axiosPostMock.mockClear()
    createClientMock.mockClear()
})

test("movie trending requests use the TMDB key from environment, not source code", async () => {
    process.env.TMDB_API_KEY = "tmdb-from-env"
    let requestedUrl = ""
    axiosGetImpl = async (url: string) => {
        requestedUrl = url
        return { data: { results: [{ title: "Movie", name: "", overview: "Overview" }] } }
    }

    const result = await moviedbTrendings("movie")

    expect(requestedUrl).toContain("api_key=tmdb-from-env")
    expect(result).toContain("Movie")
})

test("movie trending requests fail closed when TMDB_API_KEY is missing", async () => {
    await expect(moviedbTrendings("movie")).rejects.toThrow("Houve um erro interno")

    expect(axiosGetMock).not.toHaveBeenCalled()
})

test("weather requests use HTTPS and the Weather API key from environment", async () => {
    process.env.WEATHER_API_KEY = "weather-from-env"
    const requestedUrls: string[] = []
    axiosGetImpl = async (url: string) => {
        requestedUrls.push(url)
        if (url.includes("conditions.json")) {
            return { data: [{ code: 1000, languages: [{ lang_iso: "pt", day_text: "Sol", night_text: "Limpo" }] }] }
        }

        return {
            data: {
                location: { name: "Sao Paulo", region: "SP", country: "Brazil", localtime_epoch: 1 },
                current: {
                    condition: { code: 1000 },
                    is_day: 1,
                    last_updated_epoch: 1,
                    temp_c: 25,
                    feelslike_c: 25,
                    wind_kph: 5,
                    humidity: 50,
                    cloud: 10,
                },
                forecast: {
                    forecastday: [
                        {
                            date: "2026-05-06",
                            day: {
                                condition: { code: 1000 },
                                maxtemp_c: 26,
                                mintemp_c: 20,
                                avgtemp_c: 23,
                                maxwind_kph: 8,
                                daily_will_it_rain: 0,
                                daily_chance_of_rain: 10,
                                daily_will_it_snow: 0,
                                daily_chance_of_snow: 0,
                                uv: 5,
                            },
                        },
                    ],
                },
            },
        }
    }

    await wheatherInfo("Sao Paulo")

    expect(requestedUrls[0].startsWith("https://api.weatherapi.com/")).toBe(true)
    expect(requestedUrls[0]).toContain("key=weather-from-env")
})

test("audio transcription loads Deepgram keys from environment without fetching public key bundles", async () => {
    process.env.DEEPGRAM_API_KEYS = "dg-one,dg-two"

    const transcript = await audioTranscription(Buffer.from("audio"))

    expect(transcript).toBe("transcript:dg-one")
    expect(createClientMock).toHaveBeenCalledWith("dg-one")
    expect(axiosGetMock).not.toHaveBeenCalledWith("https://dub.sh/lbot-api-keys", expect.anything())
})

test("music recognition posts to HTTPS ACRCloud host from environment", async () => {
    process.env.ACRCLOUD_HOST = "identify-eu-west-1.acrcloud.com"
    process.env.ACRCLOUD_ACCESS_KEY = "acr-access"
    process.env.ACRCLOUD_SECRET_KEY = "acr-secret"
    let requestConfig: any
    axiosRequestImpl = async (config: any) => {
        requestConfig = config
        return { data: { status: { code: 1001 } } }
    }

    const result = await musicRecognition(Buffer.from("audio"))

    expect(result).toBeNull()
    expect(requestConfig.url).toBe("https://identify-eu-west-1.acrcloud.com/v1/identify")
    expect(axiosGetMock).not.toHaveBeenCalledWith("https://dub.sh/lbot-api-keys", expect.anything())
})

test("music recognition rejects untrusted ACRCloud hosts before upload", async () => {
    process.env.ACRCLOUD_HOST = "attacker.example.com"
    process.env.ACRCLOUD_ACCESS_KEY = "acr-access"
    process.env.ACRCLOUD_SECRET_KEY = "acr-secret"

    await expect(musicRecognition(Buffer.from("audio"))).rejects.toThrow("Houve um erro interno")

    expect(axiosRequestMock).not.toHaveBeenCalled()
})

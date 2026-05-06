import { afterEach, beforeEach, expect, mock, test } from "bun:test"

const logs: string[] = []
const originalConsoleLog = console.log

const askCacheGetMock = mock(() => undefined)
const askCacheSetMock = mock(() => undefined)

mock.module("../src/database/db.js", () => ({
    askCacheDb: {
        get: askCacheGetMock,
        set: askCacheSetMock,
        cleanOld: mock(() => 0),
        enforceLimit: mock(() => 0),
        stats: mock(() => ({ total: 0, topQuestions: [] })),
    },
}))

const { getCachedAnswer, setCachedAnswer } = await import("../src/helpers/ask.cache.helper.ts")

beforeEach(() => {
    logs.length = 0
    askCacheGetMock.mockClear()
    askCacheSetMock.mockClear()
    console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "))
    }
})

afterEach(() => {
    console.log = originalConsoleLog
})

test("ask cache hit/miss/save logs never include raw question text", async () => {
    const secretQuestion = "qual comando usa o segredo ultra-secreto 123"

    await getCachedAnswer(secretQuestion, false, false)
    setCachedAnswer(secretQuestion, "answer", false, false)

    const output = logs.join("\n")
    expect(output).not.toContain(secretQuestion)
    expect(output).not.toContain("ultra-secreto")
    expect(output).toContain("hash=")
})

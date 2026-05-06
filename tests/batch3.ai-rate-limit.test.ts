import { beforeEach, expect, mock, test } from "bun:test"

let commandRateLimited = false
let aiHelpLimited = false

const commandRateLimitMock = mock(async () => commandRateLimited)
const aiHelpLimitMock = mock(async () => aiHelpLimited)
const askGeminiMock = mock(async () => "ai help")
const replyTextMock = mock(async () => undefined)
const findSimilarCommandMock = mock(() => null)

mock.module("../src/utils/commands.util.js", () => ({
    commandExist: () => false,
}))

mock.module("../src/utils/whatsapp.util.js", () => ({
    removePrefix: (prefix: string, command: string) => command.startsWith(prefix) ? command.slice(prefix.length) : command,
    replyText: replyTextMock,
}))

mock.module("../src/helpers/command.fuzzy.helper.js", () => ({
    findSimilarCommand: findSimilarCommandMock,
}))

mock.module("../src/utils/ai.util.js", () => ({
    askGemini: askGeminiMock,
}))

mock.module("../src/helpers/message.procedures.helper.js", () => ({
    isUserBlocked: mock(async () => false),
    updateUserName: mock(async () => undefined),
    isOwnerRegister: mock(async () => false),
    isIgnoredByPvAllowed: mock(() => false),
    readUserMessage: mock(async () => undefined),
    isUserLimitedByCommandRate: commandRateLimitMock,
    isUserLimitedByAiHelp: aiHelpLimitMock,
    isCommandBlockedGlobally: mock(async () => false),
    incrementUserCommandsCount: mock(async () => undefined),
    incrementBotCommandsCount: mock(() => undefined),
    incrementGroupCommandsCount: mock(async () => undefined),
    incrementParticipantActivity: mock(async () => undefined),
    deleteMessageIfMutedMember: mock(async () => false),
    isBotLimitedByGroupRestricted: mock(async () => false),
    isDetectedByAntiLink: mock(async () => false),
    isDetectedByWordFilter: mock(async () => false),
    isDetectedByAntiFlood: mock(async () => false),
    isIgnoredByGroupMuted: mock(() => false),
    autoReply: mock(async () => false),
    isCommandBlockedGroup: mock(async () => false),
}))

mock.module("../src/helpers/bot.texts.helper.js", () => ({
    default: {
        unknown_command: "unknown {$1}",
    },
}))

const { handlePrivateMessage, handleGroupMessage } = await import("../src/helpers/message.handler.helper.ts")

const botInfo = {
    prefix: "!",
    command_rate: { status: true, max_cmds_minute: 5, block_time: 60 },
} as any

function makeMessage(overrides: Record<string, unknown> = {}) {
    return {
        type: "conversation",
        command: "!doesnotexist",
        args: [],
        text_command: "",
        body: "!doesnotexist",
        caption: "",
        sender: "5511999999999@s.whatsapp.net",
        chat_id: "5511999999999@s.whatsapp.net",
        pushname: "Private User",
        isBotOwner: false,
        isBotMessage: false,
        isGroupAdmin: false,
        wa_message: {},
        ...overrides,
    } as any
}

beforeEach(() => {
    commandRateLimited = false
    aiHelpLimited = false
    commandRateLimitMock.mockClear()
    aiHelpLimitMock.mockClear()
    askGeminiMock.mockClear()
    replyTextMock.mockClear()
    findSimilarCommandMock.mockClear()
})

test("unknown private commands run through command-rate limiting before fuzzy or AI help", async () => {
    commandRateLimited = true

    const result = await handlePrivateMessage({} as any, botInfo, makeMessage())

    expect(result).toBe(false)
    expect(commandRateLimitMock).toHaveBeenCalled()
    expect(findSimilarCommandMock).not.toHaveBeenCalled()
    expect(aiHelpLimitMock).not.toHaveBeenCalled()
    expect(askGeminiMock).not.toHaveBeenCalled()
})

test("unknown group commands use a separate AI-help budget before calling Gemini", async () => {
    aiHelpLimited = true

    const result = await handleGroupMessage(
        {} as any,
        { id: "120363@g.us", autosticker: false, muted: false, restricted: false } as any,
        botInfo,
        makeMessage({ chat_id: "120363@g.us", isGroupMsg: true }),
    )

    expect(result).toBe(false)
    expect(commandRateLimitMock).toHaveBeenCalled()
    expect(aiHelpLimitMock).toHaveBeenCalled()
    expect(askGeminiMock).not.toHaveBeenCalled()
})

import { afterAll, beforeEach, expect, mock, test } from "bun:test"

let users: Array<{ owner?: boolean }> = []

const registerOwnerMock = mock(async () => undefined)
const replyTextMock = mock(async () => undefined)
const infoTelemetryCommandMock = mock(async () => undefined)
const logCommandMock = mock(() => undefined)
const getUserLogsMock = mock(() => [])

mock.module("../src/controllers/user.controller.js", () => ({
    UserController: class {
        getUsers() {
            return Promise.resolve(users)
        }

        registerOwner(userId: string, ...alternateIds: (string | undefined)[]) {
            return registerOwnerMock(userId, ...alternateIds)
        }

        getHelpLevel() {
            return Promise.resolve("simple")
        }
    }
}))

mock.module("../src/controllers/group.controller.js", () => ({
    GroupController: class {}
}))

mock.module("../src/controllers/bot.controller.js", () => ({
    BotController: class {
        getBot() {
            return { prefix: "!" }
        }

        incrementExecutedCommands() {}
    }
}))

mock.module("../src/database/db.js", () => ({
    logsDb: {
        log: logCommandMock,
        getUserLogs: getUserLogsMock,
    },
    contactsDb: {
        count: mock(() => 0),
        getAll: mock(() => []),
    },
    askCacheDb: {
        stats: mock(() => ({ total: 0, topQuestions: [] })),
    },
}))

mock.module("../src/utils/whatsapp.util.js", () => ({
    removePrefix: (prefix: string, command: string) => command.startsWith(prefix) ? command.slice(prefix.length) : command,
    replyText: replyTextMock,
}))

mock.module("../src/commands/info.list.commands.js", () => ({
    default: {
        dbstats: {
            guide: "dbstats",
            permissions: { roles: ["owner"] },
            function: infoTelemetryCommandMock,
        },
    },
}))

mock.module("../src/commands/utility.list.commands.js", () => ({ default: {} }))
mock.module("../src/commands/group.list.commands.js", () => ({ default: {} }))
mock.module("../src/commands/admin.list.commands.js", () => ({ default: {} }))

const { isOwnerRegister } = await import("../src/helpers/message.procedures.helper.ts")
const { commandInvoker } = await import("../src/helpers/command.invoker.helper.ts")

afterAll(() => {
    mock.restore()
})

const botInfo = {
    prefix: "!",
    command_rate: { status: false, max_cmds_minute: 5, block_time: 60 },
} as any

function makeMessage(overrides: Record<string, unknown> = {}) {
    return {
        sender: "5511999999999@s.whatsapp.net",
        senderAlt: undefined,
        chat_id: "5511999999999@s.whatsapp.net",
        command: "!admin",
        args: [],
        text_command: "",
        pushname: "User",
        isGroupMsg: false,
        isGroupAdmin: false,
        isBotOwner: false,
        wa_message: {},
        ...overrides,
    } as any
}

beforeEach(() => {
    users = []
    delete process.env.BOT_OWNER_BOOTSTRAP_TOKEN
    registerOwnerMock.mockClear()
    replyTextMock.mockClear()
    infoTelemetryCommandMock.mockClear()
    logCommandMock.mockClear()
    getUserLogsMock.mockClear()
})

test("first owner registration refuses chat-only bootstrap without the configured token", async () => {
    const result = await isOwnerRegister({} as any, botInfo, makeMessage())

    expect(result).toBe(false)
    expect(registerOwnerMock).not.toHaveBeenCalled()
    expect(replyTextMock).not.toHaveBeenCalled()
})

test("first owner registration accepts only the configured one-time bootstrap token", async () => {
    process.env.BOT_OWNER_BOOTSTRAP_TOKEN = "bootstrap-token"

    const result = await isOwnerRegister(
        {} as any,
        botInfo,
        makeMessage({ args: ["bootstrap-token"], text_command: "bootstrap-token" }),
    )

    expect(result).toBe(true)
    expect(registerOwnerMock).toHaveBeenCalledWith("5511999999999@s.whatsapp.net", undefined)
    expect(replyTextMock).toHaveBeenCalled()
})

test("command invoker blocks owner-only info telemetry before executing the command", async () => {
    await commandInvoker(
        {} as any,
        botInfo,
        makeMessage({ command: "!dbstats", isBotOwner: false }),
        null,
    )

    expect(infoTelemetryCommandMock).not.toHaveBeenCalled()
    expect(logCommandMock).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
    expect(replyTextMock).toHaveBeenCalledWith(
        expect.anything(),
        "5511999999999@s.whatsapp.net",
        expect.stringContaining("Apenas"),
        expect.anything(),
        expect.anything(),
    )
})

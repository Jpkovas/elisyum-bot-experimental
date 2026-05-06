import { afterEach, expect, mock, test } from "bun:test"
import { commandExist, getCommandsByCategory } from "../src/utils/commands.util.ts"

afterEach(() => {
    mock.restore()
})

test("documented utility subcategories resolve to concrete command lists", () => {
    const downloadCommands = getCommandsByCategory("!", "download" as any)
    const stickerCommands = getCommandsByCategory("!", "sticker" as any)
    const miscCommands = getCommandsByCategory("!", "misc" as any)

    expect(downloadCommands).toEqual(expect.arrayContaining(["!d", "!play", "!mp3", "!img"]))
    expect(stickerCommands).toEqual(expect.arrayContaining(["!s", "!simg"]))
    expect(miscCommands).toEqual(expect.arrayContaining(["!vtnc"]))
    expect(commandExist("!", "!img", "download" as any)).toBe(true)
    expect(commandExist("!", "!s", "download" as any)).toBe(false)
})

test("batch async commands do not start unawaited async work in forEach callbacks", async () => {
    const adminCommands = await Bun.file(new URL("../src/commands/admin.functions.commands.ts", import.meta.url)).text()
    const groupCommands = await Bun.file(new URL("../src/commands/group.functions.commands.ts", import.meta.url)).text()

    expect(adminCommands).not.toMatch(/\.forEach\s*\(\s*async\b/)
    expect(groupCommands).not.toMatch(/\.forEach\s*\(\s*async\b/)
})

test("group add command adds every comma-separated number before replying", async () => {
    const addedParticipants: string[] = []
    const replies: string[] = []
    const { addCommand } = await import("../src/commands/group.functions.commands.ts")

    await addCommand({
        groupParticipantsUpdate: async (_groupId: string, participants: string[]) => {
            addedParticipants.push(...participants)
            return [{ status: "200" }]
        },
        sendMessage: async (_chatId: string, content: { text?: string }) => {
            replies.push(content.text || "")
            return {}
        },
    } as any, { prefix: "!" } as any, {
        args: ["5511999990001,", "5511999990002"],
        text_command: "5511999990001, 5511999990002",
        wa_message: {},
    } as any, {
        id: "120363batch5@g.us",
        expiration: 0,
    } as any)

    expect(addedParticipants).toEqual([
        "5511999990001@s.whatsapp.net",
        "5511999990002@s.whatsapp.net",
    ])
    expect(replies).toHaveLength(1)
})

test("enter group command sends only the pending reply when invite join is pending", async () => {
    const replies: string[] = []
    const { entrargrupoCommand } = await import("../src/commands/admin.functions.commands.ts")

    await entrargrupoCommand({
        groupAcceptInvite: async () => undefined,
        sendMessage: async (_chatId: string, content: { text?: string }) => {
            replies.push(content.text || "")
            return {}
        },
    } as any, { prefix: "!" } as any, {
        args: ["https://chat.whatsapp.com/invite-code"],
        text_command: "https://chat.whatsapp.com/invite-code",
        chat_id: "owner@s.whatsapp.net",
        wa_message: {},
        expiration: 0,
    } as any, {} as any)

    expect(replies).toHaveLength(1)
    expect(replies[0].toLowerCase()).toContain("pedido")
})

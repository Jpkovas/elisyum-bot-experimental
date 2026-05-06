import { afterEach, beforeEach, expect, test } from "bun:test"

const logs: string[] = []
const originalConsoleLog = console.log
const originalConsoleError = console.error

const { contactsDb, logsDb } = await import("../src/database/db.ts")
const { contactsUpdate } = await import("../src/events/contacts-update.event.ts")
const { logNewsletterMessages } = await import("../src/events/newsletter-message.event.ts")
const { logNewslettersUpdate } = await import("../src/events/newsletter-update.event.ts")

beforeEach(() => {
    logs.length = 0
    console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "))
    }
    console.error = (...args: unknown[]) => {
        logs.push(args.map(String).join(" "))
    }
})

afterEach(() => {
    console.log = originalConsoleLog
    console.error = originalConsoleError
})

test("command logs minimize user identifiers, args, chat ids, and errors before persistence", () => {
    const uniqueCommand = `batch3-${Date.now()}`

    logsDb.log({
        userJid: "5511999999999@s.whatsapp.net",
        userName: "Alice Secret",
        command: uniqueCommand,
        args: "my password is abc123",
        chatId: "120363-secret@g.us",
        isGroup: true,
        success: false,
        error: "token abc123 failed",
    })

    const row = (logsDb.getRecent(100) as any[]).find(log => log.command === uniqueCommand)
    const serialized = JSON.stringify(row)

    expect(row).toBeTruthy()
    expect(row.user_jid).toStartWith("sha256:")
    expect(row.chat_id).toStartWith("sha256:")
    expect(serialized).not.toContain("5511999999999")
    expect(serialized).not.toContain("Alice Secret")
    expect(serialized).not.toContain("my password is abc123")
    expect(serialized).not.toContain("120363-secret")
    expect(serialized).not.toContain("abc123")
})

test("contact persistence logs do not print raw names or JIDs", () => {
    contactsDb.upsert({
        jid: "5511888888888@s.whatsapp.net",
        notify: "Sensitive Contact",
    })

    const output = logs.join("\n")
    expect(output).not.toContain("5511888888888")
    expect(output).not.toContain("Sensitive Contact")
})

test("contact update event logs do not print raw names or JIDs", async () => {
    await contactsUpdate([
        {
            id: "5511777777777@s.whatsapp.net",
            notify: "Private Person",
        } as any,
    ])

    const output = logs.join("\n")
    expect(output).not.toContain("5511777777777")
    expect(output).not.toContain("Private Person")
})

test("newsletter logs avoid raw message text and metadata", async () => {
    await logNewsletterMessages({} as any, {
        type: "notify",
        messages: [
            {
                key: { remoteJid: "120363newsletter@newsletter" },
                messageTimestamp: 1,
                message: {
                    conversation: "newsletter secret body",
                    newsletterMessage: { serverId: "server-secret" },
                },
            } as any,
        ],
    })

    await logNewslettersUpdate([
        {
            id: "120363newsletter@newsletter",
            operation: "update",
            data: { subject: "private newsletter metadata" },
        },
    ])

    const output = logs.join("\n")
    expect(output).not.toContain("120363newsletter")
    expect(output).not.toContain("newsletter secret body")
    expect(output).not.toContain("server-secret")
    expect(output).not.toContain("private newsletter metadata")
})

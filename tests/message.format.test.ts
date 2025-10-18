import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import type { WAMessage } from "@whiskeysockets/baileys"
import { formatWAMessage } from "../src/utils/whatsapp.util.ts"
import { setWhatsappContextDebugOverride } from "../src/config/logging.config.ts"

test("formatWAMessage carries over requestId metadata", async () => {
    await fs.mkdir(path.resolve(process.cwd(), "storage"), { recursive: true })

    const sampleMessage = {
        key: {
            id: "msg-1",
            remoteJid: "123@s.whatsapp.net",
            fromMe: false
        },
        messageTimestamp: Date.now(),
        pushName: "Tester",
        message: {
            conversation: "Olá"
        }
    } as unknown as WAMessage

    const formatted = await formatWAMessage(sampleMessage, null, "bot@s.whatsapp.net", "req-123")

    assert.ok(formatted, "message should be formatted")
    assert.equal(formatted?.requestId, "req-123")
})

test("formatWAMessage does not log context info when debug flag is disabled", async () => {
    setWhatsappContextDebugOverride(false)

    const originalConsole = console.log
    const loggedMessages: unknown[][] = []
    console.log = (...args: unknown[]) => {
        loggedMessages.push(args)
    }

    try {
        const sampleMessage = {
            key: {
                id: "msg-2",
                remoteJid: "123@s.whatsapp.net",
                fromMe: false
            },
            messageTimestamp: Date.now(),
            pushName: "Tester",
            message: {
                extendedTextMessage: {
                    text: "Responder",
                    contextInfo: {
                        quotedMessage: {
                            conversation: "Mensagem original"
                        },
                        participant: "456@s.whatsapp.net"
                    }
                }
            }
        } as unknown as WAMessage

        await formatWAMessage(sampleMessage, null, "bot@s.whatsapp.net")
    } finally {
        console.log = originalConsole
        setWhatsappContextDebugOverride(null)
    }

    assert.equal(loggedMessages.length, 0, "debug logs should stay silent when disabled")
})

test("formatWAMessage logs context info when debug flag is enabled", async () => {
    setWhatsappContextDebugOverride(true)

    const originalConsole = console.log
    const loggedMessages: unknown[][] = []
    console.log = (...args: unknown[]) => {
        loggedMessages.push(args)
    }

    try {
        const sampleMessage = {
            key: {
                id: "msg-3",
                remoteJid: "123@s.whatsapp.net",
                fromMe: false
            },
            messageTimestamp: Date.now(),
            pushName: "Tester",
            message: {
                extendedTextMessage: {
                    text: "Responder",
                    contextInfo: {
                        quotedMessage: {
                            conversation: "Mensagem original"
                        },
                        participant: "456@s.whatsapp.net"
                    }
                }
            }
        } as unknown as WAMessage

        await formatWAMessage(sampleMessage, null, "bot@s.whatsapp.net")
    } finally {
        console.log = originalConsole
        setWhatsappContextDebugOverride(null)
    }

    assert.ok(loggedMessages.length > 0, "debug logs should be emitted when enabled")
    assert.equal(loggedMessages[0][0], "[DEBUG-CONTEXT] contextInfo completo:")
})

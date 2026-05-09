import { afterEach, beforeEach, expect, test } from "bun:test"
import NodeCache from "node-cache"
import { executeEventQueue, queueEvent } from "../src/helpers/events.queue.helper.ts"
import { getMessageFromCache, getViewOnceMessageFromCache, storeMessageOnCache, storeViewOnceMessage } from "../src/utils/whatsapp.util.ts"

const originalMaxQueueSize = process.env.EVENT_QUEUE_MAX_SIZE

beforeEach(() => {
    process.env.EVENT_QUEUE_MAX_SIZE = "2"
})

afterEach(() => {
    if (originalMaxQueueSize === undefined) {
        delete process.env.EVENT_QUEUE_MAX_SIZE
    } else {
        process.env.EVENT_QUEUE_MAX_SIZE = originalMaxQueueSize
    }
})

test("event queue caps pending events instead of growing unbounded", async () => {
    const cache = new NodeCache()

    await queueEvent(cache, "groups.update", [{ id: "group-1@g.us", subject: "one" }] as any)
    await queueEvent(cache, "groups.update", [{ id: "group-2@g.us", subject: "two" }] as any)
    await queueEvent(cache, "groups.update", [{ id: "group-3@g.us", subject: "three" }] as any)

    const queued = cache.get("events") as Array<{ event: string, data: any }>

    expect(queued).toHaveLength(2)
    expect(queued.map(item => item.data[0].id)).toEqual(["group-2@g.us", "group-3@g.us"])
})

test("event queue coalesces group updates by group id", async () => {
    const cache = new NodeCache()
    const emitted: Array<{ event: string, data: any }> = []

    await queueEvent(cache, "groups.update", [{ id: "group-1@g.us", subject: "old" }] as any)
    await queueEvent(cache, "groups.update", [{ id: "group-1@g.us", subject: "new" }] as any)
    await executeEventQueue({ ev: { emit: (event: string, data: any) => emitted.push({ event, data }) } } as any, cache)

    expect(emitted).toHaveLength(1)
    expect(emitted[0].data[0].subject).toBe("new")
})

test("participant queue preserves different actions for the same participant", async () => {
    const cache = new NodeCache()

    await queueEvent(cache, "group-participants.update", {
        id: "group-1@g.us",
        action: "add",
        participants: ["5511999999999@s.whatsapp.net"],
    } as any)
    await queueEvent(cache, "group-participants.update", {
        id: "group-1@g.us",
        action: "remove",
        participants: ["5511999999999@s.whatsapp.net"],
    } as any)

    const queued = cache.get("events") as Array<{ event: string, data: any }>

    expect(queued).toHaveLength(2)
    expect(queued.map(item => item.data.action)).toEqual(["add", "remove"])
})

test("participant queue still coalesces duplicate actions for the same participant", async () => {
    const cache = new NodeCache()

    await queueEvent(cache, "group-participants.update", {
        id: "group-1@g.us",
        action: "modify",
        participants: [{ id: "5511999999999@s.whatsapp.net", admin: "admin" }],
    } as any)
    await queueEvent(cache, "group-participants.update", {
        id: "group-1@g.us",
        action: "modify",
        participants: [{ id: "5511999999999@s.whatsapp.net", admin: null }],
    } as any)

    const queued = cache.get("events") as Array<{ event: string, data: any }>

    expect(queued).toHaveLength(1)
    expect(queued[0].data.participants[0].admin).toBeNull()
})

test("message cache does not return the wrong message when message ids collide across chats", () => {
    const cache = new NodeCache()
    const firstMessage = { conversation: "first chat" }
    const secondMessage = { conversation: "second chat" }

    storeMessageOnCache({ key: { id: "same-id", remoteJid: "chat-a@s.whatsapp.net", participant: "a@s.whatsapp.net" }, message: firstMessage } as any, cache)
    storeMessageOnCache({ key: { id: "same-id", remoteJid: "chat-b@s.whatsapp.net", participant: "b@s.whatsapp.net" }, message: secondMessage } as any, cache)

    expect(getMessageFromCache("same-id", cache)).toBeUndefined()
    expect(getMessageFromCache({ id: "same-id", remoteJid: "chat-a@s.whatsapp.net", participant: "a@s.whatsapp.net" } as any, cache)).toEqual(firstMessage)
    expect(getMessageFromCache({ id: "same-id", remoteJid: "chat-b@s.whatsapp.net", participant: "b@s.whatsapp.net" } as any, cache)).toEqual(secondMessage)
})

test("view-once cache keys include chat scope when available", () => {
    const cache = new NodeCache()
    const firstMessage = { key: { id: "view-once-id", remoteJid: "chat-a@s.whatsapp.net" }, message: { viewOnceMessage: { message: { imageMessage: {} } } } }
    const secondMessage = { key: { id: "view-once-id", remoteJid: "chat-b@s.whatsapp.net" }, message: { viewOnceMessage: { message: { videoMessage: {} } } } }

    expect(storeViewOnceMessage(firstMessage as any, cache)).toBe(true)
    expect(storeViewOnceMessage(secondMessage as any, cache)).toBe(true)
    expect(getViewOnceMessageFromCache("view-once-id", cache)).toBeUndefined()
    expect(getViewOnceMessageFromCache({ id: "view-once-id", remoteJid: "chat-a@s.whatsapp.net" } as any, cache)).toEqual(firstMessage)
    expect(getViewOnceMessageFromCache({ id: "view-once-id", remoteJid: "chat-b@s.whatsapp.net" } as any, cache)).toEqual(secondMessage)
})

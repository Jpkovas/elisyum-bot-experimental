import { WASocket, BaileysEvent, BaileysEventMap, GroupParticipant } from '@whiskeysockets/baileys'
import NodeCache from 'node-cache'

type QueuedEvent = {
    event: BaileysEvent
    data: BaileysEventMap[BaileysEvent]
    queuedAt?: number
}

const DEFAULT_EVENT_QUEUE_MAX_SIZE = 500
const DEFAULT_EVENT_QUEUE_TTL_MS = 5 * 60 * 1000

function getPositiveIntegerEnv(name: string, fallback: number) {
    const rawValue = process.env[name]
    const parsedValue = rawValue ? Number(rawValue) : fallback

    return Number.isFinite(parsedValue) && parsedValue > 0 ? Math.floor(parsedValue) : fallback
}

function getEventQueueMaxSize() {
    return getPositiveIntegerEnv('EVENT_QUEUE_MAX_SIZE', DEFAULT_EVENT_QUEUE_MAX_SIZE)
}

function getEventQueueTtlMs() {
    return getPositiveIntegerEnv('EVENT_QUEUE_TTL_MS', DEFAULT_EVENT_QUEUE_TTL_MS)
}

function isFreshQueuedEvent(event: QueuedEvent, now = Date.now()) {
    return !event.queuedAt || now - event.queuedAt <= getEventQueueTtlMs()
}

export async function executeEventQueue(client: WASocket, eventsCache: NodeCache) {
    const eventsQueue = ((eventsCache.get("events") as QueuedEvent[]) ?? []).filter(event => isFreshQueuedEvent(event))

    for (const ev of eventsQueue) {
        client.ev.emit(ev.event, ev.data)
    }

    eventsCache.set("events", [])
}

type ParticipantLike = GroupParticipant | string

function toParticipantIds(participants: ParticipantLike[] | undefined) {
    return (participants ?? [])
        .map(participant => typeof participant === 'string' ? participant : participant.id)
        .filter((id): id is string => typeof id === 'string')
}

function getFirstGroupId(groups: Array<{ id?: string }> | undefined) {
    return groups?.[0]?.id
}

function capQueue(queueArray: QueuedEvent[]) {
    const maxQueueSize = getEventQueueMaxSize()
    return queueArray.length > maxQueueSize ? queueArray.slice(queueArray.length - maxQueueSize) : queueArray
}

export async function queueEvent<T extends BaileysEvent>(
    eventsCache: NodeCache,
    eventName: T,
    eventData: BaileysEventMap[T]
) {
    let queueArray = ((eventsCache.get("events") as QueuedEvent[]) ?? []).filter(event => isFreshQueuedEvent(event))

    if (eventName === 'group-participants.update') {
        const newEvent = eventData as BaileysEventMap['group-participants.update']
        const newParticipantsIds = toParticipantIds(newEvent.participants)

        queueArray = queueArray.filter(queue => {
            if (queue.event !== 'group-participants.update') {
                return true
            }

            const queuedEvent = queue.data as BaileysEventMap['group-participants.update']
            const queuedParticipantIds = toParticipantIds(queuedEvent.participants)
            const sameGroup = queuedEvent.id === newEvent.id
            const hasOverlap = queuedParticipantIds.some(id => newParticipantsIds.includes(id))
            const sameAction = queuedEvent.action === newEvent.action

            return !(sameGroup && hasOverlap && sameAction)
        })
    }

    if (eventName === 'groups.upsert') {
        const newGroups = eventData as BaileysEventMap['groups.upsert']
        const newGroupId = getFirstGroupId(newGroups)
        queueArray = queueArray.filter(queue => {
            if (queue.event !== 'groups.upsert') {
                return true
            }

            const queuedGroups = queue.data as BaileysEventMap['groups.upsert']
            return getFirstGroupId(queuedGroups) !== newGroupId
        })
    }

    if (eventName === 'groups.update') {
        const newGroups = eventData as BaileysEventMap['groups.update']
        const newGroupId = getFirstGroupId(newGroups)
        queueArray = queueArray.filter(queue => {
            if (queue.event !== 'groups.update') {
                return true
            }

            const queuedGroups = queue.data as BaileysEventMap['groups.update']
            return getFirstGroupId(queuedGroups) !== newGroupId
        })
    }

    queueArray.push({ event: eventName, data: eventData, queuedAt: Date.now() })
    eventsCache.set("events", capQueue(queueArray))
}

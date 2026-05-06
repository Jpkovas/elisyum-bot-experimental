import { expect, test } from "bun:test"
import { GroupService } from "../src/services/group.service.ts"
import { ParticipantService } from "../src/services/participant.service.ts"
import { shouldEnforceAntiFloodLimit } from "../src/helpers/message.procedures.helper.ts"

function uniqueId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

test("ASK cache schema and upsert use question hash plus user type uniqueness", async () => {
    const source = await Bun.file(new URL("../src/database/db.ts", import.meta.url)).text()

    expect(source).toContain("UNIQUE(question_hash, user_type)")
    expect(source).toContain("ON CONFLICT(question_hash, user_type)")
    expect(source).not.toContain("question_hash TEXT NOT NULL UNIQUE")
})

test("partial group updates apply all provided fields including false and zero values", async () => {
    const groupService = new GroupService()
    const groupId = `${uniqueId("partial")}@g.us`

    await groupService.registerGroup({
        id: groupId,
        subject: "old name",
        desc: "old description",
        owner: "owner@s.whatsapp.net",
        announce: true,
        ephemeralDuration: 86400,
        participants: [],
    } as any)

    await groupService.updatePartialGroup({
        id: groupId,
        subject: "new name",
        desc: "",
        announce: false,
        ephemeralDuration: 0,
    } as any)

    const updatedGroup = await groupService.getGroup(groupId)

    expect(updatedGroup?.name).toBe("new name")
    expect(updatedGroup?.description).toBe("")
    expect(updatedGroup?.restricted).toBe(false)
    expect(updatedGroup?.expiration).toBe(0)
})

test("warning reset clears warnings for every participant in the group", async () => {
    const participantService = new ParticipantService()
    const groupId = `${uniqueId("warnings")}@g.us`
    const firstUser = "5511999990001@s.whatsapp.net"
    const secondUser = "5511999990002@s.whatsapp.net"

    await participantService.addParticipant(groupId, firstUser)
    await participantService.addParticipant(groupId, secondUser)
    await participantService.addWarning(groupId, firstUser)
    await participantService.addWarning(groupId, secondUser)

    await participantService.removeParticipantsWarnings(groupId)

    expect((await participantService.getParticipantFromGroup(groupId, firstUser))?.warnings).toBe(0)
    expect((await participantService.getParticipantFromGroup(groupId, secondUser))?.warnings).toBe(0)
})

test("anti-flood enforces the persisted next message count at the configured threshold", () => {
    expect(shouldEnforceAntiFloodLimit(1, 2, false)).toBe(true)
    expect(shouldEnforceAntiFloodLimit(0, 2, false)).toBe(false)
    expect(shouldEnforceAntiFloodLimit(10, 2, true)).toBe(false)
})

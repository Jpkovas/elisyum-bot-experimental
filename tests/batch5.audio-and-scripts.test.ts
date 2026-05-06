import { expect, test } from "bun:test"

test("save audio rejects oversized quoted media before downloading it", async () => {
    const { saveCommand } = await import("../src/commands/utility.functions.commands.ts")

    await expect(saveCommand({} as any, { prefix: "!" } as any, {
        isQuoted: true,
        args: ["grande"],
        text_command: "grande",
        sender: "5511999990004@s.whatsapp.net",
        chat_id: "120363audio@g.us",
        wa_message: {},
        quotedMessage: {
            type: "audioMessage",
            media: {
                mimetype: "audio/ogg; codecs=opus",
                file_length: 11 * 1024 * 1024,
                seconds: 5,
            },
            wa_message: {},
        },
    } as any)).rejects.toThrow(/grande|limite|tamanho/i)

})

test("save audio rejects unsupported MIME types before downloading them", async () => {
    const { saveCommand } = await import("../src/commands/utility.functions.commands.ts")

    await expect(saveCommand({} as any, { prefix: "!" } as any, {
        isQuoted: true,
        args: ["documento"],
        text_command: "documento",
        sender: "5511999990005@s.whatsapp.net",
        chat_id: "120363audio@g.us",
        wa_message: {},
        quotedMessage: {
            type: "audioMessage",
            media: {
                mimetype: "application/pdf",
                file_length: 1024,
                seconds: 5,
            },
            wa_message: {},
        },
    } as any)).rejects.toThrow(/formato|mime|audio/i)

})

test("audio migration keeps full backups and records duplicate-name conflicts before replacing the table", async () => {
    const migration = await Bun.file(new URL("../scripts/migrate-audios-to-global.ts", import.meta.url)).text()

    expect(migration).toContain("saved_audios_migration_backup")
    expect(migration).toContain("saved_audios_migration_conflicts")
    expect(migration).toContain("duplicate")
    expect(migration).not.toContain("SELECT MIN(id)")
})

test("installer writes the run wrapper in the current project root", async () => {
    const installer = await Bun.file(new URL("../scripts/setup/install.sh", import.meta.url)).text()

    expect(installer).toContain('cat > ./run.sh')
    expect(installer).toContain('chmod +x ./run.sh')
    expect(installer).not.toContain('cat > elisyum-bot/run.sh')
    expect(installer).not.toContain('chmod +x elisyum-bot/run.sh')
})

import test from "node:test"
import assert from "node:assert/strict"
import fs from "fs-extra"
import path from "node:path"
import os from "node:os"
import { BotService } from "../src/services/bot.service.ts"

async function withIsolatedService(
    run: (service: BotService, tmpDir: string) => Promise<void>,
    options: { beforeInit?: (tmpDir: string) => Promise<void> } = {}
){
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bot-service-"))
    const originalCwd = process.cwd()

    try {
        process.chdir(tmpDir)

        if (options.beforeInit){
            await options.beforeInit(tmpDir)
        }

        const service = new BotService(path.join(tmpDir, "storage", "bot.json"))
        const loadingPromise: Promise<unknown> | undefined = (service as unknown as { loadingPromise?: Promise<unknown> }).loadingPromise ?? undefined

        if (loadingPromise){
            await loadingPromise
        }

        await run(service, tmpDir)
    } finally {
        process.chdir(originalCwd)
        await fs.remove(tmpDir)
    }
}

test("BotService initializes storage and cache when the JSON file is missing", async () => {
    await withIsolatedService(async (service, tmpDir) => {
        const storageFile = path.join(tmpDir, "storage", "bot.json")
        const fileExists = await fs.pathExists(storageFile)

        assert.equal(fileExists, true, "bot.json should be created on initialization")

        const persistedData = await fs.readJson(storageFile)
        assert.equal(persistedData.name, "LBOT", "default bot name should be persisted")
        assert.equal(persistedData.prefix, "!", "default prefix should be persisted")

        const cachedData = service.getBot()
        assert.equal(cachedData.name, "LBOT", "cache should mirror persisted defaults")
        assert.equal(cachedData.prefix, "!", "cache should expose default prefix")
    })
})

test("BotService keeps cache consistent under concurrent updates", async () => {
    await withIsolatedService(async (service) => {
        await Promise.all([
            service.setNameBot("Concurrent"),
            service.setPrefix("$"),
            service.setAutosticker(true),
            service.incrementExecutedCommands(),
            service.incrementExecutedCommands(),
            service.incrementExecutedCommands()
        ])

        const botInfo = service.getBot()
        assert.equal(botInfo.name, "Concurrent", "latest name should be cached")
        assert.equal(botInfo.prefix, "$", "latest prefix should be cached")
        assert.equal(botInfo.autosticker, true, "autosticker toggle should be cached")
        assert.equal(botInfo.executed_cmds, 3, "executed commands should reflect all increments")
    })
})

test("BotService migration merges defaults and updates the cache", async () => {
    await withIsolatedService(async (service, tmpDir) => {
        await service.migrateBot()

        const botInfo = service.getBot()
        assert.equal(botInfo.name, "Legacy", "existing name should be preserved")
        assert.equal(botInfo.block_cmds.includes("legacy"), true, "existing blocked commands should persist")
        assert.equal(botInfo.command_rate.status, true, "existing command rate flag should persist")
        assert.equal(botInfo.command_rate.max_cmds_minute, 7, "existing max commands should persist")
        assert.equal(botInfo.command_rate.block_time, 60, "default block time should be restored")

        const persisted = await fs.readJson(path.join(tmpDir, "storage", "bot.json"))
        assert.deepEqual(persisted, botInfo, "cache and persisted data should match after migration")
    }, {
        beforeInit: async (tmpDir) => {
            const storageDir = path.join(tmpDir, "storage")
            await fs.ensureDir(storageDir)

            const legacyData = {
                name: "Legacy",
                block_cmds: ["legacy"],
                command_rate: {
                    status: true,
                    max_cmds_minute: 7
                },
                db_migrated: false
            }

            await fs.writeJson(path.join(storageDir, "bot.json"), legacyData)
        }
    })
})

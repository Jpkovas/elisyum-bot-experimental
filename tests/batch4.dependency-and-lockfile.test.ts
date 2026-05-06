import { expect, test } from "bun:test"

const deprecatedRuntimeDeps = [
    "@victorsouzaleal/googlethis",
    "node-gtts",
    "node-upload-images",
] as const

test("runtime dependencies no longer include deprecated download/search helper chains", async () => {
    const packageJson = JSON.parse(await Bun.file(new URL("../package.json", import.meta.url)).text())

    for (const dependency of deprecatedRuntimeDeps) {
        expect(packageJson.dependencies[dependency]).toBeUndefined()
    }
})

test("source no longer imports deprecated search, text-to-speech, or image upload packages", async () => {
    const audioUtil = await Bun.file(new URL("../src/utils/audio.util.ts", import.meta.url)).text()
    const imageUtil = await Bun.file(new URL("../src/utils/image.util.ts", import.meta.url)).text()
    const miscUtil = await Bun.file(new URL("../src/utils/misc.util.ts", import.meta.url)).text()

    expect(audioUtil).not.toContain("node-gtts")
    expect(imageUtil).not.toContain("@victorsouzaleal/googlethis")
    expect(imageUtil).not.toContain("node-upload-images")
    expect(miscUtil).not.toContain("@victorsouzaleal/googlethis")
})

test("bun lockfile is tracked-compatible and aligned with frozen deploy installs", async () => {
    const gitignore = await Bun.file(new URL("../.gitignore", import.meta.url)).text()
    const webhookDeploy = await Bun.file(new URL("../webhook-deploy.js", import.meta.url)).text()
    const deploySetup = await Bun.file(new URL("../scripts/setup/deploy.sh", import.meta.url)).text()
    const installSetup = await Bun.file(new URL("../scripts/setup/install.sh", import.meta.url)).text()
    const deployGuide = await Bun.file(new URL("../docs/guides/DEPLOY.md", import.meta.url)).text()
    const installationGuide = await Bun.file(new URL("../docs/guides/INSTALLATION.md", import.meta.url)).text()

    expect(gitignore).not.toMatch(/^bun\.lock$/m)
    expect(webhookDeploy).toContain("--frozen-lockfile")
    expect(deploySetup).toContain("bun install --frozen-lockfile")
    expect(installSetup).toContain("bun install --frozen-lockfile")
    expect(deployGuide).toContain("bun install --frozen-lockfile")
    expect(installationGuide).toContain("bun install --frozen-lockfile")
})

test("libsignal resolution pin matches the generated bun lock entry", async () => {
    const packageJson = JSON.parse(await Bun.file(new URL("../package.json", import.meta.url)).text())
    const lockfile = await Bun.file(new URL("../bun.lock", import.meta.url)).text()
    const pinnedCommit = packageJson.resolutions.libsignal.split("#")[1]
    const shortCommit = pinnedCommit.slice(0, 7)

    expect(lockfile).toContain(`"libsignal": "github:whiskeysockets/libsignal-node#${pinnedCommit}"`)
    expect(lockfile).toContain(`"libsignal": ["@whiskeysockets/libsignal-node@github:whiskeysockets/libsignal-node#${shortCommit}"`)
    expect(lockfile).not.toContain("@victorsouzaleal/googlethis")
    expect(lockfile).not.toContain("node-gtts")
    expect(lockfile).not.toContain("node-upload-images")
})

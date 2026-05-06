import { expect, test } from "bun:test"

test("yt-dlp installer pins a version and verifies SHA-256 before chmod", async () => {
    const source = await Bun.file(new URL("../scripts/setup/install-ytdlp.js", import.meta.url)).text()

    expect(source).toContain("YTDLP_VERSION")
    expect(source).toContain("YTDLP_SHA256")
    expect(source).toContain("createHash")
    expect(source).not.toContain("/releases/latest/download/")
    expect(source).not.toContain("execSync(`curl")
})

test("deploy setup verifies the local yt-dlp binary hash after download", async () => {
    const source = await Bun.file(new URL("../scripts/setup/deploy.sh", import.meta.url)).text()

    expect(source).toContain("YTDLP_VERSION")
    expect(source).toContain("YTDLP_SHA256")
    expect(source).toContain("shasum -a 256")
    expect(source).not.toContain("/releases/latest/download/")
})

test("deployment docs mention checksum verification for yt-dlp installation", async () => {
    const deployGuide = await Bun.file(new URL("../docs/guides/DEPLOY.md", import.meta.url)).text()

    expect(deployGuide).toContain("YTDLP_SHA256")
    expect(deployGuide).toContain("shasum -a 256")
})

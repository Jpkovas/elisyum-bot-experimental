import { expect, test } from "bun:test"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createHmac } from "node:crypto"

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)))

test("startup no longer performs dependency installation and install scripts are not globally trusted", async () => {
    const packageJson = await Bun.file(path.join(repoRoot, "package.json")).json()
    const bunfig = await Bun.file(path.join(repoRoot, "bunfig.toml")).text()

    expect(packageJson.scripts.prestart).toBeUndefined()
    expect(bunfig).not.toContain('allowList = ["*"]')
})

test("webhook deploy source rejects unsafe defaults and shell interpolation patterns", async () => {
    const source = await Bun.file(path.join(repoRoot, "webhook-deploy.js")).text()

    expect(source).not.toContain("change-me-in-production")
    expect(source).toContain("timingSafeEqual")
    expect(source).toContain("spawn")
    expect(source).not.toContain("exec(")
})

test("webhook signature verification accepts only matching GitHub HMAC values", async () => {
    const { verifyGitHubSignature } = await import("../webhook-deploy.js")
    const body = JSON.stringify({ ref: "refs/heads/main" })
    const secret = "webhook-secret"
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`

    expect(verifyGitHubSignature(signature, secret, body)).toBe(true)
    expect(verifyGitHubSignature(signature, "other-secret", body)).toBe(false)
    expect(verifyGitHubSignature("sha256=bad", secret, body)).toBe(false)
})

test("saved audio deletion is constrained to storage/audios", async () => {
    const script = `
        import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
        import { tmpdir } from "node:os";
        import path from "node:path";
        import { pathToFileURL } from "node:url";

        const repoRoot = ${JSON.stringify(repoRoot)};
        const originalCwd = process.cwd();
        const isolatedCwd = mkdtempSync(path.join(tmpdir(), "elisyum-audio-db-"));
        const outsidePath = path.join(isolatedCwd, "outside.opus");
        const audioRoot = path.join(isolatedCwd, "storage", "audios");
        let db;

        try {
            mkdirSync(audioRoot, { recursive: true });
            writeFileSync(outsidePath, "poison");
            process.chdir(isolatedCwd);

            const imported = await import(pathToFileURL(path.join(repoRoot, "src", "database", "db.ts")).href);
            db = imported.db;
            const { audiosDb } = imported;
            db.prepare("INSERT INTO saved_audios (owner_jid, audio_name, file_path, mime_type, seconds, ptt) VALUES (?, ?, ?, ?, ?, ?)")
                .run("owner@s.whatsapp.net", "poison", outsidePath, "audio/ogg; codecs=opus", 1, 0);

            let rejectedUnsafePath = false;
            try {
                audiosDb.delete("poison", "owner@s.whatsapp.net");
            } catch (error) {
                rejectedUnsafePath = /storage\\/audios|fora|unsafe/i.test(error.message);
            }
            if (!rejectedUnsafePath) throw new Error("unsafe saved audio path was not rejected");
            if (!existsSync(outsidePath)) throw new Error("unsafe outside file was deleted");
            if (!audiosDb.get("poison")) throw new Error("poisoned DB row was removed");

            const audioPath = path.join(audioRoot, "safe.opus");
            writeFileSync(audioPath, "audio");
            audiosDb.save({
                ownerJid: "owner@s.whatsapp.net",
                audioName: "safe",
                filePath: audioPath,
                mimeType: "audio/ogg; codecs=opus",
                seconds: 1,
                ptt: true,
            });
            audiosDb.delete("safe", "owner@s.whatsapp.net");
            if (existsSync(audioPath)) throw new Error("safe audio file was not deleted");
            if (audiosDb.get("safe")) throw new Error("safe audio DB row was not removed");
        } finally {
            db?.close?.();
            process.chdir(originalCwd);
            rmSync(isolatedCwd, { recursive: true, force: true });
        }
    `
    const proc = Bun.spawn(["bun", "--eval", script], {
        cwd: repoRoot,
        stdout: "pipe",
        stderr: "pipe",
    })
    const stderr = await new Response(proc.stderr).text()
    const code = await proc.exited

    if (code !== 0) {
        throw new Error(stderr)
    }

    expect(code).toBe(0)
})

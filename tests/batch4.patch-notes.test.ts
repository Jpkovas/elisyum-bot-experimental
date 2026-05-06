import { expect, test } from "bun:test"
import {
    extractPatchNotesFromChangelog,
    shouldMarkPatchNotesVersionNotified,
} from "../src/helpers/patch-notes.helper.ts"

test("patch notes extraction includes the final changelog section", () => {
    const changelog = [
        "# Changelog",
        "",
        "## 3.5.0",
        "- Previous release",
        "",
        "## 3.6.0",
        "- Final section fix",
        "- This section has no following version header",
    ].join("\n")

    expect(extractPatchNotesFromChangelog(changelog, "3.6.0")).toBe([
        "- Final section fix",
        "- This section has no following version header",
    ].join("\n"))
})

test("patch notes extraction accepts v-prefixed headings and headings with dates", () => {
    const changelog = [
        "# Changelog",
        "",
        "## v3.6.0 - 2026-05-06",
        "- Works with release metadata",
        "",
        "## v3.5.0",
        "- Older",
    ].join("\n")

    expect(extractPatchNotesFromChangelog(changelog, "3.6.0")).toBe("- Works with release metadata")
})

test("patch notes only mark a version notified after successful group delivery", () => {
    expect(shouldMarkPatchNotesVersionNotified({
        hasPatchNotes: false,
        groupCount: 3,
        errorCount: 0,
    })).toBe(false)

    expect(shouldMarkPatchNotesVersionNotified({
        hasPatchNotes: true,
        groupCount: 3,
        errorCount: 1,
    })).toBe(false)

    expect(shouldMarkPatchNotesVersionNotified({
        hasPatchNotes: true,
        groupCount: 3,
        errorCount: 0,
    })).toBe(true)
})

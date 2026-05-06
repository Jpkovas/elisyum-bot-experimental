import { expect, mock, test } from "bun:test"

const scheduledJobs: Array<{ stop: ReturnType<typeof mock>, destroy: ReturnType<typeof mock> }> = []
const scheduleMock = mock(() => {
    const job = {
        stop: mock(() => undefined),
        destroy: mock(() => undefined),
    }
    scheduledJobs.push(job)
    return job
})

mock.module("node-cron", () => ({
    default: {
        schedule: scheduleMock,
    },
}))

mock.module("../src/utils/download.util.js", () => ({
    youtubeMedia: mock(),
    downloadYouTubeVideo: mock(),
}))

mock.module("../src/utils/convert.util.js", () => ({
    convertVideoToThumbnail: mock(),
}))

mock.module("../src/helpers/ask.cache.helper.js", () => ({
    performCacheMaintenance: mock(),
}))

const { SchedulerService } = await import("../src/services/scheduler.service.ts")

test("scheduler init is idempotent across reconnect-created service instances", () => {
    scheduleMock.mockClear()
    scheduledJobs.length = 0
    SchedulerService.resetForTests()

    new SchedulerService({ sendMessage: mock() } as any).init()
    new SchedulerService({ sendMessage: mock() } as any).init()

    expect(scheduleMock).toHaveBeenCalledTimes(2)
})

test("scheduler destroy stops existing cron jobs and allows a clean re-init", () => {
    scheduleMock.mockClear()
    scheduledJobs.length = 0
    SchedulerService.resetForTests()

    const service = new SchedulerService({ sendMessage: mock() } as any)
    service.init()
    service.destroy()
    service.init()

    expect(scheduleMock).toHaveBeenCalledTimes(4)
    expect(scheduledJobs[0].stop).toHaveBeenCalled()
    expect(scheduledJobs[1].stop).toHaveBeenCalled()
})

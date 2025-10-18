import { Bot } from "../interfaces/bot.interface.js"
import path from "node:path"
import fs from 'fs-extra'
import { Mutex } from 'async-mutex'
import moment from "moment-timezone"
import { removePrefix } from "../utils/whatsapp.util.js"
import { deepMerge } from "../utils/general.util.js"

export class BotService {
    private pathJSON: string

    private defaultBot : Bot = {
        started : 0,
        host_number: '',
        name: "LBOT",
        prefix: "!",
        executed_cmds: 0,
        db_migrated: true,
        autosticker: false,
        commands_pv: true,
        admin_mode: false, 
        block_cmds: [],    
        command_rate:{
            status: false,
            max_cmds_minute: 5,
            block_time: 60,
        }
    }

    private cache: Bot = { ...this.defaultBot }
    private cachePopulated = false
    private loadingPromise: Promise<Bot> | null = null
    private mutex = new Mutex()

    constructor(storagePath = path.resolve("storage/bot.json")){
        this.pathJSON = storagePath

        const storageFolderExists = fs.pathExistsSync(path.dirname(this.pathJSON))
        if (!storageFolderExists) fs.mkdirSync(path.dirname(this.pathJSON), {recursive: true})
        void this.load()
    }

    private async load(): Promise<Bot> {
        if (this.cachePopulated) {
            return this.cache
        }

        if (!this.loadingPromise) {
            this.loadingPromise = (async () => {
                try {
                    if (!(await fs.pathExists(this.pathJSON))) {
                        await fs.ensureDir(path.dirname(this.pathJSON))
                        await fs.writeJson(this.pathJSON, this.defaultBot)
                        this.cache = { ...this.defaultBot }
                        this.cachePopulated = true
                        return this.cache
                    }

                    const bot = await fs.readJson(this.pathJSON)
                    this.cache = bot
                    this.cachePopulated = true
                    return this.cache
                } catch {
                    this.cache = { ...this.defaultBot }
                    await fs.writeJson(this.pathJSON, this.defaultBot)
                    this.cachePopulated = true
                    return this.cache
                } finally {
                    this.loadingPromise = null
                }
            })()
        }

        return this.loadingPromise
    }

    private async updateBot(bot : Bot){
        await fs.writeJson(this.pathJSON, bot)
        this.cache = bot
        this.cachePopulated = true
    }

    private async deleteBotData(){
        await fs.writeJson(this.pathJSON, {})
        this.cache = { ...this.defaultBot }
        this.cachePopulated = false
    }

    private async cloneBot(): Promise<Bot> {
        const bot = await this.load()
        return { ...bot, command_rate: { ...bot.command_rate }, block_cmds: [...bot.block_cmds] }
    }

    public async migrateBot() {
        await this.mutex.runExclusive(async () => {
            const oldBotData =  await this.cloneBot() as any
            const newBotData : Bot = deepMerge(this.defaultBot, oldBotData)
            await this.deleteBotData()
            await this.updateBot(newBotData)
        })
    }

    public async startBot(hostNumber : string){
        await this.mutateBot((bot) => {
            bot.started = moment.now()
            bot.host_number = hostNumber
        })
    }

    public getBot(){
        return { ...this.cache, command_rate: { ...this.cache.command_rate }, block_cmds: [...this.cache.block_cmds] }
    }

    public async setNameBot(name: string){
        await this.mutateBot((bot) => {
            bot.name = name
        })
    }

    public async setDbMigrated(status: boolean) {
        await this.mutateBot((bot) => {
            bot.db_migrated = status
        })
    }

    public async setPrefix(prefix: string){
        await this.mutateBot((bot) => {
            bot.prefix = prefix
        })
    }

    public async incrementExecutedCommands(){
        await this.mutateBot((bot) => {
            bot.executed_cmds++
        })
    }

    public async setAutosticker(status: boolean){
        await this.mutateBot((bot) => {
            bot.autosticker = status
        })
    }

    public async setAdminMode(status: boolean){
        await this.mutateBot((bot) => {
            bot.admin_mode = status
        })
    }

    public async setCommandsPv(status: boolean){
        await this.mutateBot((bot) => {
            bot.commands_pv = status
        })
    }

    public async setCommandRate(status: boolean, maxCommandsMinute: number, blockTime: number){
        await this.mutateBot((bot) => {
            bot.command_rate.status = status
            bot.command_rate.max_cmds_minute = maxCommandsMinute
            bot.command_rate.block_time = blockTime
        })
    }

    public async setBlockedCommands(prefix: string, commands: string[], operation: 'add' | 'remove'){
        return this.mutateBot((botInfo) => {
            const commandsWithoutPrefix = commands.map(command => removePrefix(prefix, command))

            if (operation == 'add'){
                const blockCommands = commandsWithoutPrefix.filter(command => !botInfo.block_cmds.includes(command))
                botInfo.block_cmds.push(...blockCommands)
                return blockCommands.map(command => prefix+command)
            } else {
                const unblockCommands = commandsWithoutPrefix.filter(command => botInfo.block_cmds.includes(command))

                unblockCommands.forEach((command) => {
                    botInfo.block_cmds.splice(botInfo.block_cmds.indexOf(command), 1)
                })

                return unblockCommands.map(command => prefix+command)
            }
        })
    }

    private async mutateBot<T>(mutator: (bot: Bot) => T | Promise<T>): Promise<T> {
        return this.mutex.runExclusive(async () => {
            const bot = await this.cloneBot()
            const result = await mutator(bot)
            await this.updateBot(bot)
            return result
        })
    }
}
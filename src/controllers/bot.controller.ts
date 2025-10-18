import { BotService } from "../services/bot.service.js"

export class BotController {
    private botService
    
    constructor(){
        this.botService = new BotService()
    }

    public async startBot(hostNumber : string){
        return this.botService.startBot(hostNumber)
    }

    public async migrateBot(){
        return this.botService.migrateBot()
    }

    public getBot(){
        return this.botService.getBot()
    }

    public async setName(name: string){
        return this.botService.setNameBot(name)
    }

    public async setPrefix(prefix: string){
        return this.botService.setPrefix(prefix)
    }

    public async setDbMigrated(status: boolean) {
        return this.botService.setDbMigrated(status)
    }

    public async incrementExecutedCommands(){
        return this.botService.incrementExecutedCommands()
    }

    public async setAutosticker(status: boolean){
        return this.botService.setAutosticker(status)
    }

    public async setAdminMode(status: boolean){
        return this.botService.setAdminMode(status)
    }

    public async setCommandsPv(status: boolean){
        return this.botService.setCommandsPv(status)
    }

    public async setCommandRate(status = true, maxCommandsMinute = 5, blockTime = 60){
        return this.botService.setCommandRate(status, maxCommandsMinute, blockTime)
    }

    public async setBlockedCommands(prefix: string, commands: string[], operation: 'add' | 'remove'){
        return this.botService.setBlockedCommands(prefix, commands, operation)
    }
}
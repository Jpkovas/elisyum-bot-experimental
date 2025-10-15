import moment from "moment-timezone"
moment.tz.setDefault('America/Sao_Paulo')
import { botUpdater } from './helpers/bot.updater.helper.js'
import connect from './socket.js'
import { buildText, getCurrentBotVersion } from "./utils/general.util.js"
import botTexts from "./helpers/bot.texts.helper.js"
import { warmupFfmpeg } from "./utils/ffmpeg.util.js"
warmupFfmpeg().catch(()=>{})

async function init(){
    console.log(buildText(botTexts.starting, getCurrentBotVersion()))
    let hasBotUpdated = await botUpdater()
    
    if (!hasBotUpdated) {
        connect()
    }
}

// Execução principal
init()






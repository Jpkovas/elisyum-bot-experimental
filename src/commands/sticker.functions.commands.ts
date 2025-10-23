import { WASocket } from "@whiskeysockets/baileys"
import { Bot } from "../interfaces/bot.interface.js"
import { Group } from "../interfaces/group.interface.js"
import { Message } from "../interfaces/message.interface.js"
import * as waUtil from '../utils/whatsapp.util.js'
import * as imageUtil from '../utils/image.util.js'
import * as stickerUtil from '../utils/sticker.util.js'
import * as quoteUtil from '../utils/quote.util.js'
import { buildText, messageErrorCommandUsage} from "../utils/general.util.js"
import stickerCommands from "./sticker.list.commands.js"
import { UserController } from "../controllers/user.controller.js"
import { getContactFromStore } from "../helpers/contacts.store.helper.js"

export async function sCommand(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    let stickerType : "resize" | "contain" | "circle" =  'resize'

    if (message.args[0] === '1') {
        stickerType = 'circle'
    } else if (message.args[0] === '2') {
        stickerType = 'contain'
    }

    let messageData = {
        type : (message.isQuoted) ? message.quotedMessage?.type : message.type,
        message: (message.isQuoted) ? message.quotedMessage?.wa_message  : message.wa_message,
        seconds: (message.isQuoted) ? message.quotedMessage?.media?.seconds : message.media?.seconds
    }

    if (!messageData.type || !messageData.message) {
        throw new Error(stickerCommands.s.msgs.error_message)
    }

    // Se for mensagem de texto citada, criar balão do WhatsApp
    if (message.isQuoted && (messageData.type === "conversation" || messageData.type === "extendedTextMessage")) {
        const quotedText = message.quotedMessage?.body || message.quotedMessage?.caption
        
        if (!quotedText) {
            throw new Error(stickerCommands.s.msgs.error_no_text)
        }

        if (quotedText.length > 500) {
            throw new Error(stickerCommands.s.msgs.error_too_long)
        }

        // Obter foto de perfil
        let avatarUrl: string | undefined
        try {
            const profilePicUrl = await client.profilePictureUrl(message.quotedMessage!.sender, 'image')
            avatarUrl = profilePicUrl
        } catch (err) {
            // Se não conseguir obter a foto, continua sem ela
            avatarUrl = undefined
        }

        // Obter nome do autor do grupo
        let authorName = 'Membro do grupo';
        try {
            const quotedSender = message.quotedMessage!.sender;
            const userController = new UserController();

            console.log(`\n[STICKER-NOME] ========== BUSCANDO NOME ==========`)
            console.log(`[STICKER-NOME] Sender ID: ${quotedSender}`)
            console.log(`[STICKER-NOME] É grupo?: ${!!group}`)
            console.log(`[STICKER-NOME] Group ID: ${group?.id || 'N/A'}`)

            // ESTRATÉGIA: Para GRUPOS, buscar SEMPRE nos metadados primeiro (fonte mais confiável)
            if (group) {
                console.log(`[STICKER-NOME] 📋 Buscando nos METADADOS DO GRUPO (fonte principal)...`)
                try {
                    const groupMetadata = await client.groupMetadata(group.id);
                    console.log(`[STICKER-NOME] Total de participantes: ${groupMetadata.participants.length}`)
                    
                    const participant = groupMetadata.participants.find(p => p.id === quotedSender);
                    console.log(`[STICKER-NOME] Participante encontrado?: ${!!participant}`)
                    
                    if (participant) {
                        // Log de toda a estrutura do participante para debug
                        console.log(`[STICKER-NOME] Estrutura do participante:`, JSON.stringify(participant, null, 2))
                        
                        // Tenta várias propriedades possíveis
                        const participantNotify = (participant as any).notify;
                        const participantName = (participant as any).name;
                        const participantVerifiedName = (participant as any).verifiedName;
                        
                        console.log(`[STICKER-NOME] - notify: "${participantNotify || 'vazio'}"`)
                        console.log(`[STICKER-NOME] - name: "${participantName || 'vazio'}"`)
                        console.log(`[STICKER-NOME] - verifiedName: "${participantVerifiedName || 'vazio'}"`)
                        
                        const metadataName = participantNotify || participantName || participantVerifiedName;
                        if (metadataName && metadataName.trim().length > 0) {
                            authorName = metadataName.trim();
                            console.log(`[STICKER-NOME] ✅ Nome encontrado nos METADADOS: "${authorName}"`)
                            
                            // Salva no banco para próxima vez
                            await userController.setName(quotedSender, authorName);
                            console.log(`[STICKER-NOME] 💾 Nome salvo no banco`)
                        } else {
                            console.log(`[STICKER-NOME] ⚠️ Participante existe mas sem nome nos metadados`)
                        }
                    } else {
                        console.log(`[STICKER-NOME] ⚠️ Participante NÃO encontrado nos metadados`)
                        console.log(`[STICKER-NOME] Listando alguns IDs dos participantes:`)
                        groupMetadata.participants.slice(0, 3).forEach((p, i) => {
                            console.log(`[STICKER-NOME]   ${i + 1}. ${p.id}`)
                        })
                    }
                } catch (groupErr) {
                    console.log(`[STICKER-NOME] ❌ ERRO ao buscar metadados:`, groupErr);
                }
            }

            // Se ainda não encontrou, tenta outras fontes
            if (authorName === 'Membro do grupo') {
                console.log(`[STICKER-NOME] ⏩ Tentando fontes alternativas...`)
                
                // 1. notifyName do contextInfo
                const pushName = message.quotedMessage?.pushname;
                console.log(`[STICKER-NOME] 1️⃣ contextInfo.notifyName: "${pushName || 'vazio'}"`)
                if (pushName?.trim()) {
                    authorName = pushName.trim();
                    console.log(`[STICKER-NOME] ✅ Encontrado no contextInfo`)
                }
                
                // 2. Banco de dados
                if (authorName === 'Membro do grupo') {
                    const user = await userController.getUser(quotedSender);
                    console.log(`[STICKER-NOME] 2️⃣ Banco de dados: "${user?.name || 'vazio'}"`)
                    if (user?.name?.trim()) {
                        authorName = user.name.trim();
                        console.log(`[STICKER-NOME] ✅ Encontrado no banco`)
                    }
                }
                
                // 3. Store de contatos (contacts.update)
                if (authorName === 'Membro do grupo') {
                    const contact = getContactFromStore(quotedSender);
                    console.log(`[STICKER-NOME] 3️⃣ Store de contatos: notify="${contact?.notify || 'vazio'}", name="${contact?.name || 'vazio'}"`)
                    const contactName = contact?.notify || contact?.name || contact?.verifiedName;
                    if (contactName?.trim()) {
                        authorName = contactName.trim();
                        console.log(`[STICKER-NOME] ✅ Encontrado no store de contatos`)
                        // Salva no banco para próxima vez
                        await userController.setName(quotedSender, authorName);
                    }
                }
            }

            console.log(`[STICKER-NOME] 🎯 NOME FINAL USADO: "${authorName}"`)
            console.log(`[STICKER-NOME] ========================================\n`)

        } catch (err) {
            console.log(`[STICKER] ❌ Erro geral ao buscar nome:`, err);
        }
        
        // Obter horário
        const now = new Date()
        const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

        const imageBuffer = await quoteUtil.createWhatsAppBubble({
            text: quotedText,
            authorName: authorName,
            avatarUrl: avatarUrl,
            time: time
        })

        const authorText = buildText(stickerCommands.s.msgs.author_text, message.pushname)
        const stickerBuffer = await stickerUtil.createSticker(imageBuffer, {pack: botInfo.name, author: authorText, fps: 9, type: 'resize'})
        await waUtil.sendSticker(client, message.chat_id, stickerBuffer, {expiration: message.expiration})
        return
    }

    // Comportamento original para imagens/vídeos
    if (messageData.type != "imageMessage" && messageData.type != "videoMessage") {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    } else if (messageData.type == "videoMessage" && messageData.seconds && messageData.seconds  > 9) {
        throw new Error(stickerCommands.s.msgs.error_limit)
    }
    
    const mediaBuffer = await waUtil.downloadMessageAsBuffer(client, messageData.message)
    const authorText = buildText(stickerCommands.s.msgs.author_text, message.pushname)
    const stickerBuffer = await stickerUtil.createSticker(mediaBuffer, {pack: botInfo.name, author: authorText, fps: 9, type: stickerType})
    await waUtil.sendSticker(client, message.chat_id, stickerBuffer, { expiration: message.expiration })
}

export async function simgCommand(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    if (!message.isQuoted || !message.quotedMessage) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    } else if (message.quotedMessage.type != "stickerMessage") {
        throw new Error(stickerCommands.simg.msgs.error_sticker)
    }

    let messageQuotedData = message.quotedMessage.wa_message

    if (messageQuotedData.message?.stickerMessage?.url == "https://web.whatsapp.net") {
        messageQuotedData.message.stickerMessage.url = `https://mmg.whatsapp.net${messageQuotedData.message.stickerMessage.directPath}` 
    }

    const stickerBuffer = await waUtil.downloadMessageAsBuffer(client, message.quotedMessage.wa_message)
    const imageBuffer = await stickerUtil.stickerToImage(stickerBuffer)
    await waUtil.replyFileFromBuffer(client, message.chat_id, 'imageMessage', imageBuffer, '', message.wa_message, {expiration: message.expiration, mimetype: 'image/png'})
}

export async function ssfCommand(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    let messageData = {
        type : (message.isQuoted) ? message.quotedMessage?.type : message.type,
        message: (message.isQuoted) ? message.quotedMessage?.wa_message : message.wa_message
    }

    if (!messageData.type || !messageData.message) {
        throw new Error(stickerCommands.ssf.msgs.error_message)
    } else if (messageData.type != "imageMessage") {
        throw new Error(stickerCommands.ssf.msgs.error_image)
    }

    await waUtil.replyText(client, message.chat_id, stickerCommands.ssf.msgs.wait, message.wa_message, {expiration: message.expiration})
    const mediaBuffer = await waUtil.downloadMessageAsBuffer(client, messageData.message)
    const imageBuffer = await imageUtil.removeBackground(mediaBuffer)
    const authorText = buildText(stickerCommands.ssf.msgs.author_text, message.pushname)
    const stickerBuffer = await stickerUtil.createSticker(imageBuffer, {pack: botInfo.name, author: authorText, fps: 9, type: 'resize'})
    await waUtil.sendSticker(client, message.chat_id, stickerBuffer, {expiration: message.expiration})
}

export async function emojimixCommand(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    if (!message.args.length) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    }

    const [emoji1, emoji2] = message.text_command.split("+")

    if (!emoji1 || !emoji2) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    }

    const supportEmoji = await imageUtil.checkEmojiMixSupport(emoji1.trim(), emoji2.trim())

    if (!supportEmoji.emoji1 && !supportEmoji.emoji2) {
        throw new Error(buildText(stickerCommands.emojimix.msgs.error_emojis, emoji1, emoji2))
    } else if (!supportEmoji.emoji1) {
        throw new Error(buildText(stickerCommands.emojimix.msgs.error_emoji, emoji1))
    } else if (!supportEmoji.emoji2) {
        throw new Error(buildText(stickerCommands.emojimix.msgs.error_emoji, emoji2))
    }

    const imageBuffer = await imageUtil.emojiMix(emoji1.trim(), emoji2.trim())

    if (!imageBuffer) {
        throw new Error(stickerCommands.emojimix.msgs.error_not_found)
    } 

    const authorText = buildText(stickerCommands.emojimix.msgs.author_text, message.pushname)
    const stickerBuffer = await stickerUtil.createSticker(imageBuffer, {pack: botInfo.name, author: authorText, fps: 9, type: 'resize'})
    await waUtil.sendSticker(client, message.chat_id, stickerBuffer, {expiration: message.expiration})
}

export async function snomeCommand(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    if (!message.isQuoted || message.quotedMessage?.type != "stickerMessage") {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    } 

    let [pack, author] = message.text_command.split(',')

    if (!pack || !author) {
        throw new Error(messageErrorCommandUsage(botInfo.prefix, message))
    }

    let messageQuotedData = message.quotedMessage.wa_message

    if (!messageQuotedData.message?.stickerMessage) {
        throw new Error(stickerCommands.snome.msgs.error_message)
    }

    if (messageQuotedData.message.stickerMessage.url == "https://web.whatsapp.net") {
        messageQuotedData.message.stickerMessage.url = `https://mmg.whatsapp.net${messageQuotedData.message.stickerMessage.directPath}` 
    }

    const stickerBuffer = await waUtil.downloadMessageAsBuffer(client, messageQuotedData)
    const stickerRenamedBuffer = await stickerUtil.renameSticker(stickerBuffer, pack, author)
    await waUtil.sendSticker(client, message.chat_id, stickerRenamedBuffer, {expiration: message.expiration})
}

export async function autoSticker(client: WASocket, botInfo: Bot, message: Message, group? : Group){
    if (message.type != 'imageMessage' && message.type != "videoMessage") {
        return
    } else if (message.type == "videoMessage" && message.media?.seconds && message.media?.seconds > 9) {
        return
    }

    let mediaBuffer = await waUtil.downloadMessageAsBuffer(client, message.wa_message)
    const authorText = buildText(stickerCommands.s.msgs.author_text, message.pushname)
    let stickerBuffer = await stickerUtil.createSticker(mediaBuffer, {pack: botInfo.name, author: authorText, fps: 9, type: 'resize'})
    await waUtil.sendSticker(client, message.chat_id, stickerBuffer, {expiration: message.expiration})
}


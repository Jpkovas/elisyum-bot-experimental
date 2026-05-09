import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs-extra'
import crypto from 'node:crypto'
import webp from "node-webpmux"
import {getTempPath, showConsoleLibraryError} from './general.util.js'
import {fileTypeFromBuffer} from 'file-type'
import { Jimp } from 'jimp'
import { StickerOptions, StickerType } from "../interfaces/library.interface.js"
import botTexts from '../helpers/bot.texts.helper.js'

const MAX_WEBP_INPUT_BYTES = 12 * 1024 * 1024
const MAX_PNG_OUTPUT_BYTES = 20 * 1024 * 1024
const WEBP_TO_PNG_TIMEOUT_MS = 8 * 1000

function removeFileIfExists(filePath?: string) {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
    }
}

function runFfmpegToFile(command: ReturnType<typeof ffmpeg>, outputPath: string, timeoutMessage: string) {
    return new Promise<void>((resolve, reject) => {
        let settled = false
        const timeoutId = setTimeout(() => {
            command.kill('SIGKILL')
            finish(reject, new Error(timeoutMessage))
        }, WEBP_TO_PNG_TIMEOUT_MS)

        const finish = (callback: (value?: any) => void, value?: any) => {
            if (settled) {
                return
            }

            settled = true
            clearTimeout(timeoutId)
            callback(value)
        }

        command
            .on('end', () => finish(resolve))
            .on('error', (err: Error) => finish(reject, err))
            .save(outputPath)
    })
}

export async function createSticker(mediaBuffer : Buffer, {pack = 'Ξ ʟ ʏ s ɪ ᴜ ᴍ  ɮ ᴏ ᴛ™', author = 'Elisyum Stickers', fps = 9, type = 'resize'}: StickerOptions){
    try {
        const bufferSticker = await stickerCreation(mediaBuffer, {pack, author, fps, type})

        return bufferSticker
    } catch(err){
        showConsoleLibraryError(err, 'createSticker')
        throw new Error(botTexts.library_error)
    }
}

export async function renameSticker(stickerBuffer: Buffer, pack: string, author: string){
    try {
        const stickerBufferModified = await addExif(stickerBuffer, pack, author)

        return stickerBufferModified
    } catch(err){
        showConsoleLibraryError(err, 'renameSticker')
        throw new Error(botTexts.library_error)
    }
}

export async function stickerToImage(stickerBuffer: Buffer){
    try {
        return await convertWebpToPng(stickerBuffer)
    } catch(err){
        showConsoleLibraryError(err, 'stickerToImage')
        throw new Error(botTexts.library_error)
    }
}

async function stickerCreation(mediaBuffer : Buffer, {author, pack, fps, type} : StickerOptions){
    try{
        const bufferData = await fileTypeFromBuffer(mediaBuffer)

        if(!bufferData) {
            throw new Error("Unable to retrieve data from sent media.")
        } 

        const mime = bufferData.mime
        const isAnimated = mime.startsWith('video') || mime.includes('gif') 

        if (mime == 'image/webp') mediaBuffer = await pngConvertion(mediaBuffer)

        const webpBuffer = await webpConvertion(mediaBuffer, isAnimated, fps, type)
        const stickerBuffer = await addExif(webpBuffer, pack, author)

        return stickerBuffer
    } catch(err){
        throw err
    }   
}

async function addExif(buffer: Buffer, pack: string, author: string){
    try{
        const img = new webp.Image()
        const stickerPackId = crypto.randomBytes(32).toString('hex')
        const json = { 'sticker-pack-id': stickerPackId, 'sticker-pack-name': pack, 'sticker-pack-publisher': author}
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8')
        const exif = Buffer.concat([exifAttr, jsonBuffer])
        exif.writeUIntLE(jsonBuffer.length, 14, 4)
        await img.load(buffer)
        img.exif = exif
        const stickerBuffer : Buffer = await img.save(null)

        return stickerBuffer
    } catch(err){
        throw err
    }
}

async function pngConvertion(mediaBuffer : Buffer){
    return convertWebpToPng(mediaBuffer)
}

async function convertWebpToPng(mediaBuffer : Buffer){
    if (mediaBuffer.length > MAX_WEBP_INPUT_BYTES) {
        throw new Error('WebP image is too large to convert safely.')
    }

    let inputMediaPath: string | undefined
    let outputMediaPath: string | undefined

    try {
        inputMediaPath = getTempPath('webp')
        outputMediaPath = getTempPath('png')
        fs.writeFileSync(inputMediaPath, mediaBuffer)

        const command = ffmpeg(inputMediaPath)
            .outputOptions(['-frames:v 1'])

        await runFfmpegToFile(command, outputMediaPath, 'FFmpeg WebP conversion timeout')

        const outputStats = fs.statSync(outputMediaPath)
        if (outputStats.size > MAX_PNG_OUTPUT_BYTES) {
            throw new Error('Converted PNG is too large to process safely.')
        }

        const pngBuffer = fs.readFileSync(outputMediaPath)

        return pngBuffer
    } catch(err) {
        throw err
    } finally {
        removeFileIfExists(outputMediaPath)
        removeFileIfExists(inputMediaPath)
    }
}

async function webpConvertion(mediaBuffer : Buffer, isAnimated: boolean, fps: number, type : StickerType){
    try {
        let inputMediaPath
        let options
        let outputMediaPath = getTempPath('webp')

        if(isAnimated){
            inputMediaPath = getTempPath('mp4')
            options = [
                "-vcodec libwebp",
                "-filter:v",
                `fps=fps=${fps}`,
                "-lossless 0",
                "-compression_level 4",
                "-q:v 10",
                "-loop 1",
                "-preset picture",
                "-an",
                "-vsync 0",
                "-s 512:512"
            ]
        } else{
            inputMediaPath = getTempPath('png')
            mediaBuffer = await editImage(mediaBuffer, type)
            options = [
                "-vcodec libwebp",
                "-loop 0",
                "-lossless 1",
                "-q:v 100"
            ]
        }

        fs.writeFileSync(inputMediaPath, mediaBuffer)

        await new Promise <void>((resolve, reject) => {
            ffmpeg(inputMediaPath)
            .outputOptions(options)
            .save(outputMediaPath)
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(err))
        }).catch((err: any)=>{
            fs.unlinkSync(inputMediaPath)
            throw err
        })

        const webpBuffer = fs.readFileSync(outputMediaPath)
        fs.unlinkSync(outputMediaPath)
        fs.unlinkSync(inputMediaPath)

        return webpBuffer
    } catch(err){
        throw err
    }
}

async function editImage(imageBuffer: Buffer, type: StickerType){
    try{
        const image = await Jimp.read(imageBuffer)
    
        if (type === 'resize'){
            image.resize({ w: 512, h: 512 })
        } else if (type === 'contain'){
            image.contain({ w: 512, h: 512 })
        } else if(type === 'circle'){
            image.resize({ w: 512, h: 512 })
            image.circle()
        }

        return image.getBuffer('image/png')
    } catch(err){
        throw err
    }
}

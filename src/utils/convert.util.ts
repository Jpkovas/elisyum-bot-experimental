import fs from 'fs-extra'
import axios from 'axios'
import {getTempPath, showConsoleLibraryError} from './general.util.js'
import botTexts from '../helpers/bot.texts.helper.js'
import { runFfmpeg } from './ffmpeg.util.js'

export async function convertMp4ToMp3 (sourceType: 'buffer' | 'url',  video: Buffer | string){
    try {
        const inputVideoPath = getTempPath('mp4')
        const outputAudioPath = getTempPath('mp3')

        if(sourceType == 'buffer'){
            if(!Buffer.isBuffer(video)) {
                throw new Error("The media type is Buffer, but the video parameter is not a Buffer.")
            }
                
            fs.writeFileSync(inputVideoPath, video)
        } else if (sourceType == 'url'){
            if(typeof video != 'string') {
                throw new Error("The media type is URL, but the video parameter is not a String.")
            }

            const {data : mediaResponse} = await axios.get(video, {responseType: 'arraybuffer'})
            const videoBuffer = Buffer.from(mediaResponse)
            fs.writeFileSync(inputVideoPath, videoBuffer)
        } else {
            throw new Error("Unsupported media type.")
        }
        
        try {
            await runFfmpeg([
                '-y',
                '-i',
                inputVideoPath,
                '-vn',
                '-codec:a',
                'libmp3lame',
                '-q:a',
                '3',
                outputAudioPath
            ])

            const audioBuffer = fs.readFileSync(outputAudioPath)
            return audioBuffer
        } finally {
            if (fs.existsSync(inputVideoPath)) {
                fs.unlinkSync(inputVideoPath)
            }

            if (fs.existsSync(outputAudioPath)) {
                fs.unlinkSync(outputAudioPath)
            }
        }
    } catch(err){
        showConsoleLibraryError(err, 'convertMp4ToMp3')
        throw new Error(botTexts.library_error)
    }
}

export async function convertVideoToWhatsApp(sourceType: 'buffer' | 'url',  video: Buffer | string){
    try {
        const inputVideoPath = getTempPath('mp4')
        const outputVideoPath = getTempPath('mp4')

        if(sourceType == 'buffer'){
            if (!Buffer.isBuffer(video)) {
                throw new Error('The media type is Buffer, but the video parameter is not a Buffer.')
            }
                
            fs.writeFileSync(inputVideoPath, video)
        } else if (sourceType == 'url'){
            if (typeof video != 'string') {
                throw new Error('The media type is URL, but the video parameter is not a String.')
            } 

            const {data : mediaResponse} = await axios.get(video, {responseType: 'arraybuffer'})
            const videoBuffer = Buffer.from(mediaResponse)
            fs.writeFileSync(inputVideoPath, videoBuffer)
        } else {
            throw new Error('Unsupported media type.')
        }
        
        try {
            await runFfmpeg([
                '-y',
                '-i',
                inputVideoPath,
                '-c:v',
                'libx264',
                '-profile:v',
                'baseline',
                '-level',
                '3.0',
                '-pix_fmt',
                'yuv420p',
                '-movflags',
                'faststart',
                '-crf',
                '23',
                '-preset',
                'fast',
                '-c:a',
                'aac',
                '-b:a',
                '128k',
                '-ar',
                '44100',
                '-f',
                'mp4',
                outputVideoPath
            ])

            const videoBuffer = fs.readFileSync(outputVideoPath)
            return videoBuffer
        } finally {
            if (fs.existsSync(inputVideoPath)) {
                fs.unlinkSync(inputVideoPath)
            }

            if (fs.existsSync(outputVideoPath)) {
                fs.unlinkSync(outputVideoPath)
            }
        }
    } catch(err){
        showConsoleLibraryError(err, 'convertVideoToWhatsApp')
        throw new Error(botTexts.library_error)
    }
}

export async function convertVideoToThumbnail(sourceType : "file"|"buffer"|"url", video : Buffer | string){
    try{
        let inputPath : string | undefined
        const outputThumbnailPath = getTempPath('jpg')

        if(sourceType == "file"){
            if (typeof video !== 'string') {
                throw new Error('The media type is File, but the video parameter is not a String.')
            }
        
            inputPath = video
        } else if(sourceType == "buffer"){
            if (!Buffer.isBuffer(video)) {
                throw new Error('The media type is Buffer, but the video parameter is not a Buffer.')
            } 
            
            inputPath = getTempPath('mp4')
            fs.writeFileSync(inputPath, video)
        } else if(sourceType == "url"){
            if (typeof video !== 'string'){
                throw new Error('The media type is URL, but the video parameter is not a String.')
            } 

            const responseUrlBuffer = await axios.get(video,  { responseType: 'arraybuffer' })
            const bufferUrl = Buffer.from(responseUrlBuffer.data, "utf-8")
            inputPath = getTempPath('mp4')
            fs.writeFileSync(inputPath, bufferUrl)
        }

        try {
            await runFfmpeg([
                '-y',
                '-ss',
                '00:00:00',
                '-i',
                inputPath as string,
                '-vf',
                'scale=32:-1',
                '-vframes',
                '1',
                '-f',
                'image2',
                outputThumbnailPath
            ])

            const thumbBase64 : Base64URLString = fs.readFileSync(outputThumbnailPath).toString('base64')
            return thumbBase64
        } finally {
            if (sourceType != 'file' && inputPath && fs.existsSync(inputPath)) {
                fs.unlinkSync(inputPath)
            }

            if (fs.existsSync(outputThumbnailPath)) {
                fs.unlinkSync(outputThumbnailPath)
            }
        }
    } catch(err){
        showConsoleLibraryError(err, 'convertVideoToThumbnail')
        throw new Error(botTexts.library_error)
    }
}

export async function extractAudioFromVideo(sourceType : "file"|"buffer"|"url", video : Buffer | string){
    let inputVideoPath = getTempPath('mp4')
    const outputAudioPath = getTempPath('mp3')

    if(sourceType == "file"){
        if (typeof video !== 'string') {
            throw new Error('The media type is File, but the video parameter is not a String.')
        }

        inputVideoPath = video
    } else if (sourceType == 'buffer'){
        if (!Buffer.isBuffer(video)) {
            throw new Error('The media type is Buffer, but the video parameter is not a Buffer.')
        }

        fs.writeFileSync(inputVideoPath, video)
    } else if (sourceType == 'url'){
        if (typeof video != 'string') {
            throw new Error('The media type is URL, but the video parameter is not a String.')
        }

        const {data : mediaResponse} = await axios.get(video, {responseType: 'arraybuffer'})
        const videoBuffer = Buffer.from(mediaResponse)
        fs.writeFileSync(inputVideoPath, videoBuffer)
    } else {
        throw new Error('Unsupported media type.')
    }

    try {
        await runFfmpeg([
            '-y',
            '-i',
            inputVideoPath,
            '-vn',
            '-codec:a',
            'libmp3lame',
            '-b:a',
            '192k',
            '-f',
            'mp3',
            outputAudioPath
        ])

        const audioBuffer = fs.readFileSync(outputAudioPath)
        return audioBuffer
    } finally {
        if (sourceType != 'file' && inputVideoPath && fs.existsSync(inputVideoPath)){
            fs.unlinkSync(inputVideoPath)
        }

        if (fs.existsSync(outputAudioPath)) {
            fs.unlinkSync(outputAudioPath)
        }
    }

}
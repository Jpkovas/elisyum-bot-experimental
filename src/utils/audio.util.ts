import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs-extra'
import {getTempPath, showConsoleLibraryError} from './general.util.js'
import { convertMp4ToMp3 } from './convert.util.js'
import format from 'format-duration'
import {createClient} from '@deepgram/sdk'
import {fileTypeFromBuffer, FileTypeResult} from 'file-type'
import axios, { AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import { AudioModificationType, MusicRecognition } from '../interfaces/library.interface.js'
import crypto from 'node:crypto'
import botTexts from '../helpers/bot.texts.helper.js'
import { getEnvList, getRequiredEnv } from './env.util.js'

function getDeepgramKeys(){
    const keys = getEnvList('DEEPGRAM_API_KEYS')
    const singleKey = process.env.DEEPGRAM_API_KEY?.trim()

    if (keys.length) {
        return keys
    }

    return singleKey ? [singleKey] : []
}

function normalizeAcrCloudHost(rawHost: string){
    const withoutProtocol = rawHost.trim().replace(/^https?:\/\//i, '')
    const host = withoutProtocol.split('/')[0].toLowerCase()

    if (!host || !/^[a-z0-9.-]+$/.test(host)) {
        throw new Error('Invalid ACRCloud host')
    }

    const isAllowedHost = host === 'acrcloud.com' || host.endsWith('.acrcloud.com') || host.endsWith('.acrcloud.cn')

    if (!isAllowedHost) {
        throw new Error('Untrusted ACRCloud host')
    }

    return host
}

function getAcrCloudKeys(){
    return [{
        host: normalizeAcrCloudHost(getRequiredEnv('ACRCLOUD_HOST')),
        access_key: getRequiredEnv('ACRCLOUD_ACCESS_KEY'),
        secret_key: getRequiredEnv('ACRCLOUD_SECRET_KEY'),
    }]
}

const GOOGLE_TTS_MAX_CHARS = 180

function splitTextForSpeech(text: string) {
    const words = text.trim().split(/\s+/).filter(Boolean)
    const chunks: string[] = []
    let current = ''

    for (const word of words) {
        if (!current) {
            current = word
            continue
        }

        if (`${current} ${word}`.length > GOOGLE_TTS_MAX_CHARS) {
            chunks.push(current)
            current = word
            continue
        }

        current = `${current} ${word}`
    }

    if (current) {
        chunks.push(current)
    }

    return chunks
}

export async function audioTranscription (audioBuffer : Buffer){
    try {
        const apiKeys = getDeepgramKeys()
        let error : any | undefined

        if (!apiKeys.length) {
            throw new Error('DEEPGRAM_API_KEY is not configured')
        }

        for (let secretKey of apiKeys){
            try {
                const deepgram = createClient(secretKey)
                const deepgramConfig = {
                    model: 'nova-2',
                    language: 'pt-BR',
                    smart_format: true, 
                }
        
                const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, deepgramConfig)
                
                if (error) {
                    throw new Error("An error occurred while trying to get the audio transcript")
                }
        
                return result.results.channels[0].alternatives[0].transcript
            } catch(err: any) {
                error = err
            }
        }

        throw error
    } catch(err){
        showConsoleLibraryError(err, 'audioTranscription')
        throw new Error(botTexts.library_error)
    }
}

export async function musicRecognition (mediaBuffer : Buffer){
    try {
        const apiKeys = getAcrCloudKeys()
        let error : any | undefined

        for (let key of apiKeys){
            try {
                const ENDPOINT = '/v1/identify'
                const URL_BASE = 'https://'+ key.host + ENDPOINT
                const { mime } = await fileTypeFromBuffer(mediaBuffer) as FileTypeResult
                let audioBuffer : Buffer | undefined
        
                if (!mime.startsWith('video') && !mime.startsWith('audio')){
                    throw new Error('This file type is not supported')
                } else if(mime.startsWith('video')) {
                    audioBuffer = await convertMp4ToMp3('buffer', mediaBuffer)
                } else {
                    audioBuffer = mediaBuffer
                }
        
                const timestamp = (new Date().getTime()/1000).toFixed(0).toString()
                const signatureString = ['POST', ENDPOINT, key.access_key, 'audio', 1, timestamp].join('\n')
                const signature =  crypto.createHmac('sha1', key.secret_key).update(Buffer.from(signatureString, 'utf-8')).digest().toString('base64');
                const formData = new FormData()
                formData.append('access_key', key.access_key)
                formData.append('data_type', 'audio')
                if (!audioBuffer) throw new Error('Audio buffer is undefined')
                formData.append('sample', audioBuffer)
                formData.append('sample_bytes', (audioBuffer as Buffer).length)
                formData.append('signature_version', 1)
                formData.append('signature', signature)
                formData.append('timestamp', timestamp)
                
                const config : AxiosRequestConfig = {
                    url: URL_BASE,
                    method: 'POST',
                    data: formData
                }
        
                const { data : recognitionResponse} = await axios.request(config)
        
                if (recognitionResponse.status.code == 1001){
                    return null
                } else if(recognitionResponse.status.code == 3003 || recognitionResponse.status.code == 3015){
                    throw new Error("You have exceeded your ACRCloud limit")
                } else if (recognitionResponse.status.code == 3000){
                    throw new Error('There was an error on the ACRCloud server')
                }

                const arrayReleaseDate = recognitionResponse.metadata.humming[0].release_date ? recognitionResponse.metadata.humming[0].release_date.split("-") : []
                const artists : string[] = recognitionResponse.metadata.humming[0].artists.map((artist : {name: string}) => artist.name)    
                const musicRecognition : MusicRecognition = {
                    producer : recognitionResponse.metadata.humming[0].label || "-----",
                    duration: format(recognitionResponse.metadata.humming[0].duration_ms),
                    release_date: arrayReleaseDate.length ? `${arrayReleaseDate[2]}/${arrayReleaseDate[1]}/${arrayReleaseDate[0]}` : '-----',
                    album: recognitionResponse.metadata.humming[0].album.name,
                    title: recognitionResponse.metadata.humming[0].title,
                    artists: artists.toString()
                }
                
                return musicRecognition
            } catch(err: any) {
                error = err
            }
        }

        throw error
    } catch(err){
        showConsoleLibraryError(err, 'musicRecognition')
        throw new Error(botTexts.library_error)
    }
}

export async function textToVoice (lang: "pt" | 'en' | 'ja' | 'es' | 'it' | 'ru' | 'ko' | 'sv', text: string){
    try {
        const chunks = splitTextForSpeech(text)

        if (!chunks.length) {
            throw new Error('Text is empty')
        }

        const audioChunks = await Promise.all(chunks.map(async (chunk) => {
            const ttsUrl = new URL('https://translate.google.com/translate_tts')
            ttsUrl.searchParams.set('ie', 'UTF-8')
            ttsUrl.searchParams.set('client', 'tw-ob')
            ttsUrl.searchParams.set('tl', lang)
            ttsUrl.searchParams.set('q', chunk)

            const { data } = await axios.get<ArrayBuffer>(ttsUrl.toString(), {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
            })

            return Buffer.from(data)
        }))

        return Buffer.concat(audioChunks)
    } catch(err){
        showConsoleLibraryError(err, 'textToVoice')
        throw new Error(botTexts.library_error)
    }
}

export async function audioModified (audioBuffer: Buffer, type: AudioModificationType){
    try {
        const inputAudioPath = getTempPath('mp3')
        const outputAudioPath = getTempPath('mp3')
        let options : string[] = []
        fs.writeFileSync(inputAudioPath, audioBuffer)

        switch(type){
            case "estourar":
                options = ["-y", "-filter_complex", "acrusher=level_in=3:level_out=5:bits=10:mode=log:aa=1"] 
                break
            case "reverso":
                options = ["-y", "-filter_complex", "areverse"]
                break
            case "grave":
                options = ["-y", "-af", "asetrate=44100*0.5,aresample=44100,atempo=1.20"]
                break
            case "agudo":
                options = ["-y", "-af", "asetrate=44100*1.1,aresample=44100,atempo=0.70"]
                break
            case "x2":
                options = ["-y", "-filter:a", "atempo=2.0", "-vn"]
                break
            case "volume":
                options = ["-y", "-filter:a", "volume=4.0"]
                break
            default:
                fs.unlinkSync(inputAudioPath)
                throw new Error(`This type of editing is not supported`)
        }
        
        await new Promise <void>((resolve, reject) => {
            ffmpeg(inputAudioPath)
            .outputOptions(options)
            .save(outputAudioPath)
            .on('end', () => resolve())
            .on("error", (err: Error) => reject(err))
        }).catch((err: any)=>{
            fs.unlinkSync(inputAudioPath)
            throw err
        })

        const bufferModifiedAudio = fs.readFileSync(outputAudioPath)
        fs.unlinkSync(inputAudioPath)
        fs.unlinkSync(outputAudioPath)
        
        return bufferModifiedAudio
    } catch(err){
        showConsoleLibraryError(err, 'audioTranscription')
        throw new Error(botTexts.library_error)
    }
}

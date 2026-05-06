import axios from 'axios'
import {getRandomFilename, showConsoleLibraryError} from './general.util.js'
import format from 'format-duration'
import FormData from 'form-data'
import getEmojiMixUrl, { checkSupported } from 'emoji-mixer'
import { AnimeRecognition, ImageSearch } from '../interfaces/library.interface.js'
import botTexts from '../helpers/bot.texts.helper.js'

export async function uploadImage(imageBuffer : Buffer){
    try {
        const formData = new FormData()
        formData.append('files[]', imageBuffer, {
            filename: getRandomFilename('png'),
            contentType: 'image/png',
        })

        const { data } = await axios.post('https://uguu.se/upload.php', formData, {
            headers: formData.getHeaders(),
            timeout: 60000,
        })

        const uploadedUrl = data?.files?.[0]?.url

        if (!uploadedUrl) {
            throw new Error('Image upload did not return a URL')
        }

        return uploadedUrl as string
    } catch(err){
        showConsoleLibraryError(err, 'uploadImage')
        throw new Error(botTexts.library_error)
    }
}

export async function checkEmojiMixSupport(emoji1: string, emoji2: string){
    try {
        const emojiSupport = {
            emoji1 : checkSupported(emoji1, true) ? true : false,
            emoji2 : checkSupported(emoji2, true) ? true : false
        }

        return emojiSupport
    } catch(err){
        showConsoleLibraryError(err, 'checkEmojiMixSupport')
        throw new Error(botTexts.library_error)
    }
}

export async function emojiMix(emoji1: string, emoji2: string){
    try {
        const emojiUrl = getEmojiMixUrl(emoji1, emoji2, false, true)

        if(!emojiUrl) {
            return null
        }
        
        const { data : imageBuffer} = await axios.get(emojiUrl, {responseType: 'arraybuffer'})

        return imageBuffer as Buffer
    } catch(err){
        showConsoleLibraryError(err, 'emojiMix')
        throw new Error(botTexts.library_error)
    }
}

export async function animeRecognition(imageBuffer : Buffer){ 
    try {
        const URL_BASE = 'https://api.trace.moe/search?anilistInfo'
        const requestConfig: RequestInit = {
            method: "POST",
            // Node Buffer is acceptable at runtime, cast to any for TypeScript
            body: imageBuffer as unknown as any,
            headers: { 
                "Content-type": "image/jpeg" 
            },
        }

        const animesResponse = await fetch(URL_BASE, requestConfig).catch((err)=>{
            if (err.status == 429){
                throw new Error('Too many requests at moment.')
            } else if (err.status == 400){
                return null
            } else {
                throw err
            }
        })

        if(!animesResponse) {
            return null
        }

    const animesJson: any = await animesResponse.json()
    const {result : animes} = animesJson
        const msInitial = Math.round(animes[0].from * 1000) 
        const msFinal = Math.round(animes[0].to * 1000)
        const animeInfo : AnimeRecognition = {
            initial_time : format(msInitial),
            final_time: format(msFinal),
            episode: animes[0].episode,
            title: animes[0].anilist.title.english || animes[0].anilist.title.romaji,
            similarity: parseInt((animes[0].similarity * 100).toFixed(2)),
            preview_url: animes[0].video
        }

        return animeInfo
    } catch(err){
        showConsoleLibraryError(err, 'animeRecognition')
        throw new Error(botTexts.library_error)
    }
}

export async function imageSearchGoogle(text: string){
    try {
        const landingUrl = new URL('https://duckduckgo.com/')
        landingUrl.searchParams.set('q', text)
        landingUrl.searchParams.set('iax', 'images')
        landingUrl.searchParams.set('ia', 'images')

        const requestHeaders = {
            'User-Agent': 'Mozilla/5.0',
        }

        const { data: landingHtml } = await axios.get<string>(landingUrl.toString(), {
            headers: requestHeaders,
            timeout: 30000,
        })
        const tokenMatch = landingHtml.match(/"vqd"\s*:\s*"([^"]+)"/) || landingHtml.match(/vqd=["']?([^"'&\s]+)["']?/) || landingHtml.match(/vqd=([^&\s]+)/)
        const token = tokenMatch?.[1]

        if (!token) {
            throw new Error('Image search token was not returned')
        }

        const searchUrl = new URL('https://duckduckgo.com/i.js')
        searchUrl.searchParams.set('l', 'br-pt')
        searchUrl.searchParams.set('o', 'json')
        searchUrl.searchParams.set('q', text)
        searchUrl.searchParams.set('vqd', token)
        searchUrl.searchParams.set('f', ',,,')
        searchUrl.searchParams.set('p', '-1')

        const { data: searchResponse } = await axios.get<{
            results?: Array<{
                height?: number,
                image?: string,
                source?: string,
                thumbnail?: string,
                title?: string,
                url?: string,
                width?: number,
            }>
        }>(searchUrl.toString(), {
            headers: {
                ...requestHeaders,
                Referer: landingUrl.toString(),
            },
            timeout: 30000,
        })

        const images = searchResponse.results || []

        if (!images.length) {
            throw new Error("Nenhum resultado foi encontrado para esta pesquisa.")
        }
        
        const imagesResult : ImageSearch[] = images
            .filter(image => image.image)
            .map((image, index) => {
                let domain = ''

                try {
                    domain = new URL(image.url || image.image || '').hostname
                } catch {
                    domain = ''
                }

                return {
                    id: `${index}-${image.image}`,
                    url: image.image as string,
                    width: image.width || 0,
                    height: image.height || 0,
                    color: 0,
                    preview: {
                        url: image.thumbnail || image.image as string,
                        width: image.width || 0,
                        height: image.height || 0,
                    },
                    origin: {
                        title: image.title || '',
                        website: {
                            name: image.source || domain,
                            domain,
                            url: image.url || image.image as string,
                        }
                    }
                }
            })

        return imagesResult
    } catch(err){
        showConsoleLibraryError(err, 'imageSearchGoogle')
        throw new Error(botTexts.library_error)
    }
}

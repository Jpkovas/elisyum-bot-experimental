import axios from 'axios'
import AdmZip from 'adm-zip'
import { showConsoleLibraryError } from './general.util.js'
import crypto from 'node:crypto'
import path from 'node:path'
import fs from 'fs-extra'

type ReleaseAsset = {
    name: string
    browser_download_url: string
}

type ReleaseInfo = {
    tag_name: string
    assets: ReleaseAsset[]
}

const LATEST_RELEASE_URL = 'https://api.github.com/repos/victorsouzaleal/lbot-whatsapp/releases/latest'

function normalizeVersion(version: string) {
    return version.replace(/^v/i, '')
}

function parseVersion(version: string) {
    return normalizeVersion(version).split('.').map(part => Number(part))
}

function parseChecksum(checksumText: string) {
    const match = checksumText.match(/\b[a-f0-9]{64}\b/i)

    if (!match) {
        throw new Error('SHA-256 checksum not found')
    }

    return match[0].toLowerCase()
}

function sha256(buffer: Buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex')
}

function getExpectedAssetName(version: string) {
    return process.env.LBOT_UPDATE_ASSET_NAME || `LBOT-v${normalizeVersion(version)}.zip`
}

function selectUpdateAssets(release: ReleaseInfo) {
    const expectedAssetName = getExpectedAssetName(release.tag_name)
    const packageAsset = release.assets.find(asset => asset.name === expectedAssetName)
    const checksumAsset = release.assets.find(asset => {
        if (!packageAsset) {
            return false
        }

        return asset.name === `${packageAsset.name}.sha256` || asset.name === `${packageAsset.name}.sha256.txt`
    })

    if (!packageAsset) {
        throw new Error(`Expected update asset not found: ${expectedAssetName}`)
    }

    if (!checksumAsset) {
        throw new Error(`Expected checksum asset not found for ${packageAsset.name}`)
    }

    return { packageAsset, checksumAsset }
}

function findEndOfCentralDirectory(zipBuffer: Buffer) {
    const minimumEocdLength = 22
    const maximumCommentLength = 0xffff

    if (zipBuffer.length < minimumEocdLength) {
        throw new Error('Invalid update archive')
    }

    const searchStart = Math.max(0, zipBuffer.length - minimumEocdLength - maximumCommentLength)

    for (let offset = zipBuffer.length - minimumEocdLength; offset >= searchStart; offset--) {
        if (zipBuffer.readUInt32LE(offset) === 0x06054b50) {
            return offset
        }
    }

    throw new Error('Invalid update archive')
}

function readLocalEntryName(zipBuffer: Buffer, localHeaderOffset: number) {
    if (localHeaderOffset < 0 || localHeaderOffset + 30 > zipBuffer.length) {
        throw new Error('Invalid update archive local header')
    }

    if (zipBuffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
        throw new Error('Invalid update archive local header')
    }

    const fileNameLength = zipBuffer.readUInt16LE(localHeaderOffset + 26)
    const fileNameStart = localHeaderOffset + 30
    const fileNameEnd = fileNameStart + fileNameLength

    if (fileNameEnd > zipBuffer.length) {
        throw new Error('Invalid update archive local entry name')
    }

    return zipBuffer.toString('utf8', fileNameStart, fileNameEnd)
}

function getRawZipEntryNames(zipBuffer: Buffer) {
    const eocdOffset = findEndOfCentralDirectory(zipBuffer)
    const centralDirectorySize = zipBuffer.readUInt32LE(eocdOffset + 12)
    const centralDirectoryOffset = zipBuffer.readUInt32LE(eocdOffset + 16)

    if (
        centralDirectorySize === 0xffffffff ||
        centralDirectoryOffset === 0xffffffff ||
        centralDirectoryOffset + centralDirectorySize > zipBuffer.length
    ) {
        throw new Error('Unsupported update archive')
    }

    const names: string[] = []
    let offset = centralDirectoryOffset
    const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize

    while (offset < centralDirectoryEnd) {
        if (offset + 46 > zipBuffer.length || zipBuffer.readUInt32LE(offset) !== 0x02014b50) {
            throw new Error('Invalid update archive central directory')
        }

        const fileNameLength = zipBuffer.readUInt16LE(offset + 28)
        const extraLength = zipBuffer.readUInt16LE(offset + 30)
        const commentLength = zipBuffer.readUInt16LE(offset + 32)
        const localHeaderOffset = zipBuffer.readUInt32LE(offset + 42)
        const fileNameStart = offset + 46
        const fileNameEnd = fileNameStart + fileNameLength

        if (fileNameEnd > zipBuffer.length || fileNameEnd + extraLength + commentLength > zipBuffer.length) {
            throw new Error('Invalid update archive entry name')
        }

        names.push(zipBuffer.toString('utf8', fileNameStart, fileNameEnd))
        names.push(readLocalEntryName(zipBuffer, localHeaderOffset))

        offset = fileNameEnd + extraLength + commentLength
    }

    if (!names.length) {
        throw new Error('Update archive has no entries')
    }

    return names
}

function assertSafeZipEntryName(entryName: string, destinationRoot: string) {
    const normalizedEntryName = entryName.replace(/\\/g, '/')

    if (
        !normalizedEntryName ||
        normalizedEntryName.includes('\0') ||
        normalizedEntryName.startsWith('/') ||
        /^[a-z]:/i.test(normalizedEntryName)
    ) {
        throw new Error(`Unsafe zip entry path: ${entryName}`)
    }

    const resolvedEntryPath = path.resolve(destinationRoot, normalizedEntryName)
    const relativeEntryPath = path.relative(destinationRoot, resolvedEntryPath)

    if (relativeEntryPath.startsWith('..') || path.isAbsolute(relativeEntryPath)) {
        throw new Error(`Unsafe zip entry path: ${entryName}`)
    }
}

function assertSafeZipBuffer(zipBuffer: Buffer, destinationPath: string) {
    const destinationRoot = path.resolve(destinationPath)

    for (const entryName of getRawZipEntryNames(zipBuffer)) {
        assertSafeZipEntryName(entryName, destinationRoot)
    }
}

function assertSafeZipEntries(zip: InstanceType<typeof AdmZip>, destinationPath: string) {
    const destinationRoot = path.resolve(destinationPath)

    for (const entry of zip.getEntries()) {
        assertSafeZipEntryName(entry.entryName, destinationRoot)
    }
}

async function applyStagedUpdate(stagingPath: string, appPath: string) {
    const stagedDistPath = path.join(stagingPath, 'dist')

    if (!fs.existsSync(stagedDistPath)) {
        throw new Error('Update archive does not contain dist/')
    }

    const backupPath = path.join(appPath, `.update-backup-${Date.now()}`)
    const currentDistPath = path.join(appPath, 'dist')
    const backupDistPath = path.join(backupPath, 'dist')

    await fs.ensureDir(backupPath)

    try {
        if (fs.existsSync(currentDistPath)) {
            await fs.move(currentDistPath, backupDistPath)
        }

        await fs.move(stagedDistPath, currentDistPath, { overwrite: true })

        for (const filename of ['package.json', 'LICENSE', 'bun.lock']) {
            const stagedFilePath = path.join(stagingPath, filename)

            if (fs.existsSync(stagedFilePath)) {
                await fs.copy(stagedFilePath, path.join(appPath, filename), { overwrite: true })
            }
        }

        await fs.remove(backupPath)
    } catch (error) {
        if (fs.existsSync(backupDistPath)) {
            await fs.remove(currentDistPath)
            await fs.move(backupDistPath, currentDistPath, { overwrite: true })
        }

        throw error
    }
}

export async function checkUpdate(currentBotVersion : string){
    try {
        const [currentMajor, currentMinor, currentPatch] = parseVersion(currentBotVersion)
        const {data} = await axios.get(LATEST_RELEASE_URL, {responseType: 'json'})
        const [remoteMajor, remoteMinor, remotePatch] = parseVersion(data.tag_name)
        let response = {
            latest : true,
        }

        if(Number(currentMajor) == Number(remoteMajor) && Number(currentMinor) == Number(remoteMinor) && Number(currentPatch) < Number(remotePatch)){
            response.latest = false
        } 
        
        if (Number(currentMajor) < Number(remoteMajor) || (Number(currentMajor) == Number(remoteMajor) && Number(currentMinor) < Number(remoteMinor))){
            response.latest = false
        }

        return response
    } catch (err){
        showConsoleLibraryError(err, 'checkUpdate')
        throw err
    }
}

export async function makeUpdate(targetPath: string = './'){
    const appPath = await fs.realpath(targetPath)
    const stagingPath = path.join(appPath, `.update-staging-${Date.now()}`)

    try {
        const {data} = await axios.get(LATEST_RELEASE_URL, {responseType: 'json'})
        const { packageAsset, checksumAsset } = selectUpdateAssets(data)
        const [{data : remoteVersion}, checksumResponse] = await Promise.all([
            axios.get(packageAsset.browser_download_url, {responseType: 'arraybuffer'}),
            axios.get(checksumAsset.browser_download_url, {responseType: 'text'})
        ])
        const zipBuffer = Buffer.from(remoteVersion)

        const expectedChecksum = parseChecksum(String(checksumResponse.data))
        const actualChecksum = sha256(zipBuffer)

        if (actualChecksum !== expectedChecksum) {
            throw new Error(`Update checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`)
        }

        await fs.ensureDir(stagingPath)
        assertSafeZipBuffer(zipBuffer, stagingPath)
        const zip = new AdmZip(zipBuffer)
        assertSafeZipEntries(zip, stagingPath)
        zip.extractAllTo(stagingPath, true, true)
        await applyStagedUpdate(stagingPath, appPath)
    } catch(err){
        throw err
    } finally {
        await fs.remove(stagingPath)
    }
}

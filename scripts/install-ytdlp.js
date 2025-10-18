// Script para baixar o binário yt-dlp usando curl/wget
import { execSync } from 'child_process';
import { platform } from 'os';
import { chmodSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWindows = platform() === 'win32';
const binaryDir = join(__dirname, '..', 'bin');
const fileName = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const ytDlpPath = join(binaryDir, fileName);

try {
    mkdirSync(binaryDir, { recursive: true });
} catch (err) {
    console.error('Não foi possível garantir o diretório bin:', err.message);
    process.exit(1);
}

if (existsSync(ytDlpPath)) {
    console.log('✓ yt-dlp já está instalado em:', ytDlpPath);
    process.exit(0);
}

console.log('Baixando yt-dlp...');

const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${fileName}`;

try {
    if (isWindows) {
        execSync(`curl -L "${downloadUrl}" -o "${ytDlpPath}"`, { stdio: 'inherit' });
    } else {
        execSync(`curl -L "${downloadUrl}" -o "${ytDlpPath}"`, { stdio: 'inherit' });
        chmodSync(ytDlpPath, '755');
    }
    console.log('✓ yt-dlp baixado com sucesso em:', ytDlpPath);
} catch (err) {
    console.error('Erro ao baixar yt-dlp:', err.message);
    process.exit(1);
}

import { Database } from 'bun:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { hashForLog, redactText } from '../utils/privacy.util.js';

const dataDir = path.join(process.cwd(), 'storage');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const audiosDir = path.join(dataDir, 'audios');

function realpathIfPossible(targetPath: string) {
  try {
    return fs.realpathSync(targetPath);
  } catch {
    return path.resolve(targetPath);
  }
}

function canonicalizeAudioPath(targetPath: string) {
  if (fs.existsSync(targetPath)) {
    return realpathIfPossible(targetPath);
  }

  const parentPath = path.dirname(targetPath);
  return path.join(realpathIfPossible(parentPath), path.basename(targetPath));
}

export function resolveSavedAudioFilePath(filePath: string) {
  const audioRoot = realpathIfPossible(audiosDir);
  const rawResolvedPath = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(audioRoot, filePath);
  const resolvedPath = canonicalizeAudioPath(rawResolvedPath);
  const relativePath = path.relative(audioRoot, resolvedPath);

  if (relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))) {
    return resolvedPath;
  }

  throw new Error('Caminho de audio fora de storage/audios');
}

const dbPath = path.join(dataDir, 'bot.db');
export const db = new Database(dbPath);

// ============================================
// TABELA DE CONTATOS (substitui NodeCache)
// ============================================
db.run(`
  CREATE TABLE IF NOT EXISTS contacts (
    jid TEXT PRIMARY KEY,
    name TEXT,
    notify TEXT,
    verified_name TEXT,
    phone_number TEXT,
    lid TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ============================================
// TABELA DE LOGS DE COMANDOS
// ============================================
db.run(`
  CREATE TABLE IF NOT EXISTS command_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid TEXT NOT NULL,
    user_name TEXT,
    command TEXT NOT NULL,
    args TEXT,
    chat_id TEXT,
    is_group BOOLEAN DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT 1,
    error_message TEXT
  )
`);

// ============================================
// TABELA DE ÁUDIOS SALVOS (GLOBAIS)
// ============================================
db.run(`
  CREATE TABLE IF NOT EXISTS saved_audios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_jid TEXT NOT NULL,
    audio_name TEXT NOT NULL UNIQUE,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    seconds INTEGER,
    ptt BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// MIGRAÇÃO: Adicionar coluna owner_jid se não existir (para bancos antigos)
try {
  const columns = db.prepare("PRAGMA table_info(saved_audios)").all() as Array<{ name: string }>;
  const hasOwnerJid = columns.some(col => col.name === 'owner_jid');
  
  if (!hasOwnerJid) {
    console.log('[DB] 🔧 Migrando tabela saved_audios: adicionando coluna owner_jid...');
    db.run('ALTER TABLE saved_audios ADD COLUMN owner_jid TEXT NOT NULL DEFAULT ""');
    console.log('[DB] ✅ Migração concluída');
  }
} catch (err) {
  console.log('[DB] ⚠️ Erro na migração:', err);
}

// MIGRAÇÃO: Garantir que audio_name tem constraint UNIQUE
try {
  // Verifica se a constraint UNIQUE existe
  const indexes = db.prepare("PRAGMA index_list(saved_audios)").all() as Array<{ name: string; unique: number }>;
  const hasUniqueConstraint = indexes.some(idx => idx.unique === 1 && idx.name.includes('audio_name'));
  
  if (!hasUniqueConstraint) {
    console.log('[DB] 🔧 Migrando tabela saved_audios: adicionando constraint UNIQUE em audio_name...');
    
    // SQLite não permite adicionar constraints, então precisamos recriar a tabela
    db.run('BEGIN TRANSACTION');
    
    // Criar tabela temporária com a estrutura correta
    db.run(`
      CREATE TABLE saved_audios_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_jid TEXT NOT NULL,
        audio_name TEXT NOT NULL UNIQUE,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        seconds INTEGER,
        ptt BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Copiar dados da tabela antiga (removendo duplicatas, mantendo o mais recente)
    db.run(`
      INSERT INTO saved_audios_new 
      SELECT id, owner_jid, audio_name, file_path, mime_type, seconds, ptt, created_at
      FROM saved_audios
      WHERE id IN (
        SELECT MAX(id) 
        FROM saved_audios 
        GROUP BY audio_name
      )
    `);
    
    // Remover tabela antiga e renomear a nova
    db.run('DROP TABLE saved_audios');
    db.run('ALTER TABLE saved_audios_new RENAME TO saved_audios');
    
    db.run('COMMIT');
    console.log('[DB] ✅ Migração da constraint UNIQUE concluída');
  }
} catch (err) {
  db.run('ROLLBACK');
  console.log('[DB] ⚠️ Erro na migração da constraint UNIQUE:', err);
}

// ============================================
// TABELA DE CACHE DE PERGUNTAS (ASK)
// ============================================
db.run(`
  CREATE TABLE IF NOT EXISTS ask_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_hash TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    user_type TEXT NOT NULL,
    hit_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_hash, user_type)
  )
`);

function hasUniqueIndex(tableName: string, expectedColumns: string[]) {
  const indexes = db.prepare(`PRAGMA index_list(${tableName})`).all() as Array<{ name: string; unique: number }>;

  return indexes.some((indexInfo) => {
    if (!indexInfo.unique) {
      return false;
    }

    const columns = db.prepare(`PRAGMA index_info(${indexInfo.name})`).all() as Array<{ name: string }>;
    return columns.map(column => column.name).join('|') === expectedColumns.join('|');
  });
}

try {
  if (!hasUniqueIndex('ask_cache', ['question_hash', 'user_type'])) {
    console.log('[DB] 🔧 Migrando ask_cache para UNIQUE(question_hash, user_type)...');
    db.run('BEGIN TRANSACTION');
    db.run(`
      CREATE TABLE ask_cache_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_hash TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        user_type TEXT NOT NULL,
        hit_count INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(question_hash, user_type)
      )
    `);
    db.run(`
      INSERT INTO ask_cache_new
        (id, question_hash, question, answer, user_type, hit_count, created_at, last_used_at)
      SELECT id, question_hash, question, answer, user_type, hit_count, created_at, last_used_at
      FROM ask_cache
      WHERE id IN (
        SELECT MAX(id)
        FROM ask_cache
        GROUP BY question_hash, user_type
      )
    `);
    db.run('DROP TABLE ask_cache');
    db.run('ALTER TABLE ask_cache_new RENAME TO ask_cache');
    db.run('COMMIT');
    console.log('[DB] ✅ Migração de ask_cache concluída');
  }
} catch (err) {
  db.run('ROLLBACK');
  console.log('[DB] ⚠️ Erro na migração de ask_cache:', err);
}

// Índices para performance
db.run('CREATE INDEX IF NOT EXISTS idx_contacts_updated ON contacts(updated_at)');
db.run('CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON command_logs(timestamp)');
db.run('CREATE INDEX IF NOT EXISTS idx_logs_user ON command_logs(user_jid)');
db.run('CREATE INDEX IF NOT EXISTS idx_logs_command ON command_logs(command)');
db.run('CREATE INDEX IF NOT EXISTS idx_audios_owner ON saved_audios(owner_jid)');
db.run('CREATE INDEX IF NOT EXISTS idx_audios_name ON saved_audios(audio_name)');
db.run('CREATE INDEX IF NOT EXISTS idx_ask_hash ON ask_cache(question_hash)');
db.run('CREATE INDEX IF NOT EXISTS idx_ask_last_used ON ask_cache(last_used_at)');
db.run('CREATE INDEX IF NOT EXISTS idx_ask_user_type ON ask_cache(user_type)');
db.run('CREATE INDEX IF NOT EXISTS idx_ask_hit_count ON ask_cache(hit_count)');

// ============================================
// FUNÇÕES PARA CONTATOS
// ============================================
export const contactsDb = {
  // Salvar/atualizar contato
  upsert: (contact: {
    jid: string;
    name?: string;
    notify?: string;
    verifiedName?: string;
    phoneNumber?: string;
    lid?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO contacts (jid, name, notify, verified_name, phone_number, lid, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(jid) DO UPDATE SET 
        name = COALESCE(excluded.name, name),
        notify = COALESCE(excluded.notify, notify),
        verified_name = COALESCE(excluded.verified_name, verified_name),
        phone_number = COALESCE(excluded.phone_number, phone_number),
        lid = COALESCE(excluded.lid, lid),
        updated_at = CURRENT_TIMESTAMP
    `);
    
    stmt.run(
      contact.jid,
      contact.name || null,
      contact.notify || null,
      contact.verifiedName || null,
      contact.phoneNumber || null,
      contact.lid || null
    );
    
    console.log(`[DB] Contato salvo: ${hashForLog(contact.jid)} name_present=${Boolean(contact.notify || contact.name || contact.verifiedName)}`);
  },

  // Buscar contato do cache
  get: (jid: string) => {
    const stmt = db.prepare('SELECT * FROM contacts WHERE jid = ? OR lid = ? OR phone_number = ?');
    return stmt.get(jid, jid, jid) as {
      jid: string;
      name: string | null;
      notify: string | null;
      verified_name: string | null;
      phone_number: string | null;
      lid: string | null;
      updated_at: string;
    } | undefined;
  },

  // Listar todos os contatos
  getAll: () => {
    const stmt = db.prepare('SELECT * FROM contacts ORDER BY updated_at DESC');
    return stmt.all() as Array<{
      jid: string;
      name: string | null;
      notify: string | null;
      verified_name: string | null;
      phone_number: string | null;
      lid: string | null;
      updated_at: string;
    }>;
  },

  // Contar contatos
  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM contacts');
    const result = stmt.get() as { count: number };
    return result.count;
  },

  // Verificar se precisa atualizar (mais de 7 dias)
  needsUpdate: (jid: string): boolean => {
    const stmt = db.prepare(`
      SELECT * FROM contacts 
      WHERE (jid = ? OR lid = ? OR phone_number = ?)
      AND updated_at > datetime('now', '-7 days')
    `);
    const contact = stmt.get(jid, jid, jid);
    return !contact;
  }
};

// ============================================
// FUNÇÕES PARA LOGS DE COMANDOS
// ============================================
export const logsDb = {
  // Salvar log de comando
  log: (data: {
    userJid: string;
    userName?: string;
    command: string;
    args?: string;
    chatId?: string;
    isGroup?: boolean;
    success?: boolean;
    error?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO command_logs (user_jid, user_name, command, args, chat_id, is_group, success, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      hashForLog(data.userJid),
      redactText(data.userName),
      data.command,
      redactText(data.args),
      hashForLog(data.chatId),
      data.isGroup ? 1 : 0,
      data.success !== false ? 1 : 0,
      redactText(data.error)
    );
  },

  // Buscar logs de um usuário
  getUserLogs: (userJid: string, limit: number = 50) => {
    const stmt = db.prepare(`
      SELECT * FROM command_logs 
      WHERE user_jid = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(hashForLog(userJid), limit);
  },

  // Buscar logs recentes
  getRecent: (limit: number = 100) => {
    const stmt = db.prepare(`
      SELECT * FROM command_logs 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(limit);
  },

  // Estatísticas de comandos mais usados
  getTopCommands: (limit: number = 10) => {
    const stmt = db.prepare(`
      SELECT command, COUNT(*) as count, 
             SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
             SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
      FROM command_logs 
      GROUP BY command 
      ORDER BY count DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as Array<{
      command: string;
      count: number;
      success_count: number;
      error_count: number;
    }>;
  },

  // Contar total de comandos
  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM command_logs');
    const result = stmt.get() as { count: number };
    return result.count;
  },

  // Contar comandos nas últimas 24h
  countLast24h: () => {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM command_logs 
      WHERE timestamp > datetime('now', '-24 hours')
    `);
    const result = stmt.get() as { count: number };
    return result.count;
  }
};

// ============================================
// FUNÇÕES PARA ÁUDIOS SALVOS
// ============================================
export const audiosDb = {
  // Salvar áudio (global)
  save: (data: {
    ownerJid: string;
    audioName: string;
    filePath: string;
    mimeType: string;
    seconds?: number;
    ptt?: boolean;
  }) => {
    try {
      const safeFilePath = resolveSavedAudioFilePath(data.filePath);
      const stmt = db.prepare(`
        INSERT INTO saved_audios 
        (owner_jid, audio_name, file_path, mime_type, seconds, ptt)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(audio_name) DO UPDATE SET 
          file_path = excluded.file_path,
          mime_type = excluded.mime_type,
          seconds = excluded.seconds,
          ptt = excluded.ptt,
          owner_jid = excluded.owner_jid,
          created_at = CURRENT_TIMESTAMP
      `);
      
      stmt.run(
        data.ownerJid,
        data.audioName.toLowerCase(),
        safeFilePath,
        data.mimeType,
        data.seconds || null,
        data.ptt ? 1 : 0
      );
      
      console.log(`[DB] Áudio salvo globalmente: "${data.audioName}" por ${data.ownerJid}`);
    } catch (error: any) {
      console.error('[DB] Erro ao salvar áudio:', error);
      if (error.message?.includes('ON CONFLICT') || error.message?.includes('UNIQUE constraint')) {
        throw new Error('Erro no banco de dados: constraint UNIQUE ausente. Execute a migração do banco.');
      }
      throw error;
    }
  },

  // Buscar áudio por nome (global)
  get: (audioName: string) => {
    const stmt = db.prepare(`
      SELECT * FROM saved_audios 
      WHERE audio_name = ?
    `);
    return stmt.get(audioName.toLowerCase()) as {
      id: number;
      owner_jid: string;
      audio_name: string;
      file_path: string;
      mime_type: string;
      seconds: number | null;
      ptt: number;
      created_at: string;
    } | undefined;
  },

  // Listar todos os áudios (global)
  getAllAudios: (limit: number = 50, offset: number = 0) => {
    const stmt = db.prepare(`
      SELECT audio_name, seconds, created_at, owner_jid 
      FROM saved_audios 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as Array<{
      audio_name: string;
      seconds: number | null;
      created_at: string;
      owner_jid: string;
    }>;
  },

  // Contar total de áudios (global)
  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM saved_audios');
    const result = stmt.get() as { count: number };
    return result.count;
  },

  countByOwner: (ownerJid: string) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM saved_audios WHERE owner_jid = ?');
    const result = stmt.get(ownerJid) as { count: number };
    return result.count;
  },

  // Deletar áudio (global - verifica dono)
  delete: (audioName: string, requesterId?: string) => {
    const audio = audiosDb.get(audioName);
    if (audio) {
      // Se requesterId for fornecido, verifica se é o dono
      if (requesterId && audio.owner_jid !== requesterId) {
        throw new Error('Apenas o dono pode deletar este áudio');
      }
      
      const safeFilePath = resolveSavedAudioFilePath(audio.file_path);

      // Remove arquivo físico
      try {
        if (fs.existsSync(safeFilePath)) {
          fs.unlinkSync(safeFilePath);
        }
      } catch (err) {
        console.error(`[DB] Erro ao deletar arquivo: ${err}`);
      }
    }
    
    const stmt = db.prepare('DELETE FROM saved_audios WHERE audio_name = ?');
    stmt.run(audioName.toLowerCase());
    console.log(`[DB] Áudio deletado globalmente: "${audioName}"`);
  },

  // Renomear áudio (global - verifica dono)
  rename: (oldName: string, newName: string, requesterId?: string) => {
    const audio = audiosDb.get(oldName);
    if (audio && requesterId && audio.owner_jid !== requesterId) {
      throw new Error('Apenas o dono pode renomear este áudio');
    }
    
    const stmt = db.prepare(`
      UPDATE saved_audios 
      SET audio_name = ? 
      WHERE audio_name = ?
    `);
    stmt.run(newName.toLowerCase(), oldName.toLowerCase());
    console.log(`[DB] Áudio renomeado globalmente: "${oldName}" -> "${newName}"`);
  }
};

// ============================================
// FUNÇÕES PARA CACHE DE ASK
// ============================================
export const askCacheDb = {
  // Buscar resposta em cache
  get: (questionHash: string, userType: string) => {
    const stmt = db.prepare(`
      SELECT * FROM ask_cache 
      WHERE question_hash = ? AND user_type = ?
    `);
    const result = stmt.get(questionHash, userType) as {
      id: number;
      question_hash: string;
      question: string;
      answer: string;
      user_type: string;
      hit_count: number;
      created_at: string;
      last_used_at: string;
    } | undefined;
    
    // Se encontrou, incrementa hit_count e atualiza last_used_at
    if (result) {
      const updateStmt = db.prepare(`
        UPDATE ask_cache 
        SET hit_count = hit_count + 1, 
            last_used_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      updateStmt.run(result.id);
      result.hit_count += 1; // Atualiza objeto retornado
    }
    
    return result;
  },

  // Salvar resposta no cache
  set: (questionHash: string, question: string, answer: string, userType: string) => {
    const stmt = db.prepare(`
	      INSERT INTO ask_cache
	      (question_hash, question, answer, user_type, hit_count, created_at, last_used_at)
	      VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	      ON CONFLICT(question_hash, user_type) DO UPDATE SET
	        question = excluded.question,
	        answer = excluded.answer,
	        hit_count = hit_count + 1,
	        last_used_at = CURRENT_TIMESTAMP
    `);
    stmt.run(questionHash, question, answer, userType);
  },

  // Limpar cache antigo (mais de 30 dias sem uso)
  cleanOld: () => {
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM ask_cache').get() as { count: number };
    const stmt = db.prepare(`
      DELETE FROM ask_cache 
      WHERE last_used_at < datetime('now', '-30 days')
    `);
    stmt.run();
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM ask_cache').get() as { count: number };
    const changes = countBefore.count - countAfter.count;
    if (changes > 0) {
      console.log(`[ASK-CACHE] 🧹 Limpou ${changes} entradas antigas (>30 dias)`);
    }
    return changes;
  },

  // Manter apenas as 500 perguntas mais acessadas
  enforceLimit: (limit: number = 500) => {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM ask_cache');
    const { count } = countStmt.get() as { count: number };
    
    if (count > limit) {
      const countBefore = count;
      const stmt = db.prepare(`
        DELETE FROM ask_cache 
        WHERE id NOT IN (
          SELECT id FROM ask_cache 
          ORDER BY hit_count DESC, last_used_at DESC 
          LIMIT ?
        )
      `);
      stmt.run(limit);
      const countAfter = db.prepare('SELECT COUNT(*) as count FROM ask_cache').get() as { count: number };
      const changes = countBefore - countAfter.count;
      console.log(`[ASK-CACHE] 🎯 Manteve top ${limit} perguntas, removeu ${changes} entradas`);
      return changes;
    }
    
    return 0;
  },

  // Estatísticas do cache
  stats: () => {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM ask_cache');
    const { count } = countStmt.get() as { count: number };
    
    const topStmt = db.prepare(`
      SELECT question, question_hash, hit_count, user_type, last_used_at
      FROM ask_cache 
      ORDER BY hit_count DESC 
      LIMIT 10
    `);
    const topQuestions = (topStmt.all() as Array<{
      question: string;
      question_hash: string;
      hit_count: number;
      user_type: string;
      last_used_at: string;
    }>).map(question => ({
      ...question,
      question: redactText(question.question) || `[hash=${question.question_hash.slice(0, 12)}]`,
    }));
    
    return { total: count, topQuestions };
  },

  // Contar entradas
  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM ask_cache');
    const result = stmt.get() as { count: number };
    return result.count;
  }
};

console.log('[DB] 🗄️ Banco de dados SQLite inicializado:', dbPath);

export default db;

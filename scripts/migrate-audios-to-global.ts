import Database from 'bun:sqlite';
import path from 'node:path';

/**
 * Migração: Áudios de privados para globais
 * 
 * Esta migração converte o sistema de áudios de privado (por usuário)
 * para global (todos os usuários podem acessar todos os áudios).
 * 
 * Mudanças:
 * - Renomeia coluna user_jid para owner_jid
 * - Remove constraint UNIQUE(user_jid, audio_name)
 * - Adiciona constraint UNIQUE(audio_name) - nomes únicos globalmente
 * - Mantém histórico de quem criou cada áudio
 */

const dataDir = path.join(process.cwd(), 'storage');
const dbPath = path.join(dataDir, 'bot.db');

console.log('[MIGRAÇÃO] Iniciando migração de áudios para sistema global...');

const db = new Database(dbPath);

try {
  // Verifica se a tabela existe e qual é sua estrutura
  const tableInfo = db.prepare("PRAGMA table_info(saved_audios)").all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: any;
    pk: number;
  }>;

  const hasUserJid = tableInfo.some(col => col.name === 'user_jid');
  const hasOwnerJid = tableInfo.some(col => col.name === 'owner_jid');

  if (hasOwnerJid && !hasUserJid) {
    console.log('[MIGRAÇÃO] ✅ Banco já está no formato global. Nenhuma migração necessária.');
    process.exit(0);
  }

  if (!hasUserJid) {
    console.log('[MIGRAÇÃO] ⚠️ Estrutura de tabela desconhecida. Verifique manualmente.');
    process.exit(1);
  }

  console.log('[MIGRAÇÃO] 📊 Estrutura antiga detectada. Iniciando migração...');

  // Começa uma transação
  db.run('BEGIN TRANSACTION');

  db.run('DROP TABLE IF EXISTS saved_audios_migration_backup');
  db.run('CREATE TABLE saved_audios_migration_backup AS SELECT * FROM saved_audios');
  console.log('[MIGRAÇÃO] 🧾 Backup completo salvo em saved_audios_migration_backup');

  db.run('DROP TABLE IF EXISTS saved_audios_migration_conflicts');
  db.run(`
    CREATE TABLE saved_audios_migration_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duplicate_audio_name TEXT NOT NULL,
      old_audio_id INTEGER NOT NULL,
      old_user_jid TEXT NOT NULL,
      old_file_path TEXT NOT NULL,
      old_mime_type TEXT NOT NULL,
      old_seconds INTEGER,
      old_ptt BOOLEAN DEFAULT 0,
      old_created_at DATETIME,
      conflict_reason TEXT NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`
    INSERT INTO saved_audios_migration_conflicts
      (duplicate_audio_name, old_audio_id, old_user_jid, old_file_path, old_mime_type, old_seconds, old_ptt, old_created_at, conflict_reason)
    SELECT
      audio_name,
      id,
      user_jid,
      file_path,
      mime_type,
      seconds,
      ptt,
      created_at,
      'duplicate audio_name during global-audio migration'
    FROM saved_audios
    WHERE audio_name IN (
      SELECT audio_name
      FROM saved_audios
      GROUP BY audio_name
      HAVING COUNT(*) > 1
    )
  `);

  const conflictCount = db.prepare('SELECT COUNT(*) as count FROM saved_audios_migration_conflicts').get() as { count: number };

  if (conflictCount.count > 0) {
    console.log(`[MIGRAÇÃO] ⚠️ ${conflictCount.count} registros duplicate gravados em saved_audios_migration_conflicts`);
  }

  // 1. Cria tabela temporária com nova estrutura
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

  console.log('[MIGRAÇÃO] 🔨 Tabela temporária criada');

  // 2. Copia dados, mantendo apenas o áudio mais recente de cada nome.
  // Todos os conflitos permanecem auditáveis no backup e na tabela de conflitos.
  db.run(`
    INSERT INTO saved_audios_new 
      (id, owner_jid, audio_name, file_path, mime_type, seconds, ptt, created_at)
    SELECT 
      id,
      user_jid as owner_jid,
      audio_name,
      file_path,
      mime_type,
      seconds,
      ptt,
      created_at
    FROM saved_audios
    WHERE id IN (
      SELECT MAX(id)
      FROM saved_audios
      GROUP BY audio_name
    )
  `);

  const migratedCount = db.prepare('SELECT COUNT(*) as count FROM saved_audios_new').get() as { count: number };
  const originalCount = db.prepare('SELECT COUNT(*) as count FROM saved_audios').get() as { count: number };

  console.log(`[MIGRAÇÃO] 📦 ${migratedCount.count}/${originalCount.count} áudios migrados (duplicatas removidas)`);

  // 3. Remove tabela antiga
  db.run('DROP TABLE saved_audios');
  console.log('[MIGRAÇÃO] 🗑️ Tabela antiga removida');

  // 4. Renomeia tabela nova
  db.run('ALTER TABLE saved_audios_new RENAME TO saved_audios');
  console.log('[MIGRAÇÃO] ✏️ Tabela renomeada');

  // 5. Recria índices
  db.run('CREATE INDEX IF NOT EXISTS idx_audios_owner ON saved_audios(owner_jid)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audios_name ON saved_audios(audio_name)');
  console.log('[MIGRAÇÃO] 🔍 Índices recriados');

  // Commit da transação
  db.run('COMMIT');

  console.log('[MIGRAÇÃO] ✅ Migração concluída com sucesso!');
  console.log('[MIGRAÇÃO] 📝 Sistema de áudios agora é global - todos podem acessar todos os áudios');
  console.log('[MIGRAÇÃO] 🔒 Apenas o dono pode editar/deletar seus áudios');

} catch (error) {
  // Rollback em caso de erro
  db.run('ROLLBACK');
  console.error('[MIGRAÇÃO] ❌ Erro na migração:', error);
  process.exit(1);
} finally {
  db.close();
}

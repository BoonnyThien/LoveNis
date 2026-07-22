-- ============================================================
-- lovenis-db Schema — chỉ chứa Memory Vault data
-- Analytics (visitor_logs, card_clicks) vẫn ở merrychristmas-analytics-db
-- ============================================================

CREATE TABLE IF NOT EXISTS memories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL DEFAULT '',
  message       TEXT NOT NULL DEFAULT '',
  type          TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'model')),
  r2_key        TEXT NOT NULL UNIQUE,
  media_url     TEXT NOT NULL,
  thumbnail_url TEXT,
  file_name     TEXT,
  file_size     INTEGER,
  mime_type     TEXT,
  duration      REAL,
  width         INTEGER,
  height        INTEGER,
  memory_date   TIMESTAMP,
  position      INTEGER DEFAULT 0,
  color_tag     TEXT DEFAULT '#ff6b9d',
  is_favorite   INTEGER DEFAULT 0,
  is_hidden     INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_memories_type     ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_date     ON memories(memory_date);
CREATE INDEX IF NOT EXISTS idx_memories_position ON memories(position);
CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories(is_favorite);

CREATE TRIGGER IF NOT EXISTS memories_updated_at
  AFTER UPDATE ON memories FOR EACH ROW
BEGIN
  UPDATE memories SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

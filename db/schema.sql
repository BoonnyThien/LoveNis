-- ============================================================
-- LoveNis Memory Vault — D1 Database Schema
-- ============================================================

-- ► Bảng analytics visitor (giữ nguyên từ trước)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  ip           TEXT,
  user_agent   TEXT,
  device_type  TEXT,
  browser      TEXT,
  os           TEXT,
  screen_width  INTEGER,
  screen_height INTEGER,
  language     TEXT,
  timezone     TEXT,
  country      TEXT,
  city         TEXT,
  region       TEXT,
  referrer     TEXT,
  first_visit  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_visit   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visit_count  INTEGER DEFAULT 1,
  project      TEXT
);

-- ► Bảng analytics card clicks (giữ nguyên từ trước)
CREATE TABLE IF NOT EXISTS card_clicks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  card_id    INTEGER NOT NULL,
  card_letter TEXT,
  project    TEXT,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ► Bảng memories (MỚI) — trái tim của Memory Vault
-- ============================================================
CREATE TABLE IF NOT EXISTS memories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Thông tin media
  title       TEXT NOT NULL DEFAULT '',
  message     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio', 'model')),

  -- Cloudflare R2 storage
  r2_key      TEXT NOT NULL UNIQUE,
  media_url   TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Metadata media
  file_name   TEXT,
  file_size   INTEGER,
  mime_type   TEXT,
  duration    REAL,
  width       INTEGER,
  height      INTEGER,

  -- Timeline & sắp xếp
  memory_date TIMESTAMP,
  position    INTEGER DEFAULT 0,
  color_tag   TEXT DEFAULT '#ff6b9d',

  -- Trạng thái
  is_favorite INTEGER DEFAULT 0,
  is_hidden   INTEGER DEFAULT 0,

  -- Timestamps
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ► Indexes để tăng tốc query
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_session_id          ON visitor_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_country     ON visitor_logs(country);
CREATE INDEX IF NOT EXISTS idx_card_clicks_session ON card_clicks(session_id);

CREATE INDEX IF NOT EXISTS idx_memories_type      ON memories(type);
CREATE INDEX IF NOT EXISTS idx_memories_date      ON memories(memory_date);
CREATE INDEX IF NOT EXISTS idx_memories_position  ON memories(position);
CREATE INDEX IF NOT EXISTS idx_memories_favorite  ON memories(is_favorite);

-- ============================================================
-- ► Trigger: tự động cập nhật updated_at
-- ============================================================
CREATE TRIGGER IF NOT EXISTS memories_updated_at
  AFTER UPDATE ON memories
  FOR EACH ROW
BEGIN
  UPDATE memories SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

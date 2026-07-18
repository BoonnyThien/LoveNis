-- Bảng theo dõi lượt truy cập (visitor tracking)
CREATE TABLE IF NOT EXISTS visitor_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  language TEXT,
  timezone TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  referrer TEXT,
  first_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  visit_count INTEGER DEFAULT 1,
  project TEXT
);

-- Bảng theo dõi clicks trên các card
CREATE TABLE IF NOT EXISTS card_clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  card_id INTEGER NOT NULL,
  card_letter TEXT,
  project TEXT,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index để tăng tốc query
CREATE INDEX IF NOT EXISTS idx_session_id ON visitor_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_card_clicks_session ON card_clicks(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_country ON visitor_logs(country);

# D1 Database Setup

## Tables
| Table | Mô tả |
|-------|-------|
| `visitor_logs` | Analytics visitors |
| `card_clicks` | Analytics card clicks |
| `memories` | Memory Vault media ← **MỚI** |

## Chạy schema
```bash
npx wrangler d1 execute merrychristmas-analytics-db \
  --remote --file=./db/schema.sql
```

## Verify
```bash
npx wrangler d1 execute merrychristmas-analytics-db \
  --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Query nhanh
```sql
-- Memories gần nhất
SELECT id, title, type, file_size, created_at FROM memories
ORDER BY created_at DESC LIMIT 10;

-- Yêu thích
SELECT * FROM memories WHERE is_favorite = 1;

-- Theo loại
SELECT type, COUNT(*) as count FROM memories GROUP BY type;
```

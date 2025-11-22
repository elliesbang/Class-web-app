-- Ensure required created_at columns exist
ALTER TABLE notifications ADD COLUMN created_at timestamptz DEFAULT now();
ALTER TABLE classroom_videos ADD COLUMN created_at timestamptz DEFAULT now();
ALTER TABLE classroom_materials ADD COLUMN created_at timestamptz DEFAULT now();
ALTER TABLE classroom_notices ADD COLUMN created_at timestamptz DEFAULT now();
ALTER TABLE vod_videos ADD COLUMN created_at timestamptz DEFAULT now();

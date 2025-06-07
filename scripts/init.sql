-- Uesugi Engine データベース初期化スクリプト
-- PostgreSQL + PostGIS

-- PostGIS エクステンションを有効化
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- インデックス作成のための関数
CREATE OR REPLACE FUNCTION create_indexes_if_not_exists() RETURNS void AS $$
BEGIN
    -- heatmap_points テーブルのインデックス
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_heatmap_points_location') THEN
        CREATE INDEX idx_heatmap_points_location ON heatmap_points USING GIST (location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_heatmap_points_timestamp') THEN
        CREATE INDEX idx_heatmap_points_timestamp ON heatmap_points (timestamp);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_heatmap_points_category') THEN
        CREATE INDEX idx_heatmap_points_category ON heatmap_points (category);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_heatmap_points_data_source') THEN
        CREATE INDEX idx_heatmap_points_data_source ON heatmap_points (data_source);
    END IF;

    -- weather_data テーブルのインデックス
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_weather_data_location') THEN
        CREATE INDEX idx_weather_data_location ON weather_data USING GIST (location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_weather_data_timestamp') THEN
        CREATE INDEX idx_weather_data_timestamp ON weather_data (timestamp);
    END IF;

    -- event_data テーブルのインデックス
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_data_location') THEN
        CREATE INDEX idx_event_data_location ON event_data USING GIST (location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_event_data_start_datetime') THEN
        CREATE INDEX idx_event_data_start_datetime ON event_data (start_datetime);
    END IF;

    -- landmark_data テーブルのインデックス
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_landmark_data_location') THEN
        CREATE INDEX idx_landmark_data_location ON landmark_data USING GIST (location);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_landmark_data_name') THEN
        CREATE INDEX idx_landmark_data_name ON landmark_data (name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_landmark_data_is_benchmark') THEN
        CREATE INDEX idx_landmark_data_is_benchmark ON landmark_data (is_benchmark);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 初期化完了ログ
DO $$
BEGIN
    RAISE NOTICE 'Uesugi Engine database initialization completed';
    RAISE NOTICE 'PostGIS extension enabled';
    RAISE NOTICE 'Ready for application startup';
END;
$$;
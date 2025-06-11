-- 6地域統合データベーススキーマ
-- Generated: 2025-06-11T19:30:22.593764

-- 地域マスタテーブル
CREATE TABLE IF NOT EXISTS regions (
    region_code VARCHAR(2) PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL,
    region_name_en VARCHAR(50),
    has_data BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 地域マスタデータ
INSERT INTO regions (region_code, region_name, region_name_en, has_data) VALUES
    ('34', '広島県', 'Hiroshima', TRUE),
    ('35', '山口県', 'Yamaguchi', TRUE),
    ('40', '福岡県', 'Fukuoka', FALSE),
    ('27', '大阪府', 'Osaka', FALSE),
    ('13', '東京都', 'Tokyo', FALSE),
    ('33', '岡山県', 'Okayama', FALSE)
ON CONFLICT (region_code) DO UPDATE
    SET has_data = EXCLUDED.has_data,
        last_updated = CURRENT_TIMESTAMP;

-- データカタログテーブル
CREATE TABLE IF NOT EXISTS data_catalog (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(2) REFERENCES regions(region_code),
    category VARCHAR(50),
    file_name VARCHAR(255),
    file_path TEXT,
    file_size BIGINT,
    record_count INTEGER,
    data_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX idx_catalog_region ON data_catalog(region_code);
CREATE INDEX idx_catalog_category ON data_catalog(category);
CREATE INDEX idx_catalog_type ON data_catalog(data_type);

-- ビューの作成
CREATE OR REPLACE VIEW v_regional_data_summary AS
SELECT 
    r.region_code,
    r.region_name,
    r.has_data,
    COUNT(dc.id) as total_files,
    COALESCE(SUM(dc.file_size), 0) as total_size,
    COALESCE(SUM(dc.record_count), 0) as total_records
FROM regions r
LEFT JOIN data_catalog dc ON r.region_code = dc.region_code
GROUP BY r.region_code, r.region_name, r.has_data
ORDER BY r.region_code;

-- 統合データアクセス用のストアドファンクション
CREATE OR REPLACE FUNCTION get_regional_data(
    p_region_code VARCHAR(2) DEFAULT NULL,
    p_category VARCHAR(50) DEFAULT NULL,
    p_data_type VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    region_name VARCHAR,
    category VARCHAR,
    file_name VARCHAR,
    record_count INTEGER,
    data_type VARCHAR
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.region_name,
        dc.category,
        dc.file_name,
        dc.record_count,
        dc.data_type
    FROM data_catalog dc
    JOIN regions r ON dc.region_code = r.region_code
    WHERE 
        (p_region_code IS NULL OR dc.region_code = p_region_code)
        AND (p_category IS NULL OR dc.category = p_category)
        AND (p_data_type IS NULL OR dc.data_type = p_data_type)
    ORDER BY r.region_code, dc.category, dc.file_name;
END;
$$ LANGUAGE plpgsql;

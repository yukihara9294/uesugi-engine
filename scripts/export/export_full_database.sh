#!/bin/bash
# 全データを完全にエクスポートするスクリプト

echo "データベースの全データをエクスポート中..."

# エクスポート先ディレクトリ
EXPORT_DIR="database_full_export"
mkdir -p $EXPORT_DIR

# 1. データ統計サマリー
echo "データ統計を作成中..."
cat > $EXPORT_DIR/00_README.md << EOF
# Uesugi Engine データベース完全エクスポート

## データ概要
- エクスポート日時: $(date '+%Y年%m月%d日 %H:%M:%S')
- データタイプ: PostgreSQL with PostGIS
- 文字コード: UTF-8

## ファイル一覧と件数
EOF

docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -t -c "
SELECT '| ' || table_name || ' | ' || n_live_tup || '件 |'
FROM pg_stat_user_tables 
WHERE schemaname = 'public' 
AND table_name IN ('heatmap_points', 'mobility_flows', 'consumption_data', 'accommodation_data', 'landmark_data')
ORDER BY n_live_tup DESC;" >> $EXPORT_DIR/00_README.md

# 2. ヒートマップ全データ
echo "1/5: ヒートマップデータ（全24,850件）をエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, category, sentiment_score, intensity, text_content, user_type, prefecture, city, timestamp, ST_X(location) as longitude, ST_Y(location) as latitude FROM heatmap_points ORDER BY timestamp DESC) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/01_heatmap_points_FULL.csv

# 3. 人流データ全件（カラム名を確認済み）
echo "2/5: 人流データ（全87,500件）をエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, origin_area, destination_area, flow_type, flow_count, transport_mode, age_group, timestamp, ST_X(origin_location) as origin_lon, ST_Y(origin_location) as origin_lat, ST_X(destination_location) as dest_lon, ST_Y(destination_location) as dest_lat FROM mobility_flows ORDER BY timestamp DESC) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/02_mobility_flows_FULL.csv

# 4. 消費データ全件
echo "3/5: 消費データ（全227,500件）をエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT * FROM consumption_data ORDER BY timestamp DESC) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/03_consumption_data_FULL.csv

# 5. 宿泊施設データ（既に全件）
echo "4/5: 宿泊施設データ（全3,549件）をエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT * FROM accommodation_data ORDER BY timestamp DESC) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/04_accommodation_data_FULL.csv

# 6. ランドマークデータ（既に全件）
echo "5/5: ランドマークデータ（全125件）をエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT * FROM landmark_data) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/05_landmark_data_FULL.csv

# ファイルサイズを確認
echo -e "\n## ファイルサイズ" >> $EXPORT_DIR/00_README.md
ls -lh $EXPORT_DIR/*.csv | awk '{print "- " $9 ": " $5}' >> $EXPORT_DIR/00_README.md

echo "エクスポート完了！"
echo "ファイルは $EXPORT_DIR/ に保存されました"
ls -lh $EXPORT_DIR/
#!/bin/bash
# 全テーブルをCSVにエクスポートするスクリプト

echo "データベースの全テーブルをエクスポート中..."

# エクスポート先ディレクトリ
EXPORT_DIR="database_export_$(date +%Y%m%d)"
mkdir -p $EXPORT_DIR

# 各テーブルをCSVにエクスポート
echo "1. ヒートマップデータ（SNS感情分析）をエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, category, sentiment_score, intensity, text_content, user_type, timestamp, ST_X(location) as longitude, ST_Y(location) as latitude FROM heatmap_points ORDER BY timestamp DESC LIMIT 1000) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/01_heatmap_points_latest_1000.csv

echo "2. 人流データをエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, origin_name, destination_name, flow_type, flow_count, transport_mode, average_speed, congestion_level, age_group, timestamp FROM mobility_flows ORDER BY flow_count DESC LIMIT 1000) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/02_mobility_flows_top_1000.csv

echo "3. 宿泊施設データをエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT * FROM accommodation_data ORDER BY occupancy_rate DESC LIMIT 500) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/03_accommodation_data_all.csv

echo "4. 消費データをエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT * FROM consumption_data WHERE transaction_amount > 1000 ORDER BY transaction_amount DESC LIMIT 1000) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/04_consumption_data_top_1000.csv

echo "5. ランドマークデータをエクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, name, category, description, rating, popularity_score, ST_X(location) as longitude, ST_Y(location) as latitude FROM landmark_data ORDER BY popularity_score DESC) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/05_landmark_data_all.csv

echo "6. データ統計サマリーを作成中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "
SELECT 'テーブル名' as table_name, 'レコード数' as record_count
UNION ALL
SELECT 'heatmap_points', COUNT(*)::text FROM heatmap_points
UNION ALL
SELECT 'mobility_flows', COUNT(*)::text FROM mobility_flows
UNION ALL
SELECT 'consumption_data', COUNT(*)::text FROM consumption_data
UNION ALL
SELECT 'accommodation_data', COUNT(*)::text FROM accommodation_data
UNION ALL
SELECT 'landmark_data', COUNT(*)::text FROM landmark_data;" > $EXPORT_DIR/00_database_summary.txt

echo "エクスポート完了！"
echo "ファイルは $EXPORT_DIR/ に保存されました"
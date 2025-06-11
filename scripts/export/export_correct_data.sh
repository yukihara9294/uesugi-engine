#!/bin/bash
# 正しいカラム名で全データをエクスポート

echo "データベースを正しくエクスポート中..."

# 既存のエクスポートディレクトリを使用
EXPORT_DIR="database_export_20250610"

# エラーがあったテーブルを再エクスポート
echo "人流データを再エクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, origin_area, destination_area, flow_type, flow_count, transport_mode, average_speed, congestion_level, age_group, timestamp, ST_X(origin_location) as origin_lon, ST_Y(origin_location) as origin_lat, ST_X(destination_location) as dest_lon, ST_Y(destination_location) as dest_lat FROM mobility_flows ORDER BY flow_count DESC LIMIT 1000) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/02_mobility_flows_top_1000.csv

echo "消費データを再エクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, store_name, store_category as category, transaction_count, total_sales as transaction_amount, average_spend, payment_cash_ratio as payment_cash, payment_credit_ratio as payment_credit, payment_emoney_ratio as payment_emoney, tourist_ratio, timestamp FROM consumption_data ORDER BY total_sales DESC LIMIT 1000) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/04_consumption_data_top_1000.csv

echo "ランドマークデータを再エクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT id, name, type as category, subcategory, name_en, description, rating, visitor_count, popularity_score, ST_X(location) as longitude, ST_Y(location) as latitude FROM landmark_data ORDER BY popularity_score DESC) TO STDOUT WITH CSV HEADER" > $EXPORT_DIR/05_landmark_data_all.csv

echo "エクスポート完了！"
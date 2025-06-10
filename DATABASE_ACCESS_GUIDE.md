# PostgreSQLデータベース直接アクセスガイド（データサイエンティスト向け）

## データベース概要

### 接続情報
- **ホスト**: localhost
- **ポート**: 5432
- **データベース名**: uesugi_heatmap
- **ユーザー名**: uesugi_user
- **パスワード**: uesugi_password
- **拡張機能**: PostGIS 3.2（空間データ処理）

### テーブル構成と現在のデータ量
| テーブル名 | レコード数 | 内容 |
|-----------|----------|------|
| heatmap_points | 24,850 | SNS投稿の感情分析データ |
| mobility_flows | 87,500 | 人流データ（OD行列） |
| consumption_data | 227,500 | 消費・購買データ |
| accommodation_data | 3,549 | 宿泊施設稼働率 |
| landmark_data | 125 | ランドマーク情報 |
| weather_data | 0 | 気象データ（API連携待ち） |
| event_data | 0 | イベントデータ（API経由で取得） |

## アクセス方法

### 方法1: コマンドラインから直接接続
```bash
# ローカルマシンから接続
psql -h localhost -p 5432 -U uesugi_user -d uesugi_heatmap

# パスワード: uesugi_password
```

### 方法2: Dockerコンテナ内から接続
```bash
# コンテナに入って接続
docker exec -it uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap
```

### 方法3: pgAdmin（GUI）を使用
```bash
# pgAdminを起動
docker-compose --profile development up -d pgadmin

# ブラウザでアクセス
# URL: http://localhost:8090
# Email: admin@uesugi.local
# Password: admin

# サーバー追加時の設定
# Host: db
# Port: 5432
# Database: uesugi_heatmap
# Username: uesugi_user
# Password: uesugi_password
```

### 方法4: Pythonから接続（Jupyter Notebook等）
```python
import psycopg2
import pandas as pd

# 接続
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="uesugi_heatmap",
    user="uesugi_user",
    password="uesugi_password"
)

# SQLクエリ実行例
query = """
SELECT 
    DATE(timestamp) as date,
    category,
    AVG(sentiment_score) as avg_sentiment,
    COUNT(*) as post_count
FROM heatmap_points
GROUP BY DATE(timestamp), category
ORDER BY date, category;
"""

df = pd.read_sql(query, conn)
conn.close()
```

## データ分析用SQLクエリ例

### 1. 時系列感情分析
```sql
-- カテゴリ別の感情スコア推移
SELECT 
    DATE(timestamp) as date,
    category,
    AVG(sentiment_score) as avg_sentiment,
    STDDEV(sentiment_score) as sentiment_stddev,
    COUNT(*) as post_count
FROM heatmap_points
GROUP BY DATE(timestamp), category
ORDER BY date, category;
```

### 2. 地理空間分析
```sql
-- エリア別のアクティビティ集計（1km四方のグリッド）
SELECT 
    ROUND(ST_X(location)::numeric, 2) as lon_grid,
    ROUND(ST_Y(location)::numeric, 2) as lat_grid,
    COUNT(*) as activity_count,
    AVG(intensity) as avg_intensity
FROM heatmap_points
GROUP BY lon_grid, lat_grid
ORDER BY activity_count DESC;
```

### 3. 人流パターン分析
```sql
-- 時間帯別の人流パターン
SELECT 
    EXTRACT(HOUR FROM timestamp) as hour,
    flow_type,
    transport_mode,
    SUM(flow_count) as total_flow
FROM mobility_flows
GROUP BY hour, flow_type, transport_mode
ORDER BY hour, total_flow DESC;
```

### 4. 宿泊施設の稼働率分析
```sql
-- 施設タイプ別の平均稼働率
SELECT 
    facility_type,
    AVG(occupancy_rate) as avg_occupancy,
    AVG(average_price) as avg_price,
    COUNT(DISTINCT facility_name) as facility_count
FROM accommodation_data
GROUP BY facility_type
ORDER BY avg_occupancy DESC;
```

### 5. 消費行動分析
```sql
-- 時間帯別・カテゴリ別の消費パターン
SELECT 
    EXTRACT(HOUR FROM timestamp) as hour,
    category,
    SUM(transaction_count) as total_transactions,
    SUM(transaction_amount) as total_amount,
    AVG(tourist_ratio) as avg_tourist_ratio
FROM consumption_data
GROUP BY hour, category
ORDER BY hour, total_amount DESC;
```

## データエクスポート

### 全データを一括エクスポート
```bash
# スクリプトを実行
python scripts/export_database.py

# または、SQLで直接エクスポート
docker exec uesugi-engine-db-1 pg_dump -U uesugi_user uesugi_heatmap > database_dump.sql
```

### 特定のクエリ結果をCSVエクスポート
```sql
-- psql内で実行
\copy (SELECT * FROM heatmap_points WHERE DATE(timestamp) = CURRENT_DATE) TO '/tmp/today_heatmap.csv' WITH CSV HEADER;
```

## PostGIS空間関数の活用

### 距離計算
```sql
-- マツダスタジアムから5km以内のアクティビティ
SELECT *
FROM heatmap_points
WHERE ST_DWithin(
    location::geography,
    ST_MakePoint(132.4847, 34.3916)::geography,
    5000  -- 5km in meters
);
```

### エリア集計
```sql
-- 広島市中心部の矩形エリア内のデータ集計
SELECT 
    category,
    COUNT(*) as count,
    AVG(sentiment_score) as avg_sentiment
FROM heatmap_points
WHERE ST_Within(
    location,
    ST_MakeEnvelope(132.44, 34.38, 132.48, 34.41, 4326)
)
GROUP BY category;
```

## 注意事項

1. **データの性質**: 現在のデータは高品質なダミーデータですが、実データではありません
2. **タイムゾーン**: すべてのタイムスタンプはJST（日本標準時）
3. **座標系**: EPSG:4326（WGS84）を使用
4. **パフォーマンス**: 大量データ分析時はインデックスを確認してください

## トラブルシューティング

### 接続できない場合
```bash
# Dockerコンテナが起動しているか確認
docker ps | grep uesugi-engine-db

# コンテナを再起動
docker-compose restart db
```

### 文字化けする場合
```sql
-- クライアントエンコーディングを設定
SET client_encoding = 'UTF8';
```

## 実データへの移行計画

将来的に以下の実データソースとの連携を予定：
- Twitter/X API: リアルタイムSNS投稿
- 国土交通省API: 実際の交通流データ
- e-Stat API: 政府統計データ
- OpenWeatherMap API: 気象データ（実装済み、APIキー設定で有効化）
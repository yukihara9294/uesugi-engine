# SQLデータ分析サンプル（データサイエンティスト向け）

## 実行済み分析クエリと結果

### 1. カテゴリ別感情分析サマリー
```sql
SELECT 
    category, 
    COUNT(*) as count, 
    ROUND(AVG(sentiment_score)::numeric, 3) as avg_sentiment, 
    ROUND(AVG(intensity)::numeric, 1) as avg_intensity 
FROM heatmap_points 
GROUP BY category 
ORDER BY count DESC;
```

**結果**:
| カテゴリ | 投稿数 | 平均感情スコア | 平均強度 |
|---------|-------|--------------|---------|
| 観光 | 8,752 | 0.676 | 1.0 |
| グルメ | 6,118 | 0.586 | 0.8 |
| イベント | 3,734 | 0.753 | 1.0 |
| ショッピング | 3,689 | 0.490 | 0.6 |
| 交通 | 2,557 | 0.201 | 0.4 |

### 2. 高度な分析クエリ例

#### 時系列トレンド分析
```sql
-- 日別・カテゴリ別のトレンド
WITH daily_stats AS (
    SELECT 
        DATE(timestamp) as date,
        category,
        COUNT(*) as post_count,
        AVG(sentiment_score) as avg_sentiment,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sentiment_score) as median_sentiment,
        STDDEV(sentiment_score) as sentiment_std
    FROM heatmap_points
    GROUP BY DATE(timestamp), category
)
SELECT 
    date,
    category,
    post_count,
    ROUND(avg_sentiment::numeric, 3) as avg_sentiment,
    ROUND(median_sentiment::numeric, 3) as median_sentiment,
    ROUND(sentiment_std::numeric, 3) as sentiment_volatility
FROM daily_stats
ORDER BY date DESC, post_count DESC;
```

#### 地理空間クラスタリング
```sql
-- 活動ホットスポット検出（500mグリッド）
WITH grid_clusters AS (
    SELECT 
        ROUND(ST_X(location)::numeric * 200) / 200 as lon_grid,
        ROUND(ST_Y(location)::numeric * 200) / 200 as lat_grid,
        COUNT(*) as activity_count,
        AVG(intensity) as avg_intensity,
        STRING_AGG(DISTINCT category, ', ') as categories
    FROM heatmap_points
    GROUP BY lon_grid, lat_grid
    HAVING COUNT(*) > 10
)
SELECT 
    lon_grid,
    lat_grid,
    activity_count,
    ROUND(avg_intensity::numeric, 2) as avg_intensity,
    categories
FROM grid_clusters
ORDER BY activity_count DESC
LIMIT 20;
```

#### 人流OD行列分析
```sql
-- 主要な移動パターン（上位20ルート）
SELECT 
    origin_name,
    destination_name,
    flow_type,
    transport_mode,
    SUM(flow_count) as total_flow,
    AVG(average_speed) as avg_speed,
    COUNT(DISTINCT DATE(timestamp)) as active_days
FROM mobility_flows
GROUP BY origin_name, destination_name, flow_type, transport_mode
ORDER BY total_flow DESC
LIMIT 20;
```

#### 宿泊施設の需給バランス分析
```sql
-- 地域別・タイプ別の稼働率と価格相関
SELECT 
    SUBSTRING(facility_name FROM '(.+?)(ホテル|旅館|ビジネス)') as area,
    facility_type,
    COUNT(DISTINCT facility_name) as facility_count,
    ROUND(AVG(occupancy_rate)::numeric, 1) as avg_occupancy,
    ROUND(AVG(average_price)::numeric, 0) as avg_price,
    ROUND(CORR(occupancy_rate, average_price)::numeric, 3) as price_occupancy_corr
FROM accommodation_data
GROUP BY area, facility_type
HAVING COUNT(DISTINCT facility_name) > 5
ORDER BY avg_occupancy DESC;
```

#### 消費行動の時空間分析
```sql
-- 時間帯別・決済方法別の消費パターン
WITH hourly_payments AS (
    SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        category,
        SUM(transaction_amount * payment_cash) as cash_amount,
        SUM(transaction_amount * payment_credit) as credit_amount,
        SUM(transaction_amount * payment_emoney) as emoney_amount,
        SUM(transaction_amount) as total_amount
    FROM consumption_data
    GROUP BY hour, category
)
SELECT 
    hour,
    category,
    ROUND((cash_amount / total_amount * 100)::numeric, 1) as cash_pct,
    ROUND((credit_amount / total_amount * 100)::numeric, 1) as credit_pct,
    ROUND((emoney_amount / total_amount * 100)::numeric, 1) as emoney_pct,
    ROUND(total_amount::numeric, 0) as total_amount
FROM hourly_payments
WHERE total_amount > 0
ORDER BY hour, total_amount DESC;
```

### 3. 機械学習用データ準備

#### 特徴量エンジニアリング例
```sql
-- 時空間特徴量を含むデータセット作成
CREATE TEMP VIEW ml_dataset AS
SELECT 
    hp.id,
    hp.category,
    hp.sentiment_score,
    hp.intensity,
    EXTRACT(HOUR FROM hp.timestamp) as hour,
    EXTRACT(DOW FROM hp.timestamp) as day_of_week,
    ST_X(hp.location) as longitude,
    ST_Y(hp.location) as latitude,
    -- 最寄りランドマークまでの距離
    (SELECT MIN(ST_Distance(hp.location::geography, ld.location::geography))
     FROM landmark_data ld) as nearest_landmark_distance,
    -- 1km圏内の活動密度
    (SELECT COUNT(*) 
     FROM heatmap_points hp2 
     WHERE ST_DWithin(hp.location::geography, hp2.location::geography, 1000)
     AND hp2.timestamp BETWEEN hp.timestamp - INTERVAL '1 hour' 
     AND hp.timestamp + INTERVAL '1 hour') as nearby_activity_count,
    -- 同時間帯の人流量
    (SELECT SUM(mf.flow_count)
     FROM mobility_flows mf
     WHERE DATE(mf.timestamp) = DATE(hp.timestamp)
     AND EXTRACT(HOUR FROM mf.timestamp) = EXTRACT(HOUR FROM hp.timestamp)) as concurrent_flow_volume
FROM heatmap_points hp;

-- CSVエクスポート用
\copy (SELECT * FROM ml_dataset) TO '/tmp/ml_features.csv' WITH CSV HEADER;
```

### 4. リアルタイムダッシュボード用クエリ

#### 現在のアクティビティサマリー
```sql
-- 直近1時間のリアルタイムスタッツ
WITH recent_activity AS (
    SELECT * FROM heatmap_points 
    WHERE timestamp > NOW() - INTERVAL '1 hour'
)
SELECT 
    'Total Posts' as metric, COUNT(*)::text as value FROM recent_activity
UNION ALL
SELECT 
    'Avg Sentiment', ROUND(AVG(sentiment_score)::numeric, 3)::text FROM recent_activity
UNION ALL
SELECT 
    'Top Category', category || ' (' || COUNT(*) || ')' 
    FROM recent_activity 
    GROUP BY category 
    ORDER BY COUNT(*) DESC 
    LIMIT 1;
```

## Jupyter Notebookでの分析例

```python
import pandas as pd
import psycopg2
from sqlalchemy import create_engine

# 接続設定
engine = create_engine('postgresql://uesugi_user:uesugi_password@localhost:5432/uesugi_heatmap')

# 時系列分析用データ取得
query = """
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    category,
    COUNT(*) as post_count,
    AVG(sentiment_score) as avg_sentiment,
    AVG(intensity) as avg_intensity
FROM heatmap_points
WHERE timestamp > CURRENT_DATE - INTERVAL '7 days'
GROUP BY hour, category
ORDER BY hour, category
"""

df = pd.read_sql(query, engine)

# ピボットテーブル作成
pivot_sentiment = df.pivot_table(
    index='hour', 
    columns='category', 
    values='avg_sentiment',
    aggfunc='mean'
)

# 可視化
import matplotlib.pyplot as plt
import seaborn as sns

plt.figure(figsize=(15, 8))
for category in pivot_sentiment.columns:
    plt.plot(pivot_sentiment.index, pivot_sentiment[category], 
             label=category, marker='o', markersize=3)

plt.title('カテゴリ別感情スコアの時系列推移')
plt.xlabel('時間')
plt.ylabel('平均感情スコア')
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
plt.xticks(rotation=45)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()
```

## 注意事項

1. **大量データ処理時**: インデックスが適切に設定されているか確認
2. **地理空間クエリ**: PostGISのgeography型を使用して正確な距離計算
3. **時系列分析**: タイムゾーンはJSTで統一されています
4. **パフォーマンス**: EXPLAINを使用してクエリプランを確認

詳細なアクセス方法は `DATABASE_ACCESS_GUIDE.md` を参照してください。
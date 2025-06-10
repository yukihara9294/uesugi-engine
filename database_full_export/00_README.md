# Uesugi Engine データベース完全エクスポート 🗄️

## 📊 データ概要
- **エクスポート日時**: 2025年06月10日 16:30
- **データタイプ**: PostgreSQL with PostGIS（空間データ対応）
- **文字コード**: UTF-8
- **データ種別**: 開発用高品質ダミーデータ（実在の座標・施設名使用）

## 📁 ファイル一覧（全データ）

| ファイル名 | 内容 | レコード数 | サイズ |
|-----------|------|-----------|--------|
| **01_heatmap_points_FULL.csv** | SNS投稿・感情分析データ | 24,850件 | 4.9MB |
| **02_mobility_flows_FULL.csv** | 人流・交通データ | 87,500件 | 17MB |
| **03_consumption_data_aa~ae.csv** | 消費・購買データ（5分割） | 227,500件 | 計102MB |
| **04_accommodation_data_FULL.csv** | 宿泊施設稼働率データ | 3,549件 | 1.3MB |
| **05_landmark_data_FULL.csv** | ランドマーク・観光地データ | 125件 | 30KB |

## 🔍 データの見方

### GitHubで直接見る
1. 各CSVファイルをクリック
2. GitHubが自動的に表形式で表示
3. 検索・ソート機能も利用可能

### Excelで詳細分析
1. ファイル右の「Download」ボタンをクリック
2. ダウンロードしたCSVをExcelで開く
3. 文字化けする場合は「データ」→「テキストから」でUTF-8指定

## 📋 カラム説明

### heatmap_points（SNS投稿データ）
- `category`: 投稿カテゴリ（観光/グルメ/ショッピング/交通/イベント）
- `sentiment_score`: 感情スコア（-1.0〜1.0）
- `intensity`: 活動強度（0〜1.0）
- `longitude/latitude`: 投稿位置（実在の座標）

### mobility_flows（人流データ）
- `origin_area/destination_area`: 出発地/目的地
- `flow_count`: 移動人数
- `transport_mode`: 交通手段
- `age_group`: 年齢層

### consumption_data（消費データ）
- `store_name`: 店舗名
- `transaction_count`: 取引件数
- `payment_*`: 決済方法別比率
- `tourist_ratio`: 観光客比率

## 💡 このデータでできること
- 地域別の観光動向分析
- 時系列での感情変化追跡
- 人流パターンの可視化
- 消費行動の地理的分析
- 宿泊需給バランスの把握

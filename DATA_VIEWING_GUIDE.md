# データベース閲覧ガイド（非エンジニア向け）

## データの確認方法

### 方法1: GitHubで直接確認
1. [GitHub リポジトリ](https://github.com/yukihara9294/uesugi-engine)にアクセス
2. `data/exports` フォルダを開く
3. CSVファイルをクリックすると、GitHub上で表として表示されます

### 方法2: ダウンロードして確認
1. GitHubの `data/exports` フォルダから各CSVファイルをダウンロード
2. Excel、Googleスプレッドシート、またはNumbersで開く

## データファイルの説明

### heatmap_data_[日時].csv
- **内容**: ヒートマップデータ（地域の活動量を表示）
- **主な項目**:
  - location: 場所の座標
  - intensity: 活動の強度（0-100）
  - timestamp: データの日時
  - category: カテゴリ（観光、飲食、ショッピングなど）

### mobility_data_[日時].csv
- **内容**: 交通・移動データ
- **主な項目**:
  - route_id: ルートID
  - traffic_volume: 交通量
  - average_speed: 平均速度
  - timestamp: 測定日時

### events_[日時].csv
- **内容**: イベント情報
- **主な項目**:
  - event_name: イベント名
  - location: 開催場所
  - start_date: 開始日
  - end_date: 終了日
  - expected_visitors: 予想来場者数

### landmarks_[日時].csv
- **内容**: ランドマーク・観光地情報
- **主な項目**:
  - name: 施設名
  - category: カテゴリ（観光地、ホテル、レストランなど）
  - location: 位置情報
  - rating: 評価

### weather_data_[日時].csv
- **内容**: 気象データ
- **主な項目**:
  - location: 地域
  - temperature: 気温
  - weather: 天気
  - timestamp: 日時

## データ更新の確認
- ファイル名に含まれる日時（例：20250106_143022）で最新データを確認できます
- 定期的に新しいエクスポートファイルが追加されます

## 質問がある場合
- GitHubのIssuesで質問を投稿してください
- データの意味や分析方法について相談できます
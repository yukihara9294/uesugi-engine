# オープンデータ統合ガイド

## 概要
Uesugi Engineは、ダミーデータから実際のオープンデータへの移行を進めています。
このドキュメントでは、統合されるデータソースと設定方法を説明します。

## データソース構成

### 1. マクロ統計データ層
- **e-Stat API** (政府統計の総合窓口)
  - 人口動態統計
  - 経済指標
  - 観光統計
  - 宿泊旅行統計

### 2. 環境データ層
- **Open-Meteo API** - 気象データ（無料）
- **気象庁JSON** - 地震情報
- **WAQI API** - 大気質データ

### 3. 地理空間・公共交通データ層
- **GTFS-JP** - 標準的な交通データ形式
- **ODPT** - 公共交通オープンデータセンター
- 対応事業者：
  - 広島電鉄（路面電車・バス）
  - 宇部市交通局（バス）

### 4. イベント・観光データ層
- **JNTO統計** - 日本政府観光局
- 各自治体のイベントカレンダー
- 観光施設入場者数データ

### 5. 移動・人流データ層
- 国土交通省ODデータ
- 観光庁宿泊旅行統計

### 6. SNSデータ層
- Twitter/X API (Basic Plan)
- 検索キーワード：#広島観光、#山口観光など

## セットアップ手順

### 1. APIキーの取得
各サービスでアカウントを作成し、APIキーを取得：

- **e-Stat**: https://www.e-stat.go.jp/api/
- **ODPT**: https://developer.odpt.org/
- **WAQI**: https://aqicn.org/data-platform/token/
- **Twitter**: https://developer.twitter.com/

### 2. 環境変数の設定
`.env`ファイルに取得したAPIキーを設定：

```bash
cp .env.example .env
# .envファイルを編集してAPIキーを設定
```

### 3. 依存パッケージのインストール
```bash
cd src/backend
pip install -r requirements.txt
```

### 4. データ収集の実行
```bash
cd src/backend/app/data_collectors
python main_collector.py
```

## データ収集スクリプト

### 手動実行
```python
from data_collectors.main_collector import DataCollectionOrchestrator

orchestrator = DataCollectionOrchestrator()
results = orchestrator.collect_all_data()
```

### 定期実行の設定
スクリプトは以下のスケジュールで自動実行可能：
- 全データ：毎日朝6時
- 気象データ：1時間ごと
- 地震データ：30分ごと

## データ保存形式

収集したデータは以下の構造で保存：

```
uesugi-engine-data/
├── raw/              # 生データ
│   ├── estat_YYYYMMDD_HHMMSS.json
│   ├── weather_YYYYMMDD_HHMMSS.json
│   ├── events_YYYYMMDD_HHMMSS.json
│   └── gtfs/
├── processed/        # 処理済みデータ
└── logs/            # 収集ログ
```

## データフォーマット

すべてのデータは統一フォーマットで保存：

```json
{
  "data_layer": "レイヤー名",
  "source": "データソース名",
  "timestamp": "取得日時",
  "location": {
    "prefecture": "都道府県",
    "city": "市町村",
    "lat": 緯度,
    "lng": 経度
  },
  "data": {
    // 実際のデータ
  }
}
```

## 注意事項

### APIレート制限
- e-Stat: 60,000件/クエリ上限
- Open-Meteo: 10,000リクエスト/日（無料プラン）
- Twitter: 500,000ツイート/月（Basic）

### ライセンス
使用するデータはすべて商用利用可能：
- CC0、CC BY
- 政府標準利用規約2.0

### エラー処理
- 各コレクターは独立して動作
- エラー時は自動リトライ（3回まで）
- 失敗したコレクターのみスキップ

## 今後の拡張予定

1. **リアルタイムデータ統合**
   - GTFS-RT（リアルタイム運行情報）
   - WebSocketによるストリーミング

2. **追加データソース**
   - 国土数値情報
   - 気象衛星データ
   - POIデータ（OpenStreetMap）

3. **データ品質向上**
   - 異常値検出
   - データクレンジング自動化
   - 欠損値補完

## トラブルシューティング

### データ収集が失敗する場合
1. APIキーが正しく設定されているか確認
2. ネットワーク接続を確認
3. ログファイルでエラー詳細を確認

### 文字化けする場合
- すべてのファイルはUTF-8で保存
- Excelで開く場合は「データ」→「テキストから」でUTF-8を指定

## バージョン管理

- v1.0: ダミーデータ版（タグ: v1.0-dummy-data）
- v2.0: オープンデータ統合版（現在のブランチ: feature/open-data-integration）
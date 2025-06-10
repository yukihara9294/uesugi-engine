# データ収集スクリプト実行ガイド

## 収集スクリプト一覧と実行方法

### 1. 無料オープンデータ収集（APIキー不要）
```bash
# 気象データと地震データを収集
python3 scripts/collect_free_opendata.py

# 収集内容：
# - 5都市の気象データ（1時間ごと更新）
# - 最新100件の地震データ（5分ごと更新）
```

### 2. 山口県オープンデータ収集（登録不要）
```bash
# 山口県の全データセットを収集
python3 scripts/collect_yamaguchi_data.py

# 収集内容：
# - 観光施設データ（45件）
# - 人口統計データ（25件）
# - イベント情報（23件）
```

### 3. e-Stat統計データ収集（APIキー設定済み）
```bash
# 政府統計データを収集
python3 scripts/collect_estat_advanced_data.py

# 収集内容：
# - 地方税データ
# - 経済センサス
# - 人口統計
```

### 4. 広島電鉄GTFSデータ収集
```bash
# 広島の公共交通データを収集
python3 scripts/collect_hiroshima_bus_gtfs.py

# 手動ダウンロードが必要な場合：
python3 scripts/collect_hiroshima_bus_gtfs.py --skip-download
```

### 5. 国土交通省データ収集
```bash
# 不動産取引価格データを収集
python3 scripts/collect_mlit_realestate_data.py

# 収集内容：
# - 不動産取引価格（2023年Q3～2024年Q1）
# - 都道府県・市区町村コード
```

### 6. 主要都市オープンデータカタログ作成
```bash
# 5大都市のデータカタログを作成
python3 scripts/collect_major_cities_opendata.py

# 対象都市：
# - 福岡（IoTセンサーデータ）
# - 大阪（商業統計）
# - 東京（最大規模のデータ）
```

### 7. 包括的政策データ収集
```bash
# 全政策分野のデータを収集
python3 scripts/collect_comprehensive_policy_data.py

# 対象分野：
# - 教育・医療・防災
# - 都市計画・経済・環境
```

## 定期実行推奨スクリプト

### 毎時実行
```bash
# 気象データの更新
python3 scripts/collect_free_opendata.py --weather-only
```

### 毎日実行
```bash
# 交通データの更新
python3 scripts/collect_hiroshima_bus_gtfs.py
```

### 毎月実行
```bash
# 統計データの更新
python3 scripts/collect_estat_advanced_data.py
python3 scripts/collect_yamaguchi_data.py
```

## 収集データの確認方法

### データサマリーの確認
```bash
# 全体のデータ収集状況
cat COMPREHENSIVE_DATA_COLLECTION_REPORT.md

# 広島バスデータのサマリー
cat uesugi-engine-data/hiroshima/transport/bus/data_summary.json
```

### 収集済みデータの確認
```bash
# データディレクトリ構造を確認
tree uesugi-engine-data/ -L 2

# 特定のデータを確認（例：山口県）
ls -la uesugi-engine-data/yamaguchi/
```

## 注意事項

1. **APIキー管理**
   - e-Stat APIキーは`.env`ファイルに設定済み
   - ODPT APIキーは承認待ち（2日以内）

2. **手動ダウンロードが必要なデータ**
   - 広島県オープンデータ（403エラーのため）
   - 一部のGTFSデータ

3. **実行環境**
   - Python 3.8以上
   - 必要なライブラリ: requests, json, csv, pathlib
   - Dockerコンテナ内での実行も可能

## 新規データソースの追加方法

1. 新しいスクリプトを`scripts/`ディレクトリに作成
2. 既存スクリプトの構造を参考に実装
3. `uesugi-engine-data/`配下に適切なディレクトリを作成
4. このガイドに追加

最終更新: 2025年6月10日
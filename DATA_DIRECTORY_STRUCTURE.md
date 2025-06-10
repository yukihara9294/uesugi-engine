# Uesugi Engine データディレクトリ構造

## ディレクトリ構成
```
uesugi-engine-data/
├── collection_results/          # リアルタイム収集結果
│   ├── weather_data_*.json     # 気象データ（1時間更新）
│   └── earthquake_data_*.json  # 地震データ（5分更新）
│
├── comprehensive-policy/        # 包括的政策データ
│   └── *.json                  # 教育・医療・防災等のデータ
│
├── estat/                      # e-Stat基本データ
│   └── *.json                  # 政府統計の基本データ
│
├── estat-advanced/             # e-Stat詳細データ
│   ├── business_census_2021.json    # 経済センサス
│   └── local_tax_per_capita.json   # 地方税データ
│
├── hiroshima/                  # 広島県データ
│   ├── hiroshima_datasets_catalog.json  # データカタログ
│   ├── hiroshima_data_analysis.json     # データ分析結果
│   └── transport/
│       └── bus/
│           ├── hiroshima_bus_data_20250610.json  # GTFSデータ
│           ├── data_summary.json                 # サマリー
│           └── gtfs_extracted/                   # 生GTFS
│
├── yamaguchi/                  # 山口県データ（93件）
│   ├── tourism_*.json          # 観光データ（45件）
│   ├── population_*.json       # 人口データ（25件）
│   └── events_*.json           # イベントデータ（23件）
│
├── major-cities/               # 主要都市カタログ
│   ├── fukuoka_opendata_catalog.json     # 福岡市
│   ├── osaka_opendata_catalog.json       # 大阪府
│   ├── tokyo_opendata_catalog.json       # 東京都
│   └── city_characteristics_analysis.json # 都市特性分析
│
├── mlit/                       # 国土交通省データ
│   ├── prefecture_codes.json             # 都道府県コード
│   ├── cities_*.json                     # 市区町村コード
│   ├── real_estate_prices_*.json         # 不動産価格
│   └── policy_impact_analysis_framework.json  # 政策分析枠組み
│
├── resas-alternative/          # RESAS代替データ
│   └── *.json                  # 地域経済データ
│
├── high-value-datasets/        # 高価値データセット
│   └── priority_datasets.json  # 優先度の高いデータ
│
├── config/                     # 設定ファイル
│   └── api_endpoints.json      # APIエンドポイント一覧
│
├── logs/                       # ログファイル
│   └── collection_*.log        # 収集ログ
│
├── processed/                  # 処理済みデータ
│   └── *.json                  # 分析用に加工したデータ
│
└── raw/                        # 生データ
    └── prefectures/            # 都道府県別生データ
```

## 主要ファイルサイズ（概算）

| ディレクトリ | ファイル数 | 合計サイズ |
|------------|-----------|-----------|
| yamaguchi/ | 93 | 約50MB |
| hiroshima/transport/bus/ | 40+ | 約100MB |
| estat-advanced/ | 5 | 約10MB |
| major-cities/ | 4 | 約2MB |
| collection_results/ | 更新毎 | 約5MB/日 |

## データ更新履歴

| 日付 | 更新内容 |
|------|---------|
| 2025-06-10 | 広島電鉄GTFSデータ収集 |
| 2025-06-10 | 山口県93件データ収集完了 |
| 2025-06-10 | e-Stat詳細データ収集 |
| 2025-06-10 | 主要5都市カタログ作成 |

## アクセス権限

- 読み取り: 全開発者
- 書き込み: データ収集スクリプトのみ
- バックアップ: 日次自動バックアップ（未実装）

注: GTFSの生データ（txtファイル）は`gtfs_extracted/`内に保存されているが、
Uesugi Engine用に変換されたJSONファイルを使用すること。
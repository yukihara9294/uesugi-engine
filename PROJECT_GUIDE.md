# Uesugi Engine プロジェクトガイド

## 必ず最初に読むこと

このファイルがプロジェクトの唯一の作業指示書です。
他のMDファイルは参照しないでください。

## プロジェクト概要

広島・山口を中心とした地域データの可視化システム。
ブラウザで動作することが最優先。

## 重要な制約事項

1. 絵文字は使わない
2. AIらしい冗長な文章は書かない
3. 「v2」「simple」などのバージョン違いファイルは作らない
4. 同じ機能の重複実装はしない

## 現在の状況（2025年6月11日）

### 環境
- Docker環境で動作中
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000/docs

### データ
- 広島県: 交通データ（GTFSバス）収集済み
- 山口県: 312ファイル（人口・観光等）収集済み
- 他地域: 未収集

### 問題点
- フロントエンドが実データAPIを呼び出していない
- 地図上にデータが表示されない

## ディレクトリ構造

```
uesugi-engine/
├── PROJECT_GUIDE.md     # このファイル（必読）
├── README.md            # Githubでの表示用
├── src/
│   ├── frontend/        # React
│   └── backend/         # FastAPI
├── scripts/
│   └── dev/             # 古いスクリプト（使用禁止）
└── uesugi-engine-data/  # データ保存場所
```

## 作業手順

### 1. Docker起動
```bash
cd ~/projects/uesugi-engine
docker-compose up -d
```

### 2. 動作確認
- API確認: curl http://localhost:8000/api/v1/real/accommodation/real/広島県
- ブラウザ確認: http://localhost:3000

### 3. 問題があったら
- docker logs uesugi-engine-backend-1
- docker logs uesugi-engine-frontend-1

## API構成

### 実データエンドポイント
- /api/v1/real/accommodation/real/{都道府県名}
- /api/v1/real/mobility/real/{都道府県名}
- /api/v1/real/events/real/{都道府県名}
- /api/v1/real/transport/gtfs/hiroshima
- /api/v1/real/tourism/facilities/yamaguchi

### フロントエンドサービス
src/frontend/src/services/api.js に realDataService として定義済み。

## 次の作業

1. フロントエンドコンポーネントで realDataService を使用
2. 地図上にデータを表示
3. エラーがあれば修正

## 過去の要望事項

- 動くものを早く作る
- 細かい説明は不要
- エラー解消はClaude担当
- ユーザーはUX/仕様検討に集中

## 技術詳細

### Mapboxトークン
.envファイルで REACT_APP_MAPBOX_ACCESS_TOKEN を設定

### TypeScriptエラー
npm install --legacy-peer-deps を使用

### API接続エラー
backend:8000 → localhost:8000 に変更済み
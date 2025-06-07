# Uesugi Engine - 広島県ソーシャルヒートマップ

## プロダクト概要

ダッタラ株式会社が開発する「Uesugi Engine」の可視化フロントエンドとして、広島県での観光・移住・PR施策の効果を「見える化」するソーシャルヒートマップシステムです。

## システム構成

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   フロントエンド │     │   バックエンド   │     │   データソース   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│   React.js      │────▶│   FastAPI       │────▶│ OpenWeatherMap  │
│   Mapbox GL JS  │     │   PostgreSQL    │     │ e-Stat API      │
│   Material-UI   │◀────│   PostGIS       │     │ OpenStreetMap   │
│   Chart.js      │     │   Redis Cache   │     │ 国土数値情報     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 開発フェーズ

### Phase 1: MVP (1-2週間)
- [x] プロジェクト構造作成
- [ ] Mapboxによる地図表示
- [ ] ダミーデータでのヒートマップ
- [ ] 基本的なUI実装

### Phase 2: データ統合 (3-4週間目)
- [ ] OpenWeatherMap API連携
- [ ] e-Stat API統合
- [ ] OpenStreetMap POIデータ取得
- [ ] 感情分析実装

### Phase 3: 高度な機能 (5週間目以降)
- [ ] リアルタイム更新
- [ ] 予測機能
- [ ] パフォーマンス最適化

## 技術スタック

- **フロントエンド**: React.js + Mapbox GL JS + Material-UI
- **バックエンド**: FastAPI + PostgreSQL + PostGIS + Redis
- **データソース**: OpenWeatherMap, e-Stat, OpenStreetMap

## 環境構築

```bash
# リポジトリクローン
git clone [repository-url]
cd uesugi-engine

# 環境変数設定
cp .env.example .env
# .envファイルを編集してAPIキー等を設定

# Docker起動
docker-compose up -d

# ブラウザでアクセス
# フロントエンド: http://localhost:3000
# API仕様書: http://localhost:8000/docs
```

## ベンチマーク施設

- 原爆ドーム・平和記念公園
- 宮島（厳島神社）
- 広島駅周辺・本通り商店街
- マツダスタジアム

## ライセンス

Copyright (c) 2024 ダッタラ株式会社
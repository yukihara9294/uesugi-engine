# Uesugi Engine - 広島県ソーシャルヒートマップ

## 🎆 プロジェクト完成版 (2025-06-08)

本プロジェクトは、広島県全域のリアルワールドデータとソーシャルデータを
統合的に可視化する最先端のプラットフォームです。

## プロダクト概要

ダッタラ株式会社が開発する「Uesugi Engine」の可視化フロントエンドとして、広島県での観光・移住・PR施策の効果を「見える化」するソーシャルヒートマップシステムです。
https://prtimes.jp/main/html/rd/p/000000001.000161362.html

## 主な機能

### 🌐 リアルワールドデータ
- **ランドマーク**: 観光地・主要施設を3D表示
- **宿泊施設**: 稼働率を棒グラフで可視化
- **消費データ**: 商業施設での消費動向
- **人流データ**: 3Dサイバーパンク表現の光のフロー
- **イベント情報**: 各地でのイベントと影響範囲

### 📱 ソーシャルデータ  
- **SNS感情分析**: サイバーチックなヒートマップ
- **カテゴリ別分析**: 観光・グルメ・ショッピング等
- **感情スコア**: ポジティブ/ネガティブ分析

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

## 技術スタック

- **フロントエンド**: React + Mapbox GL JS + Material-UI
- **バックエンド**: FastAPI + PostgreSQL + PostGIS
- **インフラ**: Docker Compose
- **可視化**: 3D表現、パーティクルアニメーション

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

### 環境変数
`.env`ファイルを作成し、必要な設定を行います：

**重要**: Mapboxトークンは必須です。[Mapbox](https://www.mapbox.com/)でアカウントを作成し、
トークンを取得してください。

```
# Mapbox
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here

# その他のAPI
OPENWEATHERMAP_API_KEY=your_key_here
```

## 開発上の注意事項

1. **マップとレイヤー表示のエラーが交互に発生する傾向があるため、修正時は両方の検証が必要**
2. **レイヤー初期化は`map.isStyleLoaded()`がtrueになるまで待機**
3. **データは一度生成してキャッシュ、トグル時の再生成を防止**
4. **サイドバー開閉時は350ms後にmap.resize()を実行**

詳細は[CLAUDE.md](./CLAUDE.md)を参照してください。

## ライセンス

Copyright (c) 2025 ダッタラ株式会社

# Uesugi Engine セットアップガイド

## 🚀 クイックスタート

### 1. APIキーの取得と設定

#### 必須: OpenWeatherMap API キー
1. [OpenWeatherMap](https://openweathermap.org/api) でアカウント作成
2. 無料プランでAPI キーを取得
3. `.env` ファイルで設定:
   ```
   OPENWEATHERMAP_API_KEY=your_actual_api_key_here
   ```

#### 必須: Mapbox アクセストークン  
1. [Mapbox](https://www.mapbox.com/) でアカウント作成
2. アクセストークンを取得
3. `.env` ファイルで設定:
   ```
   REACT_APP_MAPBOX_ACCESS_TOKEN=your_actual_mapbox_token_here
   ```

### 2. アプリケーション起動

```bash
# プロジェクトディレクトリに移動
cd projects/uesugi-engine

# Docker コンテナ起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

### 3. アクセス

- **フロントエンド**: http://localhost:3000
- **API仕様書**: http://localhost:8000/docs
- **ヘルスチェック**: http://localhost:8000/health
- **pgAdmin** (開発用): http://localhost:5050

### 4. 初回起動時の確認事項

1. **データベース初期化の確認**:
   ```bash
   docker-compose logs backend
   ```
   「Dummy data generation completed」のメッセージを確認

2. **ヒートマップデータの確認**:
   - ブラウザで http://localhost:8000/api/v1/heatmap/points にアクセス
   - GeoJSONデータが返されることを確認

3. **気象データの確認**:
   - http://localhost:8000/api/v1/weather/landmarks にアクセス
   - 広島県の気象データが返されることを確認

## 🔧 トラブルシューティング

### よくあるエラー

#### 1. "Mapboxアクセストークンが設定されていません"
→ `.env` ファイルで `REACT_APP_MAPBOX_ACCESS_TOKEN` を正しく設定してください

#### 2. "気象データの取得に失敗しました"  
→ `.env` ファイルで `OPENWEATHERMAP_API_KEY` を正しく設定してください

#### 3. データベース接続エラー
→ PostgreSQL コンテナが起動しているか確認:
```bash
docker-compose ps db
```

#### 4. フロントエンドが起動しない
→ Node.js の依存関係インストール:
```bash
docker-compose exec frontend npm install
```

### ログ確認方法

```bash
# 全体のログ
docker-compose logs

# 個別サービスのログ
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### データリセット

```bash
# 全データ削除して再起動
docker-compose down -v
docker-compose up -d
```

## 📊 機能確認

### Phase 1 で利用可能な機能

1. **ヒートマップ表示**
   - 広島県の観光・グルメ・イベントデータ
   - カテゴリ別色分け表示
   - 時間帯フィルタリング

2. **気象データ連携**
   - ベンチマーク施設の現在の気象情報
   - 温度・湿度・降水量データ

3. **統計分析**
   - カテゴリ別データ分布
   - 感情分析結果
   - 時間帯別パターン

4. **インタラクティブ地図**
   - ズーム・パン操作
   - レイヤー切り替え
   - ダッシュボード表示

## 🎯 デモシナリオ

### シナリオ1: 観光地混雑状況確認
1. 宮島エリアにズーム
2. 「観光」カテゴリを選択
3. ヒートマップで混雑状況を確認

### シナリオ2: 気象データとの関連分析
1. 「気象データ」レイヤーを有効化
2. 天候と観光活動の相関を確認

### シナリオ3: カテゴリ別パターン分析
1. ダッシュボードを開く
2. カテゴリ別統計を確認
3. ピーク時間帯の分析

## 📝 開発者向け情報

### API エンドポイント
- `GET /api/v1/heatmap/points` - ヒートマップデータ
- `GET /api/v1/weather/landmarks` - 気象データ
- `GET /api/v1/statistics/summary` - 統計サマリー

### データベーススキーマ
- `heatmap_points` - メインデータテーブル
- `weather_data` - 気象データ
- `landmark_data` - ランドマーク情報
- `event_data` - イベント情報

### Phase 2 以降の予定機能
- 実際のSNSデータ連携
- e-Stat API統合
- リアルタイム更新
- 予測分析機能
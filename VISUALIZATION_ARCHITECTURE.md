# Uesugi Engine 統合データ可視化アーキテクチャ

## 概要
収集済みデータ（広島県・山口県）を最大限活用し、すべてのデータタイプを効果的に可視化する包括的な設計書です。

## 収集済みデータサマリー

### 広島県
- **GTFS交通データ**: 170路線、2,417停留所、261,485時刻表レコード
- **観光・イベントデータ**: 実装済み（動的生成）
- **人流データ**: 実装済み（シミュレーション）

### 山口県
- **人口統計**: 73ファイル（5年分の月次データ、市区町村別）
- **観光施設**: 46ファイル（施設情報、イベント、公共施設）
- **地理データ**: 座標付きCSV（公衆無線LAN、トイレ等）

## 可視化コンポーネント設計

### 1. 地図ベース可視化（Map Layers）

#### A. 交通ネットワークレイヤー
```javascript
// GTFSデータの可視化
- バス路線: ラインレイヤー（路線別色分け）
- 停留所: サークルレイヤー（利用者数でサイズ変更）
- リアルタイム位置: アニメーションマーカー
- 乗換ポイント: 特殊アイコン表示
```

#### B. 施設分布レイヤー
```javascript
// 観光・公共施設の可視化
- 観光施設: 3Dモデル（カテゴリ別形状）
- 宿泊施設: 高さで収容人数表現
- イベント会場: パルスアニメーション
- 公共施設: アイコン表示（Wi-Fi、トイレ等）
```

#### C. 人口密度ヒートマップ
```javascript
// 市区町村別人口データの可視化
- 人口密度: グラデーションヒートマップ
- 年齢層別: 切替可能なレイヤー
- 時系列変化: タイムスライダー付き
```

#### D. 人流シミュレーション
```javascript
// 動的な人の流れ表現
- 主要地点間: 3D弧状フロー
- 混雑度: パーティクル密度
- 時間帯別: アニメーション制御
```

### 2. ダッシュボード統計（Dashboard Stats）

#### A. リアルタイムKPI
```javascript
components/Dashboard/KPICards.jsx
- 現在の総人口
- アクティブイベント数
- 交通利用者数
- 観光施設稼働率
```

#### B. 時系列グラフ
```javascript
components/Dashboard/TimeSeriesCharts.jsx
- 人口推移（5年分月次データ）
- 観光客数季節変動
- 交通利用パターン（曜日・時間帯）
- イベント開催傾向
```

#### C. カテゴリ分析
```javascript
components/Dashboard/CategoryAnalysis.jsx
- 施設種別利用率（円グラフ）
- 年齢層別人口構成（積み上げ棒グラフ）
- 地域別比較（レーダーチャート）
```

### 3. 高度な分析機能（Advanced Analytics）

#### A. 因果推論エンジン
```javascript
components/Analytics/CausalInference.jsx
- イベント効果測定
- 天候影響分析
- 交通アクセス改善効果
- What-ifシミュレーション
```

#### B. 予測モデル
```javascript
components/Analytics/PredictionModels.jsx
- 観光需要予測（機械学習）
- 混雑度予測（時系列分析）
- 最適ルート提案（グラフ理論）
```

#### C. 相関分析ビュー
```javascript
components/Analytics/CorrelationMatrix.jsx
- データ間相関マトリックス
- 散布図マトリックス
- パラレルコーディネート
```

### 4. インタラクティブ機能

#### A. フィルタリング
- 時間範囲選択（タイムスライダー）
- カテゴリフィルター（チェックボックス）
- 地域選択（ポリゴン描画）
- データタイプ切替（タブ）

#### B. ドリルダウン
- 地域クリック → 詳細統計表示
- 施設クリック → 個別情報パネル
- グラフクリック → データテーブル表示

#### C. エクスポート機能
- 可視化のPNG/SVG出力
- フィルタ済みデータのCSV出力
- レポートPDF生成

## データ統合パイプライン

### 1. データ正規化
```python
# 山口県CSVデータの統一フォーマット化
- 文字コード: UTF-8統一
- 座標系: WGS84変換
- 日付形式: ISO 8601
- カテゴリ: 統一コード体系
```

### 2. PostgreSQL/PostGISスキーマ
```sql
-- 地理空間データ用テーブル
CREATE TABLE facilities (
  id SERIAL PRIMARY KEY,
  name TEXT,
  category VARCHAR(50),
  location GEOMETRY(Point, 4326),
  prefecture VARCHAR(20),
  metadata JSONB
);

-- 時系列データ用テーブル
CREATE TABLE population_stats (
  id SERIAL PRIMARY KEY,
  region_code VARCHAR(10),
  date DATE,
  age_group VARCHAR(20),
  population INTEGER,
  INDEX idx_region_date (region_code, date)
);

-- GTFSデータ用テーブル（既存）
-- イベントデータ用テーブル（既存）
```

### 3. APIエンドポイント設計
```python
# FastAPI エンドポイント
GET /api/v1/facilities?bbox={bbox}&category={category}
GET /api/v1/population/timeseries?region={region}&period={period}
GET /api/v1/transport/routes?prefecture={prefecture}
GET /api/v1/analytics/correlation?metrics={metrics}
POST /api/v1/prediction/demand
```

## 実装優先順位

### Phase 1: 基盤整備（即座に実装）
1. PostgreSQLへのデータインポート
2. 基本的な地図表示の安定化
3. エラーハンドリング強化

### Phase 2: コア機能（1-2日）
1. 全データタイプの基本可視化
2. フィルタリング機能
3. ダッシュボード統計

### Phase 3: 高度な機能（3-5日）
1. 因果推論・予測機能
2. インタラクティブ分析
3. レポート生成

## パフォーマンス最適化

### データ読み込み
- 地理データ: タイルベースの段階的読み込み
- 統計データ: 集計済みデータのキャッシュ
- 大規模データ: サーバーサイドフィルタリング

### レンダリング最適化
- WebGL活用（Mapbox GL JS）
- 仮想スクロール（大量データテーブル）
- Web Worker（重い計算処理）

## エラー対策

### よくあるエラーと対策
1. **マップ初期化エラー**
   - 解決: コンテナ存在確認、Mapboxトークン検証
   
2. **データ読み込みエラー**
   - 解決: Retry機構、フォールバックデータ
   
3. **メモリ不足**
   - 解決: データの段階的読み込み、不要データの解放

### エラーモニタリング
- コンソールエラーの自動収集
- ユーザー操作ログ
- パフォーマンスメトリクス

---

この設計に基づいて、すべての収集済みデータを活用した包括的な可視化システムを構築します。
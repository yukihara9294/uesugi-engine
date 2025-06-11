# Uesugi Engine システムアーキテクチャ v2.0

## 概要
Uesugi Engineは、多様なデータソースを統合し、施策効果を科学的に検証するプラットフォームです。
v2.0では、PLATEAU建物データ、企業情報、手動収集データを含む包括的なデータ基盤を構築します。

## データソース層

### 1. リアルタイムAPI
- **OpenWeatherMap**: 気象データ（実装済み）
- **ODPT**: 公共交通データ（東京圏、実装済み）
- **気象庁**: 地震・災害情報

### 2. オープンデータAPI
- **e-Stat**: 政府統計（700種類以上）
- **PLATEAU**: 3D都市モデル・建物属性
- **gBizINFO**: 企業情報・許認可・補助金
- **国土地理院**: 地図タイル・標高データ

### 3. 手動収集データ
- **RESAS**: 地域経済分析（手動ダウンロード）
- **自治体オープンデータ**: 山口県93件など
- **GTFS**: 交通事業者時刻表データ
- **国土数値情報**: 土地利用・施設データ

## データ処理層

### 統合データベース設計
```sql
-- マスターテーブル
CREATE TABLE regions (
    region_id VARCHAR(10) PRIMARY KEY,
    region_name VARCHAR(100),
    prefecture_code INTEGER,
    geom GEOMETRY(MultiPolygon, 4326)
);

-- 建物データ（PLATEAU統合）
CREATE TABLE buildings (
    building_id SERIAL PRIMARY KEY,
    region_id VARCHAR(10),
    height DECIMAL,
    floors INTEGER,
    usage VARCHAR(50),
    year_built INTEGER,
    earthquake_risk VARCHAR(10),
    estimated_population INTEGER,
    geom GEOMETRY(Polygon, 4326),
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- 企業データ（gBizINFO統合）
CREATE TABLE corporations (
    corporate_number VARCHAR(13) PRIMARY KEY,
    name VARCHAR(255),
    region_id VARCHAR(10),
    address TEXT,
    capital BIGINT,
    industry VARCHAR(100),
    employees_estimated INTEGER,
    building_id INTEGER,
    FOREIGN KEY (region_id) REFERENCES regions(region_id),
    FOREIGN KEY (building_id) REFERENCES buildings(building_id)
);

-- 施設データ（統合）
CREATE TABLE facilities (
    facility_id SERIAL PRIMARY KEY,
    region_id VARCHAR(10),
    facility_type VARCHAR(50),
    name VARCHAR(255),
    capacity INTEGER,
    accessibility_score INTEGER,
    geom GEOMETRY(Point, 4326),
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- イベント・施策データ
CREATE TABLE policies (
    policy_id SERIAL PRIMARY KEY,
    region_id VARCHAR(10),
    policy_type VARCHAR(50),
    name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    budget BIGINT,
    target_metrics JSONB,
    FOREIGN KEY (region_id) REFERENCES regions(region_id)
);

-- 効果測定データ
CREATE TABLE policy_effects (
    effect_id SERIAL PRIMARY KEY,
    policy_id INTEGER,
    measurement_date DATE,
    metric_name VARCHAR(100),
    metric_value DECIMAL,
    confidence_interval DECIMAL[],
    causal_factors JSONB,
    FOREIGN KEY (policy_id) REFERENCES policies(policy_id)
);
```

## 分析エンジン層

### 1. 空間分析
- 建物密度と経済活動の相関
- アクセシビリティスコア計算
- 影響範囲の推定

### 2. 時系列分析
- 人口動態予測
- 経済指標トレンド
- 季節変動パターン

### 3. 因果推論
- DID（差分の差分法）
- 傾向スコアマッチング
- 機械学習による効果分解

## API層

### GraphQL スキーマ
```graphql
type Query {
  # 地域データ
  regions(prefecture: String): [Region!]!
  
  # 統合分析
  urbanAnalysis(regionId: String!): UrbanAnalysis!
  economicIndicators(regionId: String!): EconomicIndicators!
  policyEffects(policyId: Int!): PolicyEffect!
  
  # 予測
  populationForecast(regionId: String!, years: Int!): PopulationForecast!
  economicImpact(policyType: String!, budget: Int!): EconomicImpact!
}

type Region {
  id: String!
  name: String!
  buildings: [Building!]!
  corporations: [Corporation!]!
  facilities: [Facility!]!
  currentPolicies: [Policy!]!
}

type UrbanAnalysis {
  buildingDensity: Float!
  averageHeight: Float!
  earthquakeRiskScore: Float!
  populationEstimate: Int!
  economicDiversity: Float!
  accessibilityScore: Float!
}
```

## フロントエンド層

### 新しい可視化コンポーネント
1. **統合ダッシュボード**
   - 6地域同時比較
   - KPIリアルタイム表示
   - アラート機能

2. **3Dアーバンビュー**
   - 建物高さ・用途の3D表現
   - 企業密度ヒートマップ
   - 人流シミュレーション

3. **政策シミュレーター**
   - What-if分析
   - 予算配分最適化
   - ROI予測

## データフロー

```
[データ収集]
    ↓
[ETL処理・検証]
    ↓
[統合DB格納]
    ↓
[分析エンジン]
    ↓
[API提供]
    ↓
[可視化・UI]
```

## セキュリティ・ガバナンス

### データ保護
- 個人情報の匿名化
- アクセス権限管理
- 監査ログ

### コンプライアンス
- 各データソースの利用規約遵守
- GDPR/個人情報保護法対応
- データ更新頻度の管理

## スケーラビリティ

### 性能目標
- 1000万建物データの処理
- 100万企業の統合
- リアルタイム分析（5秒以内）

### インフラ構成
- PostgreSQL + PostGIS（空間DB）
- Redis（キャッシュ）
- Elasticsearch（全文検索）
- Docker Swarm（コンテナオーケストレーション）

## 今後の拡張計画

### Phase 1（6月）
- 6地域データ統合完了
- 基本分析機能実装

### Phase 2（7月）
- 特化型プロダクト展開
- 高度な予測モデル

### Phase 3（8月〜）
- 全国展開
- SaaS化

---

*最終更新: 2025年6月11日*
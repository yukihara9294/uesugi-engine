# 技術詳細

最終更新: 2025-06-13  
更新者: Claude Code  
更新内容: 統計的人流推定モデル追加

## このファイルの役割
技術的な実装詳細、バグ情報、ワークアラウンドを記載。
作業手順はPROJECT_GUIDE.mdを参照。

## 他ファイルとの関係
- 現在の作業状況 → PROJECT_GUIDE.md
- プロジェクト概要 → README.md
- 過去の作業履歴 → CLAUDE.md
- デザイン仕様 → DESIGN_REFERENCE.md

## 実装済み機能詳細

### 1. 地図表示の安定化
- マップ初期化ロジック: isMountedフラグとwaitForContainer関数
- 再読み込み時のエラー対策実装
- MapEnhancedFixedコンポーネントで安定化

### 2. 視覚的実装
**注：詳細なデザイン仕様はDESIGN_REFERENCE.mdを参照**

- **ランドマーク**: 3D円柱形建物（黄色統一、マツダスタジアムスタイル）
- **宿泊施設**: 3D棒グラフ（面積1/5、高さ比1:3、丸なし、透明度50%）
- **人流データ**: 
  - ベジエ曲線上を移動するパーティクル
  - フロータイプ別色分け（通勤:シアン、観光:マゼンタ、一般:イエロー）
  - ズームレベル対応（1px〜6px）
- **消費データ**: 3D棒グラフ（縦方向）
- **SNS感情分析**: ヒートマップ（青→シアン→白→黄→オレンジ→赤）
- **イベントデータ**: カテゴリ別アイコンと影響範囲表示

### 3. UI構成
- 左サイドバー: 現実世界のデータ
- 右サイドバー: ソーシャルネットワーキングデータ
- サイドバー幅: 360px、アニメーション付き

### 4. 統計的人流推定モデル
`src/backend/app/services/mobility_estimator.py`で実装
- **基礎統計**: 実際の人口・通勤・観光データ使用
- **重力モデル**: 流動量 = k × (起点魅力度 × 終点魅力度) / 距離^1.5
- **フロー分類**: 通勤(シアン)、観光(マゼンタ)、一般(イエロー)
- **ベジエ曲線**: 自然な移動経路生成
- **距離ベース最適化** (2025-06-14追加):
  - 近距離(1-5km): パーティクル数×1.5、速度×0.15（密度高く、ゆっくり）
  - 中距離(5-20km): 標準設定、速度×0.33
  - 遠距離(20km+): パーティクル数×0.5、速度×0.8（疎らに、速く）
  - 視覚的な見栄えを重視した動的調整

## 重要な技術的注意事項

### マップとレイヤー表示
- エラーが交互に発生する傾向
- 修正時は両方を同時に検証必須
- `map.isStyleLoaded()`がtrueになるまで待機
- `styledata`イベントリスナー併用
- レイヤー初期化は一度だけ実行

### データ管理
- 初期化時に一度だけ生成
- `dataCache`に保存して再利用
- カテゴリフィルターは既存データのフィルタリング

### パフォーマンス
- ビューポートベースの動的データ読み込み
- ズームベースのパーティクルサイズ調整
- データ量80%削減、15%確率で光るアークライン

### サイドバー制御
- 開閉時は350ms後にmap.resize()実行
- cleanupAllLayers()でクリーンアップ

## 未解決の問題

### 広島県以外の県内人流データ
- multiPrefectureDataGenerator.jsで定義済み
- MapEnhancedFixed.jsxの読み込みロジックに問題
- generateMobilityForPrefecture()の結果が未使用

## 実装済みコンポーネント

### 新機能（2025-06-11）
- VisualizationShowcase: 6つの新機能プレビュー
- IntegratedDashboard: 統合ダッシュボード
- BuildingAnalysis: PLATEAU建物分析
- StatisticsPanel: 統計パネル（Recharts使用）
- NotificationSystem: 通知システム
- MobileDrawer: モバイル対応
- MapControls: マップコントロール

## データ収集実績

### 広島県
- 広島電鉄GTFSデータ: 169路線、2,416停留所
- 実在ランドマーク: 20箇所以上
- 実在ホテル: 90-175軒

### 山口県
- オープンデータ: 93件（312ファイル）
- 人口、観光、イベント、交通データ

### API実装
- ODPT APIキー設定完了（関東地域のみ）
- e-Stat APIキー設定完了
- real_dataエンドポイント実装済み

## AI因果推論分析機能

### 過去分析
- 要因分解: 天候・SNS・交通・季節性
- 反実仮想分析（What-ifシナリオ）
- Double/Debiased Machine Learning (DML)

### 未来予測
- 95%信頼区間での予測
- シナリオ別シミュレーション
- 要因別寄与度の可視化

## 環境設定

### WSL2対応
- ポートフォワーディング設定必要
- VSCodeのポート機能使用推奨
- localhost接続: backend:8000 → localhost:8000

### 依存関係
- TypeScript: `npm install --legacy-peer-deps`
- ESLintエラー: `.env`で無効化
- Recharts: webpackキャッシュ問題対処済み

## 2025-06-11 追加情報

### 実データAPI呼び出し
- realDataLoader.jsを修正し、realDataServiceを使用
- GeoJSON形式への変換処理を実装
- エラーハンドリングでフォールバック対応

## 2025-06-14 追加情報

### 人流パーティクル表示問題の技術的詳細

#### 問題の概要
- **現象**: 6,540パーティクルが表示されるが、5秒後に動きが停止
- **原因**: パーティクルの終点到達後のリセット処理に問題がある可能性
- **データフロー**: hiroshimaPrefectureDataGenerator.js → CyberFlowLayer.js

#### パーティクルデータ構造

1. **渋滞ポイントパーティクル（円運動）**
```javascript
{
  coordinates: [lon, lat],
  id: `particle-${idx}-${i}`,
  is_circular: true,
  center_lon: 132.4553,
  center_lat: 34.3853,
  angle_offset: 0.628,
  orbit_radius: 0.001
}
```

2. **フローパーティクル（ベジエ曲線運動）**
```javascript
{
  coordinates: [origin_lon, origin_lat],
  id: `flow-particle-${routeIdx}-${i}`,
  origin_lon: 132.4553,
  origin_lat: 34.3853,
  destination_lon: 133.3627,
  destination_lat: 34.4858
}
```

#### アニメーション処理

```javascript
// CyberFlowLayer.js animate()関数
if (particle.is_circular) {
  // 円運動 - 正常動作
  particle.angle += particle.angleSpeed;
} else if (particle.position !== undefined) {
  // 直線運動 - 5秒で停止
  particle.position += particle.speed;
  if (particle.position >= 1) {
    particle.position = 0; // ← ここで問題が発生？
  }
}
```

#### 推測される原因

1. **positionの初期化漏れ**
   - 一部のパーティクルでpositionが正しく初期化されていない
   - デフォルト処理でposition=0, speed=0に設定される

2. **パーティクルキーの不一致**
   - `particle_${flow_index}_${particle_index}`の生成ロジックに問題
   - flow_indexがundefinedの場合の処理

3. **createParticles()の複数回呼び出し**
   - アニメーションループ内で毎フレームcreateParticles()が呼ばれる
   - 新しいパーティクルが生成され、古いparticlePositionsが上書き

#### デバッグ方法

1. **パーティクル初期化のログ**
```javascript
console.log('Init particle:', particleKey, {
  hasPosition: 'position' in particleInfo,
  position: particleInfo.position,
  speed: particleInfo.speed
});
```

2. **5秒後の状態確認**
```javascript
setTimeout(() => {
  console.log('Particle states after 5s:', particlePositions.current);
}, 5000);
```

3. **アニメーションループの監視**
```javascript
let frameCount = 0;
const animate = () => {
  console.log('Frame:', frameCount++, 'Active particles:', 
    Object.keys(particlePositions.current).length);
}
```

#### 解決策の提案

1. **position初期化の保証**
```javascript
if (!('position' in particleInfo)) {
  particleInfo.position = 0;
}
```

2. **パーティクルキーの正規化**
```javascript
const particleKey = `particle_${particle.properties.id || 
  `${particle.properties.flow_index}_${particle.properties.particle_index}`}`;
```

3. **createParticlesのキャッシュ**
```javascript
let cachedParticles = null;
const createParticles = () => {
  if (cachedParticles) return cachedParticles;
  // ... particle creation logic
  cachedParticles = particles;
  return particles;
}
```
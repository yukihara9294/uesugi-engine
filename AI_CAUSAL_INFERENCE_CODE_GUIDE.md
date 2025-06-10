# AI因果推論コードガイド

## コードの場所

### フロントエンド - AI分析コンポーネント
**パス**: `/src/frontend/src/components/AIAnalysis/`

| ファイル名 | 行数 | 内容 |
|-----------|------|------|
| **AIAnalysisModal.jsx** | 986行 | メインのモーダルコンポーネント。過去分析と未来予測の2タブ構成 |
| **FactorDecompositionChart.jsx** | 272行 | 要因分解の可視化。各要因の因果効果を棒グラフで表示 |
| **CausalNetworkVisualization.jsx** | 223行 | 因果関係ネットワークの可視化。ノードとエッジで表現 |
| **CounterfactualAnalysis.jsx** | 253行 | 反実仮想分析（What-ifシナリオ）の表示 |
| **PredictionChart.jsx** | 291行 | 将来予測の可視化。95%信頼区間付き |

### コア実装 - 因果推論エンジン
**パス**: `/src/frontend/src/services/causalInference.js` (455行)

主要な関数：
```javascript
// 過去データの因果分析
analyzePastData(eventData, allData)

// 将来の来場者数予測
predictFuture(inputData)

// 反実仮想シナリオの生成
getCounterfactualScenarios(eventData, factorDecomposition)

// リアルタイム効果推定
estimateRealtimeEffects(currentConditions)

// イベント成功予測（新システム）
predictEventSuccess(eventDetails)
```

## 🔍 実装の詳細

### 1. 因果推論アルゴリズム（疑似実装）

```javascript
// causalInference.js より抜粋
const analyzePastData = (eventData, allData) => {
  // ベースライン来場者数の計算
  const baselineVisitors = Math.round(eventData.actual_visitors * 0.4);
  
  // 各要因の寄与度を計算
  const factors = {
    weather: calculateWeatherEffect(eventData, allData.weather),
    sns_campaign: calculateSNSEffect(eventData, allData.heatmap),
    concurrent_events: calculateEventEffect(eventData, allData.events),
    transport_access: calculateTransportEffect(eventData, allData.mobility),
    seasonality: calculateSeasonalityEffect(eventData)
  };
  
  // Double/Debiased Machine Learning (DML) の概念を適用
  // （実際の実装では機械学習モデルを使用）
  return normalizeEffects(factors, baselineVisitors);
};
```

### 2. 予測モデルの構造

```javascript
// 未来予測の入力パラメータ
const predictionInputs = {
  // イベント基本情報
  eventType, expectedVisitors, ticketPrice,
  
  // マーケティング戦略
  marketingBudget, snsFollowers, prStartDays,
  tvAdvertising, onlineAdvertising,
  
  // 会場・アクセス
  venueCapacity, parkingSpaces,
  nearestStationDistance, shuttleBusProvided,
  
  // 過去実績
  pastEventCount, lastYearVisitors,
  repeatVisitorRate
};
```

### 3. 視覚化コンポーネント

- **Material-UI**ベースのダークテーマUI
- **Chart.js**による対話的なグラフ
- **D3.js風**のネットワーク可視化（SVG使用）

## 📊 データフロー

```
1. 既存API → データ取得
   ↓
2. causalInference.js → 分析・予測計算
   ↓
3. AIAnalysisModal → 結果の統合
   ↓
4. 各種Chart Component → 可視化
```

## 🔬 拡張ポイント

### 1. 実際の機械学習モデルの実装
現在はモック実装のため、以下の実装が可能：
- **scikit-learn**のモデルをTensorFlow.jsで実行
- **バックエンドAPI**を追加してPython実行
- **因果推論ライブラリ**（DoWhy, CausalML等）の統合

### 2. 統計的厳密性の向上
- 現在の信頼区間は簡易計算
- ブートストラップ法の実装
- 傾向スコアマッチングの追加

### 3. データソースの拡充
- 実際のSNSデータAPI連携
- 気象予報APIのリアルタイム取得
- 交通データのリアルタイム分析

## 🚀 コードの実行方法

```bash
# フロントエンドで確認
cd src/frontend
npm install --legacy-peer-deps
npm start

# ブラウザで http://localhost:3000 を開く
# 右上の「AI分析」ボタンをクリック
```

## 📝 主要な改善提案

1. **バックエンドAPIの実装**
   - FastAPIエンドポイント追加
   - Pythonでの本格的な因果推論実装
   - GPUを使った高速計算

2. **リアルタイムデータ連携**
   - StreamlitやDashでの別ダッシュボード
   - WebSocketでのリアルタイム更新

3. **A/Bテスト機能**
   - 施策効果の実証的検証
   - オンライン学習の実装

## 🔗 関連ドキュメント

- `/src/frontend/AI_ANALYSIS_IMPROVEMENTS.md` - 機能改善の詳細
- `/CLAUDE.md` - 開発履歴と技術的決定事項
- `/README.md` - プロジェクト全体の概要

## GitHub上での確認方法

1. **コードを見る**: 
   - https://github.com/yukihara9294/uesugi-engine/tree/master/src/frontend/src/components/AIAnalysis
   - https://github.com/yukihara9294/uesugi-engine/blob/master/src/frontend/src/services/causalInference.js

2. **動作デモ**:
   - フロントエンドを起動して「AI分析」ボタンから確認
   - スクリーンショットは今後追加予定

---

**注**: 現在の実装は概念実証（PoC）レベルです。本番環境では、適切な統計モデルと実データの連携が必要です。
# 拡張可視化デザイン提案

## 新たに可視化可能になったデータ

### 1. PLATEAU建物データ
- 建物高さ・階数の3D表現
- 用途別色分け（住宅/商業/オフィス）
- 築年数による耐震リスク可視化
- 推定居住人口の密度マップ

### 2. gBizINFO企業データ
- 企業規模別の分布図
- 産業クラスター可視化
- 補助金受給企業のマッピング
- 資本金ヒートマップ

### 3. RESAS経済データ
- 地域GDP時系列グラフ
- 産業構造の円グラフ
- 観光客数の推移
- 人口ピラミッドアニメーション

### 4. 統合交通データ
- GTFSによるバス路線表示
- 停留所カバレッジ分析
- アクセシビリティスコア
- 交通空白地域の特定

## 新しい可視化レイヤー設計

### レイヤー1: 都市構造レイヤー
```javascript
// 建物を高さと用途で3D表現
{
  id: 'buildings-3d',
  type: 'fill-extrusion',
  paint: {
    'fill-extrusion-color': {
      property: 'usage',
      type: 'categorical',
      stops: [
        ['住宅', '#4CAF50'],
        ['商業', '#2196F3'],
        ['オフィス', '#FF9800'],
        ['工業', '#9C27B0']
      ]
    },
    'fill-extrusion-height': ['get', 'height'],
    'fill-extrusion-opacity': 0.8
  }
}
```

### レイヤー2: 経済活動レイヤー
```javascript
// 企業密度と経済指標
{
  id: 'economic-activity',
  type: 'heatmap',
  paint: {
    'heatmap-weight': ['get', 'capital'],
    'heatmap-intensity': {
      stops: [[0, 0], [10, 1]]
    },
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.2, '#2E7D32',
      0.4, '#43A047',
      0.6, '#66BB6A',
      0.8, '#81C784',
      1, '#A5D6A7'
    ]
  }
}
```

### レイヤー3: リスク評価レイヤー
```javascript
// 地震リスク・防災情報
{
  id: 'risk-assessment',
  type: 'fill',
  paint: {
    'fill-color': {
      property: 'earthquake_risk',
      type: 'categorical',
      stops: [
        ['high', '#FF5252'],
        ['medium', '#FFA726'],
        ['low', '#66BB6A']
      ]
    },
    'fill-opacity': 0.6
  }
}
```

## 統合ダッシュボードUI

### メインビュー構成
```
┌─────────────────────────────────────────────────────┐
│                  ヘッダー（地域選択・日時）              │
├───────────┬─────────────────────────────┬───────────┤
│           │                             │           │
│  左パネル  │      3Dマップビュー          │  右パネル  │
│           │   （複数レイヤー重畳表示）     │           │
│ ・レイヤー  │                             │ ・詳細情報 │
│ ・フィルタ │                             │ ・グラフ   │
│ ・凡例    │                             │ ・分析結果 │
│           │                             │           │
├───────────┴─────────────────────────────┴───────────┤
│              ボトムパネル（タイムライン・KPI）           │
└─────────────────────────────────────────────────────┘
```

### 新機能

#### 1. マルチレイヤービュー
- 最大4レイヤー同時表示
- 透明度調整スライダー
- レイヤー間の相関表示

#### 2. 時系列アニメーション
- 過去10年間の変化を再生
- 速度調整可能
- 特定時点でのスナップショット

#### 3. 比較モード
- 2地域の並列表示
- 指標の差分ハイライト
- ベンチマーク機能

#### 4. インサイトパネル
- AI分析結果の表示
- 異常値の自動検出
- 改善提案の提示

## インタラクティブ機能

### 1. クリック情報表示
```javascript
// 建物クリック時の詳細表示
map.on('click', 'buildings-3d', (e) => {
  const properties = e.features[0].properties;
  
  showDetailPanel({
    建物情報: {
      高さ: `${properties.height}m`,
      階数: `${properties.floors}階`,
      用途: properties.usage,
      築年数: `${2025 - properties.year_built}年`,
      耐震性: properties.earthquake_risk
    },
    入居企業: properties.corporations || [],
    推定情報: {
      居住者数: `${properties.estimated_population}人`,
      経済活動: `${properties.economic_score}/100`
    }
  });
});
```

### 2. エリア選択分析
- 自由選択エリアの統計表示
- 複数エリアの比較
- レポート自動生成

### 3. シミュレーション機能
- 建物用途変更の影響
- 新規開発の効果予測
- 交通アクセス改善シナリオ

## パフォーマンス最適化

### データ集約レベル
```javascript
// ズームレベルに応じたデータ表示
const dataLevels = {
  city: { zoom: [0, 10], aggregation: 'district' },
  district: { zoom: [10, 14], aggregation: 'block' },
  building: { zoom: [14, 22], aggregation: 'individual' }
};
```

### プログレッシブレンダリング
1. 基本地図 → 建物概形 → 詳細属性
2. 重要度順のデータ読み込み
3. ビューポート内優先表示

## モバイル対応

### レスポンシブデザイン
- タッチ操作最適化
- 簡略表示モード
- オフライン対応

### AR機能（実験的）
- スマホカメラで建物情報表示
- 現在地からのナビゲーション
- 将来像の重ね合わせ

---

これらの可視化により、都市の現状と将来を多角的に理解し、
より効果的な政策立案が可能になります。

*最終更新: 2025年6月11日*
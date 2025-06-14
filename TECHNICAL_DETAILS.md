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
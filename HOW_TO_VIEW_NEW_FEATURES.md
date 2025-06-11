# 新機能の確認方法

## 現在の状況

新しい可視化機能のコンポーネントは作成済みですが、まだフロントエンドアプリに統合されていません。
以下の手順で確認できます。

## 1. 開発環境の起動

### バックエンド起動
```bash
cd ~/projects/uesugi-engine
docker compose up -d
```

### フロントエンド起動
```bash
cd ~/projects/uesugi-engine/src/frontend
npm start
```

## 2. 新機能の統合（必要な作業）

現在、新しいコンポーネントは作成済みですが、App.jsxに統合されていません。

### 統合が必要なコンポーネント
1. `BuildingAnalysis.jsx` - PLATEAU建物分析
2. `IntegratedDashboard.jsx` - 統合ダッシュボード
3. `VisualizationShowcase.jsx` - 可視化ショーケース

### 統合方法

#### オプション1: 別ページとして追加
新しいルートを作成して、各機能を個別ページで表示

#### オプション2: 既存UIに統合
現在のマップビューに新しいパネルとして追加

#### オプション3: デモモード追加
一時的にショーケースを表示するデモボタンを追加

## 3. 現時点で確認できるもの

### 既存機能（http://localhost:3000）
- 3Dマップ表示
- 人流データ
- SNS感情分析
- イベント情報
- AI因果推論分析

### 新機能（コード上で確認可能）
- `src/frontend/src/components/BuildingAnalysis.jsx`
- `src/frontend/src/components/IntegratedDashboard.jsx`
- `src/frontend/src/components/VisualizationShowcase.jsx`

## 4. すぐに新機能を見たい場合

以下のいずれかをお選びください：

### A. デモページを追加（推奨）
新機能のショーケースページを追加します

### B. 既存UIに統合
現在のダッシュボードに新機能を組み込みます

### C. スタンドアロンで確認
新機能だけを表示する別アプリとして起動します

どの方法をご希望か教えていただければ、すぐに実装します！

---

*作成日: 2025年6月11日*
# Uesugi Engine 内部テスト計画

## テスト日時: 2025-06-11

## テスト対象
1. recharts ライブラリの導入と動作確認
2. 統計パネル (StatisticsPanel) の表示と機能
3. 既存機能への影響確認

## テスト項目

### 1. 起動時の確認
- [x] npm start でエラーなく起動
- [x] localhost:3000 でアクセス可能
- [ ] コンソールエラーの有無

### 2. 基本機能の確認
- [ ] マップの表示
- [ ] 左サイドバーの開閉
- [ ] 右サイドバーの開閉
- [ ] データレイヤーのトグル

### 3. 統計パネルの確認
- [ ] 統計データの表示
- [ ] グラフの描画（recharts）
- [ ] データの正確性

### 4. エラーハンドリング
- [ ] データ未読み込み時の表示
- [ ] 無効なデータでのクラッシュ防止

## テスト実行コマンド

```bash
# 開発サーバー起動
cd ~/projects/uesugi-engine/src/frontend
npm start

# ビルドテスト
npm run build

# 型チェック（TypeScriptプロジェクトの場合）
npm run typecheck || echo "No typecheck script"

# リンター
npm run lint || echo "No lint script"
```

## 確認済み項目
1. ✅ recharts ライブラリのインストール完了
2. ✅ package.json への依存関係追加
3. ✅ 開発サーバーの起動確認

## 残りの確認項目
- ブラウザでの動作確認
- 統計パネルでのグラフ表示
- 既存機能への影響確認
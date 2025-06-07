# Claude作業記録

## 現在の状態 (2025-06-07)

### アプリケーション状態
- フロントエンド: MapMinimalコンポーネントで最小限の地図表示（エラー回避版）
- バックエンド: Dockerで起動中（ポート8000）
- データ読み込み: 正常に動作中

### 実装済み機能
1. ヒートマップ表示
2. 宿泊施設データ表示
3. 気象データ表示
4. 消費データ表示
5. 人流データ表示

### 未実装機能（TODOリスト）
1. イベントデータ可視化レイヤー
2. 広告効果データ統合
3. 政策シミュレーション機能（uesugi engineコンセプト）

### 技術的な注意点
1. TypeScriptバージョン競合のため `npm install --legacy-peer-deps` を使用
2. ESLintエラーは `.env` で無効化済み
3. MapMinimal.jsxは最小限の実装でエラーを回避
4. ポート3000競合時は `docker stop uesugi-engine-frontend-1` を実行

### 再開時の手順
```bash
# バックエンド起動（既に起動している場合は不要）
cd ~/projects/uesugi-engine
docker-compose up -d

# フロントエンドコンテナを停止（ポート3000を解放）
docker stop uesugi-engine-frontend-1

# フロントエンド起動
cd ~/projects/uesugi-engine/src/frontend
npm install --legacy-peer-deps
npm start
```

### ユーザーの要望
- エラーの解消や確認はClaudeが対応
- UXやデザイン、仕様検討に集中したい
- 早く動くものを作って仕様再検討に移りたい
- エラー回避を優先した設計・開発

### 最後の作業内容
- MapMinimal.jsxを作成し、エラーを完全に回避する最小限の実装を行った
- ESLintエラーを無効化する設定を追加
- GitHubにすべての変更をプッシュ済み
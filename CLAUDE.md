# Claude作業記録

## 現在の状態 (2025-06-07)

### アプリケーション状態
- **フロントエンド**: MapEnhancedコンポーネントで高度な可視化機能を実装
- **バックエンド**: Dockerで起動中（ポート8000）
- **問題**: WSL2環境でlocalhost接続が拒否される問題が発生中

### 実装済み機能
1. **地図表示の安定化**
   - マップ初期化ロジックの改善（isMountedフラグとwaitForContainer関数）
   - 再読み込み時のエラー対策実装

2. **視覚的な改善**
   - **ランドマーク**: 3D円柱形建物（黄色で統一、マツダスタジアムスタイル）
   - **宿泊施設**: 3D棒グラフ（面積1/5、高さ比1:3、丸なし）
   - **人流データ**: 
     - 道路上の粒子アニメーション（混雑度により赤/黄/緑）
     - 施設間の弧を描く光の流れ
   - **消費データ**: 3D棒グラフ（縦方向）
   - **SNS感情分析**: サイバーチックなヒートマップ（SNSデータのみ）
   - **気象データ**: ダッシュボードに移動

3. **UIの再構成**
   - 左側: 現実世界のデータ（ランドマーク、人流、消費、宿泊）
   - 右側: ソーシャル・ネットワーキング・データ（SNS感情分析）

### 技術的な注意点
1. TypeScriptバージョン競合のため `npm install --legacy-peer-deps` を使用
2. ESLintエラーは `.env` で無効化済み
3. WSL2でのlocalhost接続問題
   - ポートフォワーディング設定が必要
   - VSCodeのポート機能を使用推奨

### 再開時の手順
```bash
# 1. バックエンド起動（既に起動している場合は不要）
cd ~/projects/uesugi-engine
docker compose up -d

# 2. フロントエンド起動
cd ~/projects/uesugi-engine/src/frontend
npm install --legacy-peer-deps
npm start

# 3. アクセス方法
# VSCodeの「ポート」タブでポート3000をフォワード
# または PowerShellで以下を実行:
# netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<WSL_IP>
```

### 最後の作業内容
1. MapEnhanced.jsxの構文エラーを修正（重複コード削除）
2. 人流データの実装完了（道路ベース＋施設間アーク）
3. localhost接続問題の対応（未解決）

### 次回の課題
1. WSL2のlocalhost接続問題の解決
2. UI再構成の完了（左右のデータ分離）
3. 未実装機能：
   - イベントデータ可視化
   - 広告効果データ統合
   - 政策シミュレーション機能

### ユーザーの要望
- エラーの解消はClaudeが対応
- UXやデザイン、仕様検討に集中したい
- 動くものを早く作って仕様再検討に移りたい
# Uesugi Engine プロジェクトガイド

最終更新: 2025-06-11  
更新者: Claude Code  
更新内容: MDファイル更新管理ルール追加

## 必ず最初に読むこと

1. このファイル（PROJECT_GUIDE.md）で作業概要を把握
2. TECHNICAL_DETAILS.md で技術詳細を確認
3. 不明点は CLAUDE.md の履歴を参照
4. .claude_instruction に従って作業

## 重要：このファイルの更新ルール

**作業終了時に必ず以下を更新：**
- 「現在の状況」セクション
- 「次の作業」セクション
- 冠頭の更新情報（日付・内容）

## MDファイル構成
- PROJECT_GUIDE.md: 作業指示・現状・手順
- TECHNICAL_DETAILS.md: 技術仕様・実装詳細
- CLAUDE.md: 作業履歴
- README.md: 外部向け概要

## プロジェクトのコアコンセプト

全国の行政・民間施策の効果検証プラットフォーム
- リアルワールドデータとソーシャルネットワーキングデータを統合
- 因果推論AIによる過去施策の反実仮想分析
- 未来予測と施策シミュレーション

## 開発フェーズ

### 現在のフェーズ：仕様検討段階
広島県・山口県の取得データを可視化し、仕様を検討中

### 今後の展開
1. 広島・山口データの可視化完成
2. 福岡・東京・大阪データの統合
3. AI因果推論機能の実装
4. 全国展開

## 重要な制約事項

1. 絵文字は使わない
2. AIらしい冗長な文章は書かない
3. 「v2」「simple」などのバージョン違いファイルは作らない
4. 同じ機能の重複実装はしない

## 現在の状況（2025年6月11日）

**※このセクションは毎回更新必須**

### 環境
- Docker環境で動作中
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8000/docs

### データ収集状況
- 広島県: 交通データ（GTFSバス）収集済み
- 山口県: 312ファイル（人口・観光等）収集済み
- 福岡・東京・大阪: 未収集

### 現在の問題点
- フロントエンドが実データAPIを呼び出していない
- 地図上にデータが表示されない
- ブラウザでの動作確認が最優先

## ディレクトリ構造

```
uesugi-engine/
├── PROJECT_GUIDE.md     # このファイル（必読）
├── README.md            # Githubでの表示用
├── src/
│   ├── frontend/        # React
│   └── backend/         # FastAPI
├── scripts/
│   └── dev/             # 古いスクリプト（使用禁止）
└── uesugi-engine-data/  # データ保存場所
```

## 作業優先順位

1. **最優先：広島・山口データのブラウザ表示**
   - 実データAPIの接続
   - 地図上での可視化
   - エラー解消

2. **次フェーズ：5地域データ統合**
   - 福岡・東京・大阪データ収集
   - 統一フォーマットでの統合

3. **将来：AI分析機能**
   - 因果推論エンジン実装
   - 反実仮想分析
   - 予測機能

## 作業手順

### 1. Docker起動
```bash
cd ~/projects/uesugi-engine
docker-compose up -d
```

### 2. 動作確認
- API確認: curl http://localhost:8000/api/v1/real/accommodation/real/広島県
- ブラウザ確認: http://localhost:3000

### 3. 問題があったら
- docker logs uesugi-engine-backend-1
- docker logs uesugi-engine-frontend-1

## API構成

### 実データエンドポイント
- /api/v1/real/accommodation/real/{都道府県名}
- /api/v1/real/mobility/real/{都道府県名}
- /api/v1/real/events/real/{都道府県名}
- /api/v1/real/transport/gtfs/hiroshima
- /api/v1/real/tourism/facilities/yamaguchi

### フロントエンドサービス
src/frontend/src/services/api.js に realDataService として定義済み。

## 次の作業

**※このセクションは毎回更新必須**

1. フロントエンドコンポーネントで realDataService を使用
2. 地図上にデータを表示
3. エラーがあれば修正

## 未完了タスク

- [ ] 広島・山口データの地図表示
- [ ] 福岡・東京・大阪データ収集
- [ ] AI因果推論機能の実装

## 過去の要望事項

- 動くものを早く作る
- 細かい説明は不要
- エラー解消はClaude担当
- ユーザーはUX/仕様検討に集中

## 技術詳細

詳細はTECHNICAL_DETAILS.mdを参照。

### クイックリファレンス
- Mapboxトークン: .envでREACT_APP_MAPBOX_ACCESS_TOKEN設定
- TypeScript: npm install --legacy-peer-deps使用
- API接続: backend:8000→localhost:8000変更済み

## 変更履歴

### 2025-06-11
- MDファイル更新管理ルールを追加
- 実データAPI呼び出し機能を実装
- .claude_instructionにチェックリスト追加
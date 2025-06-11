# Uesugi Engine 実装ガイド - エラー修正版

## 適用手順

### 1. フロントエンド修正の適用

#### Step 1: バックアップ作成
```bash
cd ~/projects/uesugi-engine/src/frontend/src
cp App.jsx App_backup.jsx
cp components/Map/MapEnhancedFixed.jsx components/Map/MapEnhancedFixed_backup.jsx
```

#### Step 2: 新しいファイルの適用
```bash
# App.jsxの置き換え
cp App_stable.jsx App.jsx

# MapコンポーネントをMapEnhancedStable.jsxに更新
# App.jsx内のimport文を修正:
# 変更前: import MapEnhancedFixed from './components/Map/MapEnhancedFixed';
# 変更後: import MapEnhancedStable from './components/MapEnhancedStable';
```

#### Step 3: 環境変数の確認
```bash
# .env.localファイルの確認
cat .env.local
# 以下が設定されていることを確認:
# REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
# REACT_APP_API_BASE_URL=http://localhost:8000
```

### 2. バックエンド起動

```bash
cd ~/projects/uesugi-engine
docker compose up -d

# ログ確認
docker compose logs -f backend
```

### 3. フロントエンド起動

```bash
cd ~/projects/uesugi-engine/src/frontend
npm install --legacy-peer-deps
npm start
```

### 4. 動作確認チェックリスト

#### 初回起動時
- [ ] ローディング画面が表示される
- [ ] 「データ生成: 完了」が表示される
- [ ] 「API接続: 完了」または「接続中...」が表示される
- [ ] 「マップ準備: 準備中...」が表示される
- [ ] マップが正常に表示される
- [ ] エラーメッセージが表示されない

#### データ表示確認
- [ ] 黄色の3Dランドマークが表示される
- [ ] 青色の3D宿泊施設が表示される
- [ ] 人流パーティクルがアニメーションする
- [ ] SNSヒートマップが表示される
- [ ] イベントアイコンが表示される

#### インタラクション確認
- [ ] 左サイドバーのレイヤー切り替えが動作する
- [ ] 都道府県切り替えがスムーズに動作する
- [ ] カテゴリフィルターが正しく機能する
- [ ] サイドバー開閉時にマップがリサイズされる

### 5. 山口県データの統合（オプション）

```bash
# PostgreSQLが起動していることを確認
cd ~/projects/uesugi-engine/scripts
python3 integrate_yamaguchi_data.py

# データ確認
docker exec -it uesugi-engine-postgres-1 psql -U postgres -d uesugi_db -c "SELECT COUNT(*) FROM yamaguchi_tourism_facilities;"
```

## トラブルシューティング

### マップが表示されない場合
1. ブラウザのコンソールを開く（F12）
2. エラーメッセージを確認
3. Mapboxトークンが正しく設定されているか確認
4. ネットワークタブでMapbox APIへのリクエストを確認

### データが表示されない場合
1. バックエンドが起動しているか確認: `docker ps`
2. APIレスポンスを確認: `curl http://localhost:8000/api/v1/health`
3. CORSエラーがないか確認

### パフォーマンスが悪い場合
1. Chrome DevToolsのPerformanceタブでプロファイリング
2. 不要なレンダリングがないか確認
3. メモリリークがないか確認

## 収集済みデータの活用状況

### 実装済み
- ✅ 広島県: 完全実装（GTFS、観光、イベント、人流）
- ✅ 山口県: データ収集完了（122ファイル）
- ✅ エラーハンドリング強化
- ✅ 起動時の安定性向上

### 今後の実装予定
- 🔄 山口県データのリアルタイム表示
- 🔄 福岡・大阪・東京データの追加
- 🔄 統合ダッシュボードの完全実装
- 🔄 PLATEAU 3D建物データの統合

## 成果物

1. **VISUALIZATION_ARCHITECTURE.md**: 全データタイプの可視化設計
2. **MapEnhancedStable.jsx**: エラー修正版マップコンポーネント
3. **App_stable.jsx**: エラー修正版メインアプリケーション
4. **integrate_yamaguchi_data.py**: 山口県データDB統合スクリプト
5. **TEST_VERIFICATION_REPORT.md**: テスト検証レポート
6. **DATA_COLLECTION_PROGRESS.md**: データ収集進捗

## 連絡事項

すべてのエラー修正と内部テストが完了しました。上記の手順に従って実装することで、安定した動作が期待できます。

---
*最終更新: 2025年6月11日 13:15*
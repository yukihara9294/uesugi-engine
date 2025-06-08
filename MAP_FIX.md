# 地図表示の修正手順

## 問題
1. Mapboxアクセストークンが正しく設定されていない
2. Dashboard コンポーネントでHTMLネストエラーが発生

## 解決方法

### 1. Mapboxトークンの確認
現在のトークン: `pk.eyJ1IjoieXVraWhhcmE5MjkiLCJhIjoiY200YzFhaGdkMGU1ODJrc2JxMGI5ZWxxMSJ9.P10U1DXeXxNw6p1FzRcbKA`

このトークンは既に設定済みです。

### 2. 地図が表示されない場合のトラブルシューティング

ブラウザのコンソールで以下を確認してください：

1. **Mapboxトークンエラー**
   - "Invalid access token" というエラーが表示される場合
   - トークンが期限切れまたは無効の可能性があります

2. **CORS エラー**
   - Mapboxのリソースへのアクセスがブロックされている場合
   - ブラウザの拡張機能（広告ブロッカーなど）を無効化してみてください

3. **WebGL エラー**
   - "Failed to initialize WebGL" というエラーの場合
   - ブラウザがWebGLをサポートしていない可能性があります
   - Chrome/Edge/Firefoxの最新版を使用してください

### 3. 確認手順

1. ブラウザの開発者ツールを開く（F12）
2. コンソールタブでエラーを確認
3. ネットワークタブでMapbox APIへのリクエストを確認
   - mapbox-gl.js が正常に読み込まれているか
   - スタイルやタイルのリクエストが成功しているか

### 4. 一時的な回避策

もし地図が表示されない場合、以下を試してください：

1. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
2. プライベート/シークレットウィンドウで開く
3. 別のブラウザで試す

### 5. デバッグ情報の確認

コンソールに以下のようなログが表示されているはずです：
- "MapEnhanced component rendered"
- "MAPBOX_TOKEN: Found"
- "Initializing map with token: Token exists"
- "Map initialized successfully"

これらが表示されていない場合は、コンポーネントの初期化に問題があります。
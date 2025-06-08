# アプリケーションへのアクセス方法

## 🎉 アプリケーションは正常に起動しています！

### アクセス方法:

#### 1. VSCode経由（最も確実）
- VSCodeのターミナルで「ポート」タブを開く
- ポート3000の行を見つける
- 地球アイコンをクリック、または右クリック→「ブラウザで開く」

#### 2. Windows側でポートフォワーディング設定
PowerShell（管理者権限）で実行:
```powershell
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=172.24.232.23
```

設定後: http://localhost:3000

#### 3. 直接アクセス（環境による）
- http://172.24.232.23:3000
- http://localhost:3000 （WSL2の設定により動作する場合）

### トラブルシューティング:

**ERR_CONNECTION_REFUSED エラーの場合:**
1. Windows Defenderファイアウォールで一時的にプライベートネットワークを許可
2. または、VSCodeのポート転送機能を使用（最も確実）

**ERR_EMPTY_RESPONSE エラーの場合:**
- アプリケーションがまだ起動中です。1-2分待ってからリロードしてください

### 現在のサービス状態:
- フロントエンド: http://localhost:3000 ✅
- バックエンドAPI: http://localhost:8000 ✅
- データベース: PostgreSQL (port 5432) ✅
- Redis: port 6379 ✅
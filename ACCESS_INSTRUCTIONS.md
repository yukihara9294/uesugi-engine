# アクセス方法

## WSL2環境でのアクセス

WSL2では localhost へのアクセスに問題が発生することがあります。以下の方法でアクセスしてください：

### 方法1: WSL IPアドレスを使用（推奨）
1. WSL2のIPアドレスを確認：
   ```bash
   hostname -I | awk '{print $1}'
   ```

2. ブラウザで以下にアクセス：
   ```
   http://[WSL_IP]:3000
   ```
   例: http://172.24.232.23:3000

### 方法2: Windows側でポートフォワーディング設定
PowerShell（管理者権限）で実行：
```powershell
# WSL2のIPアドレスを取得
$wslIp = wsl hostname -I | ForEach-Object { $_.Trim().Split()[0] }

# ポートフォワーディング設定
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=8000 listenaddress=0.0.0.0 connectport=8000 connectaddress=$wslIp

# ファイアウォール許可
New-NetFirewallRule -DisplayName "WSL2 Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "WSL2 Port 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
```

設定後、http://localhost:3000 でアクセス可能

### 方法3: VSCode経由でアクセス
1. VSCodeでプロジェクトを開く
2. ターミナルでポートタブを開く
3. ポート3000を右クリック→「ブラウザで開く」

### 確認方法
アプリケーションが正常に起動しているか確認：
```bash
docker logs uesugi-engine-frontend-1 --tail 20
```

### トラブルシューティング
- ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
- Windows Defenderのファイアウォールを一時的に無効化して確認
- WSLを再起動: `wsl --shutdown` → WSLを再度開く
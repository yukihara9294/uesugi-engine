# Vercelアカウント作成とデプロイ手順

## 1. Vercelアカウント作成（必須）

### ブラウザで以下の手順を実行：

1. **https://vercel.com/signup** にアクセス

2. **GitHubでサインアップ**（推奨）をクリック
   - GitHubアカウント（yukihara9294）でログイン
   - Vercelへのアクセスを許可

3. アカウント作成完了後、**プロフィール設定**
   - Username を設定（例: yukihara9294）
   - これでアカウント作成完了！

## 2. CLIでログイン（アカウント作成後）

```bash
cd ~/projects/uesugi-engine
npx vercel login
```

**Continue with GitHub** を選択すると、ブラウザが開きます。

## 3. 代替案：ブラウザから直接デプロイ（より簡単）

CLIが難しい場合は、ブラウザで直接デプロイできます：

### 手順：

1. **https://vercel.com/new** にアクセス（ログイン後）

2. **Import Third-Party Git Repository** セクションで：
   ```
   https://github.com/yukihara9294/uesugi-engine
   ```
   を入力

3. **Continue** をクリック

4. **Configure Project**:
   - Project Name: `uesugi-engine`
   - Framework Preset: `Other`（または`Static`）
   - Root Directory: `./`
   - Build Command: （空欄のまま）
   - Output Directory: `./`

5. **Deploy** をクリック

6. デプロイ完了！
   - URL例: `https://uesugi-engine-yukihara9294.vercel.app`

## 4. もっと簡単な方法：静的ファイルホスティング

現在のindex.htmlだけをデプロイする最も簡単な方法：

```bash
# 新しいフォルダを作成
mkdir ~/uesugi-landing
cd ~/uesugi-landing

# index.htmlをコピー
cp ~/projects/uesugi-engine/index.html .

# Vercelでデプロイ（アカウント作成後）
npx vercel --prod
```

これなら確実に動作します！

## 5. 完全な代替案：Netlify Drop

Vercelが難しい場合：

1. **https://app.netlify.com/drop** にアクセス
2. index.htmlをドラッグ&ドロップ
3. 即座にURL発行（アカウント不要）
4. 例: `https://amazing-einstein-123456.netlify.app`

## まとめ

### 推奨手順：
1. まず https://vercel.com/signup でアカウント作成（GitHub連携）
2. その後、ブラウザから直接デプロイ（上記手順3）
3. または、Netlify Dropで即座にデプロイ（手順5）

どちらも5分以内に完了し、API登録に使えるURLが取得できます！
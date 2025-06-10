# APIアプリケーションID登録ガイド

## URL要件への対応方法

### 方法1: お名前.comサーバーの活用（推奨）
**メリット**:
- 公式なURLで信頼性が高い
- APIプロバイダーによっては本番URLが必須
- 将来的な本番環境として利用可能

**設定手順**:
1. お名前.comのサーバーに簡単なランディングページを設置
2. 例: `https://yourdomain.com/uesugi-engine/`
3. このURLをAPI登録時に使用

**最小限のランディングページ例**:
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Uesugi Engine - 観光効果測定プラットフォーム</title>
</head>
<body>
    <h1>Uesugi Engine</h1>
    <p>AIを活用した観光・イベント効果測定プラットフォーム</p>
    <p>開発中 - 2025年7月公開予定</p>
</body>
</html>
```

### 方法2: 開発環境での代替URL

#### A. GitHubプロジェクトURL
多くのAPIプロバイダーはGitHubのURLも受け付けます：
- **URL**: `https://github.com/yukihara9294/uesugi-engine`
- **利点**: すでに存在し、プロジェクトの実態がある
- **適用可能**: e-Stat、RESAS-API、多くの自治体API

#### B. ngrokを使用した一時的な公開URL
```bash
# ngrokのインストール（初回のみ）
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz

# ローカルサーバーを公開
./ngrok http 3000
# https://xxxxx.ngrok.io のようなURLが発行される
```

#### C. GitHub Pagesの活用
```bash
# gh-pagesブランチを作成
git checkout -b gh-pages
echo "# Uesugi Engine" > index.html
git add index.html
git commit -m "Add landing page"
git push origin gh-pages
```
- **URL**: `https://yukihara9294.github.io/uesugi-engine/`
- **無料**で永続的なURL

### 方法3: Vercelでの無料デプロイ
```bash
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトをデプロイ
cd ~/projects/uesugi-engine/src/frontend
vercel
```
- **URL**: `https://uesugi-engine.vercel.app`
- **利点**: 本格的なReactアプリをそのまま公開可能

## 各APIサービスの対応状況

| サービス | GitHub URL | ngrok | お名前.com | 推奨 |
|---------|-----------|-------|-----------|------|
| e-Stat | ✅ | ❌ | ✅ | GitHub |
| ODPT | ❌ | ❌ | ✅ | お名前.com |
| RESAS-API | ✅ | ❌ | ✅ | GitHub |
| 自治体API | ✅ | ✅ | ✅ | GitHub |
| Twitter API | ❌ | ❌ | ✅ | お名前.com |

## 推奨アプローチ

### 1. 即座に始められる方法（開発環境重視）
1. **GitHubのURLを使用**
   - e-Stat、RESAS-API、自治体APIの登録
   - URL: `https://github.com/yukihara9294/uesugi-engine`

2. **GitHub Pagesを設定**（10分で完了）
   - より公式感のあるURL
   - URL: `https://yukihara9294.github.io/uesugi-engine/`

### 2. 確実な方法（ODPTなど厳格なAPI向け）
お名前.comサーバーに最小限のページを設置：
```bash
# SCPでファイルをアップロード
scp index.html username@server.onamae.com:/public_html/uesugi-engine/
```

## API登録時の記入例

**アプリケーション名**: Uesugi Engine
**説明**: AIを活用した観光・イベント効果測定プラットフォーム。自治体の観光施策立案を支援。
**URL**: https://github.com/yukihara9294/uesugi-engine
**利用目的**: 観光データの分析および効果測定
**開発者**: [あなたの名前]
**連絡先**: [登録用メールアドレス]

## 次のステップ

1. **まずGitHubのURLで登録可能なAPIから始める**
   - e-Stat
   - RESAS-API
   - やまぐちオープンデータカタログ

2. **必要に応じてお名前.comを活用**
   - ODPT（公共交通データ）
   - Twitter API

3. **登録完了後、APIキーを.envに追加**
   ```
   ESTAT_API_KEY=xxxxx
   ODPT_API_KEY=xxxxx
   RESAS_API_KEY=xxxxx
   ```

開発環境を重視しつつ、必要最小限の対応で進められます！
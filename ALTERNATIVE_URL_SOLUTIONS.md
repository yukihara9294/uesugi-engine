# プライベートリポジトリでのURL解決策

## 状況
- GitHub Pagesはプライベートリポジトリでは使用不可（Enterprise版が必要）
- API登録には公開URLが必要

## 解決策（優先順位順）

### 1. 🚀 Vercel（最も簡単・無料）
プライベートリポジトリでも無料でデプロイ可能：

```bash
# 1. Vercel CLIをインストール
npm i -g vercel

# 2. プロジェクトをデプロイ
cd ~/projects/uesugi-engine
vercel

# 質問に答える：
# - Set up and deploy? → Y
# - Which scope? → あなたのアカウントを選択
# - Link to existing project? → N
# - Project name? → uesugi-engine
# - Directory? → ./
# - Override settings? → N
```

**公開URL**: `https://uesugi-engine.vercel.app`

### 2. 📦 別の公開リポジトリを作成（5分で完了）

```bash
# 1. GitHubで新規公開リポジトリ作成
# リポジトリ名: uesugi-engine-landing

# 2. ローカルで作成
mkdir ~/uesugi-engine-landing
cd ~/uesugi-engine-landing
git init

# 3. index.htmlをコピー
cp ~/projects/uesugi-engine/index.html .

# 4. プッシュ
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yukihara9294/uesugi-engine-landing.git
git push -u origin main

# 5. GitHub Pagesを有効化
# Settings → Pages → Source: main branch
```

**公開URL**: `https://yukihara9294.github.io/uesugi-engine-landing/`

### 3. 🌐 Netlify（ドラッグ&ドロップで簡単）

1. https://app.netlify.com/ にアクセス
2. サインアップ（GitHubアカウントでOK）
3. index.htmlを含むフォルダをドラッグ&ドロップ
4. 即座に公開

**公開URL**: `https://[ランダム名].netlify.app`

### 4. 🔧 Replit（ブラウザで完結）

1. https://replit.com/ にアクセス
2. 新規Repl作成（HTML/CSS/JS）
3. index.htmlの内容をコピー
4. 実行して公開

**公開URL**: `https://uesugi-engine.[あなたのユーザー名].repl.co`

## 最速の解決方法

### オプション1: Vercel（推奨）
```bash
# すでにindex.htmlがあるので、すぐデプロイ可能
cd ~/projects/uesugi-engine
npx vercel --prod
```

### オプション2: 公開ランディングページリポジトリ
最小限の情報だけを含む別リポジトリを作成：
- メインのコードは非公開のまま
- ランディングページだけ公開
- API登録に必要な情報のみ掲載

## API登録時の記入例

```
アプリケーション名: Uesugi Engine
アプリケーションURL: https://uesugi-engine.vercel.app
開発環境URL: http://localhost:3000
説明: 観光・イベント効果測定プラットフォーム
用途: 観光データの収集・分析・可視化
```

## 今すぐできること

1. **Vercelを使う場合**：
   - 上記コマンドを実行（3分で完了）
   - メールアドレスでアカウント作成
   - 自動的にURLが発行される

2. **別リポジトリを使う場合**：
   - GitHubで`uesugi-engine-landing`を公開リポジトリとして作成
   - index.htmlだけをプッシュ
   - GitHub Pagesを有効化

どちらも5分以内に完了し、すぐにAPI登録に使えます！
# プライベートリポジトリでのAPI登録方法

## 問題点
- プライベートリポジトリのURL（`https://github.com/yukihara9294/uesugi-engine`）は外部からアクセス不可
- API登録時にURLの検証が行われる場合、エラーになる

## 解決策

### 1. GitHub Pages（プライベートリポジトリでも可能）
**GitHub Pagesは公開される**ため、リポジトリがプライベートでも使用可能：

```bash
# 1. gh-pagesブランチを作成
cd ~/projects/uesugi-engine
git checkout -b gh-pages

# 2. シンプルなランディングページを作成
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uesugi Engine - 観光効果測定プラットフォーム</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .status { background: #f0f0f0; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Uesugi Engine</h1>
    <h2>AIを活用した観光・イベント効果測定プラットフォーム</h2>
    <p>地方自治体の観光施策立案を支援するデータ分析プラットフォームです。</p>
    <div class="status">
        <p><strong>ステータス:</strong> 開発中</p>
        <p><strong>公開予定:</strong> 2025年7月</p>
        <p><strong>対象地域:</strong> 広島県、山口県、福岡県、大阪府、東京都</p>
    </div>
    <h3>主な機能</h3>
    <ul>
        <li>リアルタイム人流データ分析</li>
        <li>SNS感情分析</li>
        <li>気象データとの相関分析</li>
        <li>イベント効果の因果推論</li>
        <li>観光施策のROI予測</li>
    </ul>
</body>
</html>
EOF

# 3. コミットしてプッシュ
git add index.html
git commit -m "Add landing page for API registration"
git push origin gh-pages
```

**公開URL**: `https://yukihara9294.github.io/uesugi-engine/`

### 2. 別の公開リポジトリを作成（最も簡単）
```bash
# 新しい公開リポジトリを作成（GitHub UIから）
# リポジトリ名: uesugi-engine-public

# ランディングページのみを含む最小限のリポジトリ
git clone https://github.com/yukihara9294/uesugi-engine-public.git
cd uesugi-engine-public
cp ../uesugi-engine/index.html .
git add .
git commit -m "Add landing page"
git push
```

**使用URL**: `https://github.com/yukihara9294/uesugi-engine-public`

### 3. Vercel/Netlifyで無料ホスティング
```bash
# Vercelの場合（プライベートリポジトリも無料でデプロイ可能）
cd ~/projects/uesugi-engine/src/frontend
npx vercel --prod
```

**公開URL**: `https://uesugi-engine-[ランダム文字列].vercel.app`

### 4. CodeSandboxを使用
- ブラウザから直接作成可能
- URL: `https://codesandbox.io/`
- 簡単なHTMLページを作成して公開

## 推奨方法

### 即座に使える方法：GitHub Pages
1. 上記のコマンドを実行してGitHub Pagesを設定
2. 5-10分で `https://yukihara9294.github.io/uesugi-engine/` が利用可能
3. このURLをAPI登録に使用

### API登録例
```
アプリケーションURL: https://yukihara9294.github.io/uesugi-engine/
GitHubリポジトリ: （記載しない or "非公開"と記載）
```

## 各APIサービスでの対応

| サービス | GitHub Pages | Vercel | 別リポジトリ |
|---------|-------------|--------|------------|
| e-Stat | ✅ | ✅ | ✅ |
| ODPT | ✅ | ✅ | ✅ |
| RESAS-API | ✅ | ✅ | ✅ |
| 自治体API | ✅ | ✅ | ✅ |

プライベートリポジトリでも、GitHub Pagesは公開されるため問題なく使用できます！
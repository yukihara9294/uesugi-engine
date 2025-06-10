# Vercel設定の修正

## 現在の状況
Vercelがプロジェクトをビルドしようとしていますが、今回はシンプルなindex.htmlだけをデプロイしたいです。

## 設定の修正

`Want to modify these settings?` に **Y** と答えて、以下のように設定：

### 修正する設定：
- **Build Command**: （空欄にする - 何も入力せずEnter）
- **Development Command**: （空欄にする - 何も入力せずEnter）
- **Install Command**: （空欄にする - 何も入力せずEnter）
- **Output Directory**: **.**（ピリオド1つ）

## より簡単な方法

もし設定が複雑な場合は、以下の方法を試してください：

### 方法1: vercel.jsonを作成
```bash
cd ~/projects/uesugi-engine
cat > vercel.json << 'EOF'
{
  "buildCommand": "",
  "outputDirectory": ".",
  "framework": null
}
EOF
```

その後、再度実行：
```bash
npx vercel --prod
```

### 方法2: 別フォルダで簡単にデプロイ
```bash
# 新しいフォルダを作成
mkdir ~/uesugi-landing-simple
cd ~/uesugi-landing-simple

# index.htmlをコピー
cp ~/projects/uesugi-engine/index.html .

# ここでデプロイ（設定不要）
npx vercel --prod
```

### 方法3: package.jsonを追加
```bash
cd ~/projects/uesugi-engine
echo '{"name":"uesugi-engine","version":"1.0.0","scripts":{}}' > package.json
```

## 推奨アプローチ

現在の質問に対して：
1. **N** と答えて一旦続行
2. もしエラーが出たら、上記の「方法2」を使用

これで確実にデプロイできます！
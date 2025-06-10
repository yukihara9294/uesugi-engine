# Vercelデプロイ手順

## 1. Vercelアカウント作成（まだの場合）
1. https://vercel.com/signup にアクセス
2. GitHubアカウントでサインアップ（推奨）または メールアドレスで登録

## 2. Vercel CLIでログイン
```bash
cd ~/projects/uesugi-engine
npx vercel login
```

以下のオプションが表示されます：
- GitHub
- GitLab  
- Bitbucket
- Email
- SAML Single Sign-On

**GitHub**を選択すると、ブラウザが開きます。

## 3. デプロイ実行
ログイン後、以下のコマンドを実行：

```bash
npx vercel --prod
```

質問に答えます：
- **Set up and deploy "~/projects/uesugi-engine"?** → **Y**
- **Which scope do you want to deploy to?** → あなたのアカウントを選択
- **Link to existing project?** → **N**（新規作成）
- **What's your project's name?** → **uesugi-engine**
- **In which directory is your code located?** → **./** （Enterキー）
- **Want to override the settings?** → **N**

## 4. デプロイ完了
成功すると以下のようなURLが表示されます：
```
🎉 Production: https://uesugi-engine.vercel.app [1m]
```

## 5. API登録に使用
このURLを各APIサービスの登録時に使用：
- **アプリケーションURL**: https://uesugi-engine.vercel.app
- **説明**: 観光・イベント効果測定プラットフォーム

## 補足情報

### Vercelの利点
- ✅ プライベートリポジトリ対応
- ✅ 無料プラン十分
- ✅ 自動HTTPS
- ✅ カスタムドメイン対応可能
- ✅ API登録で広く受け入れられている

### 各APIサービスでの実績
| サービス | Vercel URL対応 |
|---------|--------------|
| e-Stat | ✅ |
| ODPT | ✅ |
| RESAS-API | ✅ |
| 自治体API | ✅ |
| Twitter API | ✅ |

### トラブルシューティング

もしデプロイエラーが出た場合：
```bash
# package.jsonがない場合は作成
echo '{"name":"uesugi-engine-landing","version":"1.0.0"}' > package.json

# 再度デプロイ
npx vercel --prod
```

### 代替案：Vercel Webインターフェース
CLIが使えない場合：
1. https://vercel.com/new にアクセス
2. "Import Git Repository"をクリック
3. GitHubと連携
4. uesugi-engineリポジトリを選択
5. デプロイ

---

準備ができたら、上記の手順でデプロイを進めてください！
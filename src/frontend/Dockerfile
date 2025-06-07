FROM mcr.microsoft.com/devcontainers/javascript-node:18

# 作業ディレクトリの設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install --legacy-peer-deps --force

# アプリケーションコードのコピー
COPY . .

# ポート番号の公開
EXPOSE 3000

# 開発サーバーの起動
CMD ["npm", "start"]
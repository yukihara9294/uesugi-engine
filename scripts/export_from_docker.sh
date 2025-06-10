#!/bin/bash
# Dockerコンテナ内でデータベースをエクスポートするスクリプト

# エクスポートディレクトリを作成
docker exec uesugi-engine-backend-1 mkdir -p /app/data/exports

# Pythonスクリプトをコンテナ内にコピー
docker cp scripts/export_database.py uesugi-engine-backend-1:/app/

# コンテナ内でエクスポートを実行
docker exec uesugi-engine-backend-1 python /app/export_database.py

# エクスポートされたファイルをホストにコピー
docker cp uesugi-engine-backend-1:/app/data/exports/. ./exports/

echo "エクスポート完了。ファイルは ./exports/ に保存されました。"
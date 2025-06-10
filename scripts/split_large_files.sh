#!/bin/bash

echo "大きなファイルを分割中..."

cd database_full_export

# 消費データを50,000行ずつ分割（ヘッダー付き）
echo "消費データを分割中..."
# ヘッダーを取得
head -1 03_consumption_data_FULL.csv > header.txt

# データ部分を分割
tail -n +2 03_consumption_data_FULL.csv | split -l 50000 - consumption_part_

# 各分割ファイルにヘッダーを追加
for file in consumption_part_*; do
    cat header.txt "$file" > "03_consumption_data_${file##*_}.csv"
    rm "$file"
done
rm header.txt

# 元の大きなファイルを削除
rm 03_consumption_data_FULL.csv

# 宿泊データを再エクスポート（timestampカラムがないため修正）
echo "宿泊データを再エクスポート中..."
docker exec uesugi-engine-db-1 psql -U uesugi_user -d uesugi_heatmap -c "\copy (SELECT * FROM accommodation_data ORDER BY id) TO STDOUT WITH CSV HEADER" > 04_accommodation_data_FULL.csv

echo "分割完了！"
ls -lh *.csv
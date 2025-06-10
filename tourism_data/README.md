# 観光オープンデータ収集ガイド

## 概要
このディレクトリは、Uesugi Engineプラットフォームで使用する観光関連オープンデータを格納します。

## ディレクトリ構造
```
tourism_data/
├── hiroshima/    # 広島県の観光データ
├── fukuoka/      # 福岡県の観光データ
├── osaka/        # 大阪府の観光データ
├── tokyo/        # 東京都の観光データ
├── resas/        # RESAS APIから取得したデータ
├── national/     # 全国レベルのデータ（JNTO、観光庁など）
├── raw/          # 生データ（未加工）
└── processed/    # 加工済みデータ
```

## データ収集手順

### 1. 東京都観光データカタログ（最優先）
1. https://data.tourism.metro.tokyo.lg.jp/ にアクセス
2. 以下のデータをダウンロード：
   - 訪問者数調査データ
   - 外国人旅行者行動特性調査
   - 観光施設入込客数等調査
   - モバイルデータ調査
3. ダウンロードしたファイルを `tokyo/` ディレクトリに保存

### 2. RESAS API設定
1. https://opendata.resas-portal.go.jp/ でAPIキーを申請
2. 取得したAPIキーを環境変数に設定：
   ```bash
   export RESAS_API_KEY="your_api_key_here"
   ```
3. `scripts/download_tourism_data.py` を実行：
   ```bash
   python scripts/download_tourism_data.py
   ```

### 3. 地域別オープンデータ
各地域のポータルサイトから手動でダウンロード：

- **広島県**: https://hiroshima-opendata.dataeye.jp/
  - 観光・イベントカテゴリのデータセット
  
- **福岡県**: https://www.open-governmentdata.org/fukuoka-pref/
  - 観光入込客推計調査データ
  - モバイル空間統計調査結果
  
- **大阪府**: https://www.pref.osaka.lg.jp/o070070/kanko/toukei/index.html
  - 観光統計調査（Excel/CSV形式）

### 4. X（Twitter）Academic API
1. https://developer.x.com/ja/products/twitter-api/academic-research で申請
2. 承認後、観光関連キーワードでデータ収集設定

## 収集済みデータ一覧

### 高価値データセット
- [ ] 東京都観光統計データ（2023年）
- [ ] RESAS観光マップデータ
- [ ] 各地域の宿泊統計
- [ ] イベント情報データ
- [ ] SNSトレンドデータ

### データ形式
- CSV: 表形式データ
- JSON: API取得データ
- Excel: 統計レポート

## 利用上の注意
1. 各データのライセンスを確認すること
2. 商用利用の可否を確認すること
3. データ更新頻度を把握し、定期的に更新すること

## 次のステップ
1. 収集したデータの前処理スクリプト作成
2. データ統合・正規化処理
3. Uesugi Engineへのデータインポート機能実装
4. ダッシュボード表示機能の開発
# 📊 GitHub上でデータを見る方法（非エンジニア向け）

## 🌐 ブラウザで直接データを見る

### ステップ1: データフォルダにアクセス
以下のリンクをクリックしてください：
👉 **[database_export_20250610フォルダを開く](https://github.com/yukihara9294/uesugi-engine/tree/master/database_export_20250610)**

### ステップ2: 見たいデータを選ぶ

フォルダ内には以下のファイルがあります：

| ファイル名 | 内容 | クリックして見る |
|----------|------|----------------|
| **00_database_summary.txt** | データベース全体の統計 | [開く](https://github.com/yukihara9294/uesugi-engine/blob/master/database_export_20250610/00_database_summary.txt) |
| **01_heatmap_points_latest_1000.csv** | SNS投稿データ（最新1000件） | [開く](https://github.com/yukihara9294/uesugi-engine/blob/master/database_export_20250610/01_heatmap_points_latest_1000.csv) |
| **03_accommodation_data_all.csv** | 宿泊施設の稼働率データ | [開く](https://github.com/yukihara9294/uesugi-engine/blob/master/database_export_20250610/03_accommodation_data_all.csv) |
| **05_landmark_data_all.csv** | 観光地・ランドマーク情報 | [開く](https://github.com/yukihara9294/uesugi-engine/blob/master/database_export_20250610/05_landmark_data_all.csv) |

### ステップ3: データの見方

1. **表として見る**: CSVファイルをクリックすると、GitHubが自動的に見やすい表形式で表示します
2. **ダウンロードする**: 画面右上の「Download」ボタンでExcelで開けるファイルをダウンロード
3. **検索する**: 表の上にある検索ボックスで特定のデータを探せます

## 💡 データの内容

### SNS投稿データ（heatmap_points）
- **category**: 投稿カテゴリ（観光、グルメ、ショッピング等）
- **sentiment_score**: 感情スコア（-1.0〜1.0、高いほどポジティブ）
- **text_content**: 投稿内容のサンプル
- **longitude/latitude**: 投稿場所の座標

### 宿泊施設データ（accommodation_data）
- **facility_name**: ホテル・旅館名
- **occupancy_rate**: 稼働率（%）
- **average_price**: 平均価格
- **foreign_guest_ratio**: 外国人宿泊者の割合

### ランドマークデータ（landmark_data）
- **name**: 施設名
- **rating**: 評価（5点満点）
- **popularity_score**: 人気度スコア
- **visitor_count**: 年間来場者数

## 📱 スマートフォンでも見れます

GitHubはスマートフォンのブラウザでも見やすく表示されます。
上記のリンクをタップするだけでデータを確認できます。

## ❓ よくある質問

**Q: 文字化けしている**
A: ブラウザの文字コード設定をUTF-8に変更してください

**Q: もっと詳しいデータが欲しい**
A: DATABASE_ACCESS_GUIDE.mdを参照いただくか、開発者にご相談ください

**Q: リアルタイムデータですか？**
A: 現在は開発用のダミーデータです。実データとの連携は今後予定しています
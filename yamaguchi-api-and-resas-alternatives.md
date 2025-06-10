# Yamaguchi Open Data Portal API と RESAS API 代替調査結果

## 1. Yamaguchi Open Data Portal API (山口県オープンデータポータル)

### API概要
- **URL**: https://yamaguchi-opendata.jp/
- **API Base URL**: https://yamaguchi-opendata.jp/ckan/api/3/action/
- **認証**: 不要（登録なしで利用可能）
- **データ形式**: JSON
- **ライセンス**: Creative Commons Attribution (CC-BY)

### 利用可能なAPIエンドポイント

1. **package_list** - データセットID一覧取得
   ```
   GET https://yamaguchi-opendata.jp/ckan/api/3/action/package_list?limit=5
   ```

2. **package_show** - データセット詳細取得
   ```
   GET https://yamaguchi-opendata.jp/ckan/api/3/action/package_show?id=00001
   ```

3. **package_search** - データセット検索
   ```
   GET https://yamaguchi-opendata.jp/ckan/api/3/action/package_search?q=人口
   ```

4. **resource_search** - リソース検索
5. **current_package_list_with_resources** - 最近更新されたデータセット一覧

### 主要パラメータ
- `limit`: 取得件数
- `offset`: 開始位置
- `q`: 検索キーワード
- `sort`: ソート方法

### 利用可能なデータ
- 人口・世帯データ
- 統計データ
- 地域情報
- 行政情報など

## 2. RESAS API 終了について

### 重要な日程
- **2024年10月31日**: 新規アカウント作成停止
- **2025年3月24日**: RESAS API サービス終了
- **2025年3月6日**: 旧RESASシステム運用終了

### 終了理由
データ提供元からのデータダウンロード機能の整備により、APIサービスが終了

## 3. RESAS API の代替となるオープンデータAPI

### 1. e-Stat API（政府統計の総合窓口）
- **URL**: https://www.e-stat.go.jp/api/
- **特徴**: 
  - 111の政府統計データを提供
  - XML, JSON, CSV形式対応
  - 登録必要（無料）
  - 人口統計、経済センサス、消費者物価指数等のデータ提供

### 2. data.go.jp（e-Govデータポータル）
- **URL**: https://data.e-gov.go.jp/
- **特徴**: 中央政府のオープンデータ統合ポータル

### 3. その他の主要な政府オープンデータAPI

#### 国土交通省関連
- **国土数値情報ダウンロードサービス**: 地理空間情報
- **PLATEAU**: 3D都市モデルデータ
- **海しるAPI**: 海洋情報データ

#### その他省庁
- **J-SHIS（地震ハザードステーション）**: 地震動予測データ
- **交通事故統計情報**: 警察庁提供
- **訪日外客数データ**: 日本政府観光局

### 4. 地方自治体のオープンデータAPI
各都道府県・市町村が独自にオープンデータポータルを運営
（山口県のように登録不要で利用できるものも多い）

## 4. 推奨される移行戦略

### RESAS APIからの移行
1. **e-Stat API**: 人口・経済統計データの主要な代替先
2. **各省庁の個別API**: 特定分野のデータが必要な場合
3. **地方自治体のオープンデータAPI**: 地域特化型データが必要な場合

### API選定のポイント
- 必要なデータの種類と更新頻度
- 認証の有無と利用制限
- データ形式とAPIの使いやすさ
- ライセンス条件

## 5. 実装例

### Yamaguchi API 使用例（Python）
```python
import requests
import json

# データセット一覧取得
url = "https://yamaguchi-opendata.jp/ckan/api/3/action/package_list"
params = {"limit": 5}
response = requests.get(url, params=params)
data = response.json()

# 人口データ検索
search_url = "https://yamaguchi-opendata.jp/ckan/api/3/action/package_search"
search_params = {"q": "人口"}
search_response = requests.get(search_url, params=search_params)
search_data = search_response.json()
```

### e-Stat API 使用例（要登録）
```python
# e-Stat APIは登録後に発行されるappIdが必要
url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList"
params = {
    "appId": "YOUR_APP_ID",
    "searchWord": "人口"
}
response = requests.get(url, params=params)
```

## まとめ
- Yamaguchi Open Data Portal APIは登録不要で即座に利用可能
- RESAS API終了後はe-Stat APIが主要な代替手段
- 用途に応じて複数のAPIを組み合わせることが推奨される
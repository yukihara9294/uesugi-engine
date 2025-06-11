# ODPT API データ取得状況確認結果

## 実施日時
2025年6月11日

## 確認結果サマリー

### 1. APIキー・接続状況
- ✅ APIキーは正常に設定されている
- ✅ API接続は成功（ステータス200）
- ✅ エンドポイントは正常に応答

### 2. 利用可能な事業者データ
ODPT APIには42事業者が登録されていますが、**すべて関東圏の事業者のみ**です。

#### 登録されている主な事業者：
- 鉄道：東京メトロ、JR東日本、京王、小田急、東急、西武、東武など
- バス：京王バス、小田急バス、東急バス、西武バスなど
- 航空：ANA、JAL、ADO、SFJなど

### 3. 広島・山口エリアのデータ提供状況

#### 広島県
試みた事業者と結果：
- ❌ JR西日本 (odpt.Operator:JR-West) - データなし
- ❌ 広島電鉄 (odpt.Operator:Hiroshima) - データなし
- ❌ 広島高速交通 (odpt.Operator:HiroshimaRapidTransit) - データなし
- ❌ 広島バス (odpt.Operator:HiroshimaBus) - データなし
- ❌ 広島電鉄バス (odpt.Operator:HiroshimaElectricRailway) - データなし
- ❌ 芸陽バス (odpt.Operator:GeiyoBus) - データなし
- ❌ 中国JRバス (odpt.Operator:ChugokuJRBus) - データなし

#### 山口県
試みた事業者と結果：
- ❌ JR西日本 (odpt.Operator:JR-West) - データなし
- ❌ 防府バス (odpt.Operator:BoufuBus) - データなし
- ❌ 宇部市営バス (odpt.Operator:UbeCityBus) - データなし
- ❌ 中国JRバス (odpt.Operator:ChugokuJRBus) - データなし

## 結論

**ODPT APIは関東圏の公共交通データのみを提供しており、広島・山口エリアのデータは含まれていません。**

## 代替データソースの提案

広島・山口エリアの公共交通データについては、以下の代替手段を検討する必要があります：

1. **GTFSデータの活用**
   - 広島電鉄のGTFSデータ（既に収集済み）
   - 各自治体が提供するGTFSデータ

2. **地域オープンデータポータル**
   - 広島県オープンデータカタログ
   - 山口県オープンデータカタログ
   - 各市町村のオープンデータ

3. **事業者直接提供データ**
   - JR西日本の公式サイト
   - 各バス事業者の時刻表データ

4. **国土交通省関連データ**
   - 国土数値情報
   - 公共交通オープンデータセンター（地域版）

## 技術的詳細

### APIリクエスト例
```
URL: https://api.odpt.org/api/v4/odpt:Railway
パラメータ: {
  'odpt:operator': 'odpt.Operator:JR-West',
  'acl:consumerKey': 'YOUR_API_KEY'
}
結果: [] (0件)
```

### ディレクトリ構造
```
/app/data/uesugi-engine-data/
├── hiroshima/
│   └── transport/
│       ├── bus/
│       │   └── odpt/ (空)
│       └── railway/
│           └── odpt/ (空)
└── yamaguchi/
    └── transport/
        ├── bus/
        │   └── odpt/ (空)
        └── railway/
            └── odpt/ (空)
```
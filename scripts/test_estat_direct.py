#!/usr/bin/env python3
"""
e-Stat API直接テスト
"""
import requests
import json

# APIキー
API_KEY = "c11c2e7910b7810c15770f829b52bb1a75d283ed"

print("e-Stat API 直接テスト")
print("="*60)

# 1. 統計表一覧取得（最もシンプルなテスト）
print("\n1. API接続テスト（統計表一覧取得）")
url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList"
params = {
    "appId": API_KEY,
    "lang": "J",
    "limit": 1
}

response = requests.get(url, params=params)
print(f"ステータスコード: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, ensure_ascii=False, indent=2))
    
    # レスポンス構造を確認
    if "GET_STATS_LIST" in data:
        result = data["GET_STATS_LIST"]["RESULT"]
        print(f"\nAPIステータス: {result['STATUS']}")
        if result['STATUS'] != 0:
            print(f"エラーメッセージ: {result.get('ERROR_MSG', 'Unknown error')}")
            
# 2. 特定の統計を検索
print("\n2. 人口統計を検索")
params = {
    "appId": API_KEY,
    "lang": "J",
    "searchWord": "人口",
    "statsCode": "00200521",  # 国勢調査
    "limit": 3
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    
    if "GET_STATS_LIST" in data:
        stat_list = data["GET_STATS_LIST"]
        if "DATALIST_INF" in stat_list:
            print("統計表が見つかりました！")
            list_inf = stat_list["DATALIST_INF"].get("LIST_INF")
            
            if list_inf:
                # 単一結果の場合は辞書、複数の場合はリスト
                if isinstance(list_inf, dict):
                    list_inf = [list_inf]
                    
                for i, stat in enumerate(list_inf):
                    print(f"\n統計表 {i+1}:")
                    print(f"  ID: {stat.get('@id', '')}")
                    print(f"  統計名: {stat.get('STAT_NAME', {}).get('$', '')}")
                    print(f"  タイトル: {stat.get('TITLE', {}).get('$', '')}")
                    print(f"  調査年月: {stat.get('SURVEY_DATE', '')}")
                    
# 3. 観光統計を検索  
print("\n3. 観光・宿泊統計を検索")
params = {
    "appId": API_KEY,
    "lang": "J",
    "statsCode": "00601",  # 経済センサス
    "searchWord": "宿泊",
    "limit": 3
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    
    if "GET_STATS_LIST" in data:
        stat_list = data["GET_STATS_LIST"]
        total = stat_list.get("DATALIST_INF", {}).get("NUMBER", 0)
        print(f"検索結果: {total}件")
        
# 4. 具体的な統計データを取得
print("\n4. 人口推計データを取得（2023年）")
stats_data_url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"
params = {
    "appId": API_KEY,
    "lang": "J",
    "statsDataId": "0003448265",  # 人口推計-2023年10月1日現在
    "metaGetFlg": "Y",
    "cntGetFlg": "N",
    "limit": 10
}

response = requests.get(stats_data_url, params=params)
if response.status_code == 200:
    data = response.json()
    
    if "GET_STATS_DATA" in data:
        stats_data = data["GET_STATS_DATA"]
        
        if "STATISTICAL_DATA" in stats_data:
            stat_data = stats_data["STATISTICAL_DATA"]
            
            # データ値を表示
            values = stat_data.get("DATA_INF", {}).get("VALUE", [])
            if isinstance(values, dict):
                values = [values]
                
            print("\n取得したデータ（最初の5件）:")
            for i, val in enumerate(values[:5]):
                if isinstance(val, dict):
                    print(f"  値: {val.get('$', '')} {val.get('@unit', '')}")
                    print(f"  時間: {val.get('@time', '')}")
                    print(f"  地域: {val.get('@area', '')}")
                    print(f"  カテゴリ: {val.get('@cat01', '')}")
                    print("-" * 30)
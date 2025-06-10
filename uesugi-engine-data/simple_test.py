#!/usr/bin/env python3
"""
簡易テスト - Open-Meteo APIの動作確認
"""
import requests
import json
from datetime import datetime

print("=== Open-Meteo API テスト ===\n")

# 広島市の座標
lat = 34.3853
lng = 132.4553

# APIリクエスト
url = "https://api.open-meteo.com/v1/forecast"
params = {
    "latitude": lat,
    "longitude": lng,
    "current": "temperature_2m,relative_humidity_2m,precipitation",
    "timezone": "Asia/Tokyo"
}

print(f"リクエストURL: {url}")
print(f"パラメータ: {json.dumps(params, indent=2)}\n")

try:
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    print("✓ APIリクエスト成功！\n")
    print("現在の広島市の天気:")
    print(f"- 気温: {data['current']['temperature_2m']}°C")
    print(f"- 湿度: {data['current']['relative_humidity_2m']}%")
    print(f"- 降水量: {data['current']['precipitation']}mm")
    print(f"- 観測時刻: {data['current']['time']}")
    
    # 統一フォーマットに変換
    formatted_data = {
        "data_layer": "environment",
        "source": "Open-Meteo",
        "timestamp": datetime.now().isoformat(),
        "location": {
            "city": "広島市",
            "prefecture": "広島県",
            "lat": lat,
            "lng": lng
        },
        "data": {
            "type": "current",
            "temperature": data['current']['temperature_2m'],
            "humidity": data['current']['relative_humidity_2m'],
            "precipitation": data['current']['precipitation'],
            "observation_time": data['current']['time']
        }
    }
    
    # ファイルに保存
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"weather_hiroshima_{timestamp}.json"
    
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(formatted_data, f, ensure_ascii=False, indent=2)
        
    print(f"\n✓ データを {filename} に保存しました")
    
except Exception as e:
    print(f"✗ エラー: {e}")

print("\n=== テスト完了 ===")
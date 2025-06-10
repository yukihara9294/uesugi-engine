#!/usr/bin/env python3
"""
オープンデータ収集のテストスクリプト
APIキーなしでも動作するデータソースをテスト
"""
import sys
sys.path.append('../src/backend/app')

from data_collectors.weather_collector import WeatherCollector
from data_collectors.event_collector import EventCollector
import json
from datetime import datetime

print("=== Uesugi Engine オープンデータ収集テスト ===\n")

# 1. 気象データ収集テスト（Open-Meteoは無料でAPIキー不要）
print("1. 気象データ収集テスト")
print("-" * 40)
weather = WeatherCollector()

# 広島市の天気を取得
city = "広島市"
print(f"{city}の気象データを取得中...")
weather_data = weather.fetch_current_weather(city)

if weather_data:
    print(f"✓ 取得成功")
    print(f"  気温: {weather_data['data']['current']['temperature']}°C")
    print(f"  湿度: {weather_data['data']['current']['humidity']}%")
    print(f"  降水量: {weather_data['data']['current']['precipitation']}mm")
else:
    print("✗ 取得失敗")

# 2. 観光地データテスト（ハードコードされたデータ）
print("\n2. 観光地データテスト")
print("-" * 40)
event_collector = EventCollector()

prefecture = "広島県"
print(f"{prefecture}の観光地データを取得中...")
spots = event_collector.fetch_tourist_spots(prefecture)

if spots:
    print(f"✓ {len(spots)}件の観光地データを取得")
    for spot in spots[:3]:  # 最初の3件を表示
        print(f"  - {spot['name']} ({spot['category']})")
        print(f"    年間来場者数: {spot['annual_visitors']:,}人")
else:
    print("✗ 取得失敗")

# 3. データ保存形式の確認
print("\n3. 統一データフォーマット例")
print("-" * 40)
sample_format = {
    "data_layer": "environment",
    "source": "Open-Meteo",
    "timestamp": datetime.now().isoformat(),
    "location": {
        "city": "広島市",
        "prefecture": "広島県",
        "lat": 34.3853,
        "lng": 132.4553
    },
    "data": {
        "type": "forecast",
        "current": {
            "temperature": 15.2,
            "humidity": 65
        }
    }
}

print(json.dumps(sample_format, ensure_ascii=False, indent=2))

print("\n=== テスト完了 ===")
print("\n次のステップ:")
print("1. .envファイルにAPIキーを設定")
print("2. python main_collector.py で全データ収集を実行")
print("3. uesugi-engine-data/raw/ フォルダに収集データが保存されます")
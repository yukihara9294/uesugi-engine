#!/usr/bin/env python3
"""
収集したオープンデータをPostgreSQLに統合（シンプル版）
"""
import json
import psycopg2
from datetime import datetime
from pathlib import Path


def integrate_weather_data():
    """気象データをデータベースに統合"""
    print("=== 気象データ統合 ===")
    
    # 最新の収集結果を読み込み
    results_dir = Path("uesugi-engine-data/collection_results")
    json_files = list(results_dir.glob("free_data_*.json"))
    if not json_files:
        print("収集結果が見つかりません")
        return
        
    latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
    print(f"読み込みファイル: {latest_file}")
    
    with open(latest_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # データベース接続
    conn = psycopg2.connect(
        host='localhost',
        port=5432,
        database='uesugi_heatmap',
        user='postgres',
        password='postgres'
    )
    cur = conn.cursor()
    
    try:
        # テーブル作成
        cur.execute('''
            CREATE TABLE IF NOT EXISTS realtime_weather (
                id SERIAL PRIMARY KEY,
                city VARCHAR(100),
                prefecture VARCHAR(50),
                lat FLOAT,
                lng FLOAT,
                temperature FLOAT,
                humidity INTEGER,
                precipitation FLOAT,
                weather_code INTEGER,
                wind_speed FLOAT,
                observation_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 都市座標
        city_info = {
            "広島市": {"lat": 34.3853, "lng": 132.4553, "pref": "広島県"},
            "山口市": {"lat": 34.1859, "lng": 131.4705, "pref": "山口県"},
            "福岡市": {"lat": 33.5904, "lng": 130.4017, "pref": "福岡県"},
            "大阪市": {"lat": 34.6937, "lng": 135.5023, "pref": "大阪府"},
            "東京都": {"lat": 35.6762, "lng": 139.6503, "pref": "東京都"}
        }
        
        # 気象データを挿入
        weather_data = data.get('weather', {})
        for city_name, city_data in weather_data.items():
            if city_data.get('status') == 'success':
                current = city_data.get('current', {})
                info = city_info.get(city_name, {})
                
                cur.execute('''
                    INSERT INTO realtime_weather 
                    (city, prefecture, lat, lng, temperature, humidity, 
                     precipitation, weather_code, wind_speed, observation_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ''', (
                    city_name,
                    info.get('pref', ''),
                    info.get('lat', 0),
                    info.get('lng', 0),
                    current.get('temperature_2m', 0),
                    current.get('relative_humidity_2m', 0),
                    current.get('precipitation', 0),
                    current.get('weather_code', 0),
                    current.get('wind_speed_10m', 0),
                    datetime.now()
                ))
                print(f"✓ {city_name}の気象データを保存")
        
        # 地震データテーブル
        cur.execute('''
            CREATE TABLE IF NOT EXISTS realtime_earthquakes (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR(100),
                magnitude FLOAT,
                depth INTEGER,
                lat FLOAT,
                lng FLOAT,
                place VARCHAR(200),
                event_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 地震データを挿入（最新10件）
        earthquakes = data.get('earthquakes', [])[:10]
        for quake in earthquakes:
            if 'hypocenter' in quake:
                hypo = quake['hypocenter']
                cur.execute('''
                    INSERT INTO realtime_earthquakes
                    (event_id, magnitude, depth, lat, lng, place, event_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                ''', (
                    quake.get('eventId', ''),
                    float(quake.get('magnitude', 0)) if quake.get('magnitude') else 0,
                    hypo.get('depth', 0),
                    hypo.get('latitude', 0),
                    hypo.get('longitude', 0),
                    hypo.get('name', ''),
                    datetime.now()
                ))
        print(f"✓ {len(earthquakes)}件の地震データを保存")
        
        conn.commit()
        print("\n✅ データベース統合完了！")
        
    except Exception as e:
        print(f"エラー: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()


def show_integration_status():
    """統合状況を表示"""
    print("\n=== 統合状況サマリー ===")
    print("✅ 統合済みデータ:")
    print("  - 気象データ（5都市）")
    print("  - 地震データ（最新10件）")
    print("\n📋 メール登録が必要なサービス:")
    print("  - e-Stat（統計データ）")
    print("  - ODPT（交通データ）")
    print("  - 各自治体のオープンデータポータル")
    print("\n詳細は REGISTRATION_REQUIRED_SERVICES.md を確認してください。")


if __name__ == "__main__":
    integrate_weather_data()
    show_integration_status()
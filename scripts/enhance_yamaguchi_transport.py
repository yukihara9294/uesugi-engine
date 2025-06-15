#!/usr/bin/env python3
"""
Enhance Yamaguchi transport data with railway information
"""

import json
import csv
from pathlib import Path

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "uesugi-engine-data" / "yamaguchi" / "transport"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def create_railway_stations():
    """Create railway station data for Yamaguchi prefecture"""
    
    # JR Sanyo Main Line (山陽本線) stations in Yamaguchi
    sanyo_stations = [
        {"name": "岩国駅", "lat": 34.1666, "lon": 132.2194, "line": "山陽本線", "type": "local"},
        {"name": "南岩国駅", "lat": 34.1472, "lon": 132.2072, "line": "山陽本線", "type": "local"},
        {"name": "藤生駅", "lat": 34.1347, "lon": 132.1867, "line": "山陽本線", "type": "local"},
        {"name": "通津駅", "lat": 34.1181, "lon": 132.1625, "line": "山陽本線", "type": "local"},
        {"name": "由宇駅", "lat": 34.0572, "lon": 132.1317, "line": "山陽本線", "type": "local"},
        {"name": "神代駅", "lat": 34.0403, "lon": 132.1111, "line": "山陽本線", "type": "local"},
        {"name": "大畠駅", "lat": 34.0217, "lon": 132.0858, "line": "山陽本線", "type": "local"},
        {"name": "柳井港駅", "lat": 33.9719, "lon": 132.1156, "line": "山陽本線", "type": "local"},
        {"name": "柳井駅", "lat": 33.9639, "lon": 132.1014, "line": "山陽本線", "type": "local"},
        {"name": "田布施駅", "lat": 33.9569, "lon": 132.0375, "line": "山陽本線", "type": "local"},
        {"name": "岩田駅", "lat": 33.9456, "lon": 131.9956, "line": "山陽本線", "type": "local"},
        {"name": "島田駅", "lat": 33.9353, "lon": 131.9472, "line": "山陽本線", "type": "local"},
        {"name": "光駅", "lat": 33.9625, "lon": 131.9428, "line": "山陽本線", "type": "local"},
        {"name": "下松駅", "lat": 34.0156, "lon": 131.8706, "line": "山陽本線", "type": "local"},
        {"name": "櫛ヶ浜駅", "lat": 34.0281, "lon": 131.8453, "line": "山陽本線", "type": "local"},
        {"name": "徳山駅", "lat": 34.0522, "lon": 131.8053, "line": "山陽本線", "type": "local"},
        {"name": "新南陽駅", "lat": 34.0556, "lon": 131.7408, "line": "山陽本線", "type": "local"},
        {"name": "福川駅", "lat": 34.0472, "lon": 131.7089, "line": "山陽本線", "type": "local"},
        {"name": "戸田駅", "lat": 34.0381, "lon": 131.6764, "line": "山陽本線", "type": "local"},
        {"name": "富海駅", "lat": 34.0322, "lon": 131.6422, "line": "山陽本線", "type": "local"},
        {"name": "防府駅", "lat": 34.0517, "lon": 131.5631, "line": "山陽本線", "type": "local"},
        {"name": "大道駅", "lat": 34.0358, "lon": 131.5142, "line": "山陽本線", "type": "local"},
        {"name": "四辻駅", "lat": 34.0236, "lon": 131.4731, "line": "山陽本線", "type": "local"},
        {"name": "新山口駅", "lat": 34.0004, "lon": 131.3996, "line": "山陽本線", "type": "local"},
    ]
    
    # Sanyo Shinkansen (山陽新幹線) stations in Yamaguchi
    shinkansen_stations = [
        {"name": "新岩国駅", "lat": 34.1494, "lon": 132.1992, "line": "山陽新幹線", "type": "shinkansen"},
        {"name": "徳山駅", "lat": 34.0522, "lon": 131.8053, "line": "山陽新幹線", "type": "shinkansen"},
        {"name": "新山口駅", "lat": 34.0004, "lon": 131.3996, "line": "山陽新幹線", "type": "shinkansen"},
    ]
    
    # JR Sanin Main Line (山陰本線) stations in Yamaguchi
    sanin_stations = [
        {"name": "小串駅", "lat": 34.1953, "lon": 130.9761, "line": "山陰本線", "type": "local"},
        {"name": "川棚温泉駅", "lat": 34.1444, "lon": 130.9233, "line": "山陰本線", "type": "local"},
        {"name": "黒井村駅", "lat": 34.1133, "lon": 130.8994, "line": "山陰本線", "type": "local"},
        {"name": "梅ヶ峠駅", "lat": 34.0764, "lon": 130.8711, "line": "山陰本線", "type": "local"},
        {"name": "吉見駅", "lat": 34.0572, "lon": 130.8483, "line": "山陰本線", "type": "local"},
        {"name": "福江駅", "lat": 34.0267, "lon": 130.8222, "line": "山陰本線", "type": "local"},
        {"name": "安岡駅", "lat": 34.0069, "lon": 130.8803, "line": "山陰本線", "type": "local"},
        {"name": "梶栗郷台地駅", "lat": 34.0131, "lon": 130.9303, "line": "山陰本線", "type": "local"},
        {"name": "綾羅木駅", "lat": 34.0061, "lon": 130.9186, "line": "山陰本線", "type": "local"},
        {"name": "幡生駅", "lat": 33.9847, "lon": 130.9356, "line": "山陰本線", "type": "local"},
        {"name": "下関駅", "lat": 33.9500, "lon": 130.9239, "line": "山陰本線", "type": "local"},
        {"name": "長門市駅", "lat": 34.3733, "lon": 131.1822, "line": "山陰本線", "type": "local"},
        {"name": "仙崎駅", "lat": 34.3892, "lon": 131.1889, "line": "山陰本線", "type": "local"},
        {"name": "萩駅", "lat": 34.4083, "lon": 131.3989, "line": "山陰本線", "type": "local"},
        {"name": "東萩駅", "lat": 34.4203, "lon": 131.4147, "line": "山陰本線", "type": "local"},
    ]
    
    # JR Ube Line (宇部線) stations
    ube_stations = [
        {"name": "新山口駅", "lat": 34.0004, "lon": 131.3996, "line": "宇部線", "type": "local"},
        {"name": "上嘉川駅", "lat": 33.9906, "lon": 131.3761, "line": "宇部線", "type": "local"},
        {"name": "深溝駅", "lat": 33.9844, "lon": 131.3536, "line": "宇部線", "type": "local"},
        {"name": "周防佐山駅", "lat": 33.9817, "lon": 131.3181, "line": "宇部線", "type": "local"},
        {"name": "岩鼻駅", "lat": 33.9758, "lon": 131.2978, "line": "宇部線", "type": "local"},
        {"name": "阿知須駅", "lat": 33.9703, "lon": 131.2744, "line": "宇部線", "type": "local"},
        {"name": "床波駅", "lat": 33.9583, "lon": 131.2239, "line": "宇部線", "type": "local"},
        {"name": "常盤駅", "lat": 33.9561, "lon": 131.1822, "line": "宇部線", "type": "local"},
        {"name": "草江駅", "lat": 33.9517, "lon": 131.1656, "line": "宇部線", "type": "local"},
        {"name": "宇部新川駅", "lat": 33.9531, "lon": 131.2517, "line": "宇部線", "type": "local"},
    ]
    
    # All stations combined
    all_stations = sanyo_stations + shinkansen_stations + sanin_stations + ube_stations
    
    # Create GeoJSON
    features = []
    for station in all_stations:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [station["lon"], station["lat"]]
            },
            "properties": {
                "name": station["name"],
                "line": station["line"],
                "type": station["type"],
                "transport_type": "rail" if station["type"] == "local" else "shinkansen"
            }
        })
    
    # Save as GeoJSON
    geojson_data = {
        "type": "FeatureCollection",
        "features": features
    }
    
    output_file = OUTPUT_DIR / "yamaguchi_railway_stations.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f, ensure_ascii=False, indent=2)
    
    print(f"Created railway station data: {output_file}")
    print(f"Total stations: {len(features)}")
    print(f"- Local trains: {len([s for s in all_stations if s['type'] == 'local'])}")
    print(f"- Shinkansen: {len([s for s in all_stations if s['type'] == 'shinkansen'])}")
    
    # Also create routes data
    routes = [
        {
            "name": "山陽新幹線",
            "type": "shinkansen",
            "color": "#FFD700",  # Gold for Shinkansen
            "stations": ["新岩国駅", "徳山駅", "新山口駅"]
        },
        {
            "name": "山陽本線",
            "type": "local",
            "color": "#FF4500",  # Orange red for JR West
            "stations": [s["name"] for s in sanyo_stations]
        },
        {
            "name": "山陰本線",
            "type": "local", 
            "color": "#FF4500",  # Orange red for JR West
            "stations": [s["name"] for s in sanin_stations]
        },
        {
            "name": "宇部線",
            "type": "local",
            "color": "#FF4500",  # Orange red for JR West
            "stations": [s["name"] for s in ube_stations]
        }
    ]
    
    routes_file = OUTPUT_DIR / "yamaguchi_railway_routes.json"
    with open(routes_file, 'w', encoding='utf-8') as f:
        json.dump(routes, f, ensure_ascii=False, indent=2)
    
    print(f"Created railway routes data: {routes_file}")

if __name__ == "__main__":
    create_railway_stations()
"""
実データAPIエンドポイント
広島GTFS、山口県オープンデータなどの実データを提供
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
import json
import os
from pathlib import Path
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()

# データディレクトリ
import os
if os.path.exists("/app/uesugi-engine-data"):
    DATA_DIR = Path("/app/uesugi-engine-data")
else:
    # Development environment path
    DATA_DIR = Path("/home/yukihara9294/projects/uesugi-engine/uesugi-engine-data")
GTFS_DIR = DATA_DIR / "hiroshima" / "transport" / "bus" / "gtfs_extracted"
YAMAGUCHI_DIR = DATA_DIR / "yamaguchi"

@router.get("/transport/gtfs/hiroshima")
async def get_hiroshima_gtfs_data(db: Session = Depends(get_db)):
    """広島電鉄GTFSデータを取得"""
    try:
        # GTFSデータから停留所情報を読み込み
        stops_file = GTFS_DIR / "stops.txt"
        routes_file = GTFS_DIR / "routes.txt"
        
        if not stops_file.exists():
            # DBから取得を試みる
            from sqlalchemy import text
            result = db.execute(text("""
                SELECT stop_id, stop_name, stop_lat, stop_lon, stop_code
                FROM gtfs_stops
                WHERE agency_id = 'hiroden'
                LIMIT 500
            """))
            
            features = []
            for row in result:
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(row.stop_lon), float(row.stop_lat)]
                    },
                    "properties": {
                        "stop_id": row.stop_id,
                        "stop_name": row.stop_name,
                        "stop_code": row.stop_code,
                        "type": "tram_stop",
                        "color": "#FF6B6B"
                    }
                })
            
            return {
                "type": "FeatureCollection",
                "features": features
            }
        
        # ファイルから読み込み（BOM対応）
        features = []
        with open(stops_file, 'r', encoding='utf-8-sig') as f:
            lines = f.readlines()
            headers = lines[0].strip().split(',')
            
            for line in lines[1:]:
                data = line.strip().split(',')
                if len(data) >= 6 and data[4] and data[5]:  # stop_lat, stop_lon が存在
                    try:
                        lat = float(data[4])
                        lon = float(data[5])
                        features.append({
                            "type": "Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [lon, lat]
                            },
                            "properties": {
                                "stop_id": data[0],
                                "stop_name": data[2] if data[2] else "停留所",
                                "stop_code": data[1] if data[1] else "",
                                "type": "tram_stop",
                                "color": "#FF6B6B"
                            }
                        })
                    except ValueError:
                        # 無効な座標データはスキップ
                        continue
        
        return {
            "type": "FeatureCollection",
            "features": features[:200]  # 最初の200停留所
        }
        
    except Exception as e:
        print(f"GTFS data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transport/gtfs/yamaguchi")
async def get_yamaguchi_gtfs_data(db: Session = Depends(get_db)):
    """山口県公共交通データを取得（バス・鉄道）"""
    try:
        all_features = []
        all_routes = []
        
        # ログ: 利用可能なデータソースを記録
        print("=== 山口県交通データ読み込み開始 ===")
        
        # 1. バスデータ（GTFS）の読み込み
        yamaguchi_gtfs_dirs = [
            YAMAGUCHI_DIR / "transport" / "352080_gtfs-jp",  # 岩国市
            YAMAGUCHI_DIR / "transport" / "hikari_GTFS_20250401_"  # 光市
        ]
        
        total_bus_stop_count = 0
        total_bus_route_count = 0
        
        for gtfs_dir in yamaguchi_gtfs_dirs:
            if not gtfs_dir.exists():
                print(f"警告: GTFSディレクトリが存在しません: {gtfs_dir}")
                continue
                
            print(f"GTFSデータ読み込み: {gtfs_dir.name}")
            
            # 停留所データの読み込み
            stops_file = gtfs_dir / "stops.txt"
            if stops_file.exists():
                stop_count = 0
                with open(stops_file, 'r', encoding='utf-8-sig') as f:
                    lines = f.readlines()
                    headers = lines[0].strip().split(',')
                    
                    for line in lines[1:]:
                        data = line.strip().split(',')
                        if len(data) >= 6 and data[4] and data[5]:  # stop_lat, stop_lon
                            try:
                                lat = float(data[4])
                                lon = float(data[5])
                                all_features.append({
                                    "type": "Feature",
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [lon, lat]
                                    },
                                    "properties": {
                                        "stop_id": data[0],
                                        "stop_name": data[2] if data[2] else "バス停",
                                        "stop_code": data[1] if data[1] else "",
                                        "type": "bus_stop",
                                        "transport_type": "bus",
                                        "color": "#3B82F6",  # Blue for bus
                                        "source": gtfs_dir.name
                                    }
                                })
                                stop_count += 1
                            except ValueError:
                                continue
                print(f"  - {stop_count}個のバス停を読み込みました")
                total_bus_stop_count += stop_count
            
            # 実際のGTFS shapes.txtからルート形状を読み込み
            shapes_file = gtfs_dir / "shapes.txt"
            routes_file = gtfs_dir / "routes.txt"
            
            if shapes_file.exists() and routes_file.exists():
                print(f"  - shapes.txtからルート形状を読み込み中...")
                
                # まずroutes.txtを読んでルート情報を取得
                route_info = {}
                with open(routes_file, 'r', encoding='utf-8-sig') as f:
                    lines = f.readlines()
                    if len(lines) > 1:
                        headers = lines[0].strip().split(',')
                        route_id_idx = headers.index('route_id') if 'route_id' in headers else 0
                        route_name_idx = headers.index('route_short_name') if 'route_short_name' in headers else 2
                        route_type_idx = headers.index('route_type') if 'route_type' in headers else 4
                        
                        for line in lines[1:]:
                            data = line.strip().split(',')
                            if len(data) > max(route_id_idx, route_name_idx, route_type_idx):
                                route_id = data[route_id_idx]
                                route_info[route_id] = {
                                    'name': data[route_name_idx] if data[route_name_idx] else route_id,
                                    'type': int(data[route_type_idx]) if data[route_type_idx].isdigit() else 3
                                }
                
                # shapes.txtを読んでルート形状を構築
                shape_points = {}
                with open(shapes_file, 'r', encoding='utf-8-sig') as f:
                    lines = f.readlines()
                    if len(lines) > 1:
                        headers = lines[0].strip().split(',')
                        shape_id_idx = headers.index('shape_id') if 'shape_id' in headers else 0
                        lat_idx = headers.index('shape_pt_lat') if 'shape_pt_lat' in headers else 1
                        lon_idx = headers.index('shape_pt_lon') if 'shape_pt_lon' in headers else 2
                        seq_idx = headers.index('shape_pt_sequence') if 'shape_pt_sequence' in headers else 3
                        
                        for line in lines[1:]:
                            data = line.strip().split(',')
                            if len(data) > max(shape_id_idx, lat_idx, lon_idx, seq_idx):
                                shape_id = data[shape_id_idx]
                                try:
                                    lat = float(data[lat_idx])
                                    lon = float(data[lon_idx])
                                    seq = int(data[seq_idx])
                                    
                                    if shape_id not in shape_points:
                                        shape_points[shape_id] = []
                                    shape_points[shape_id].append((seq, [lon, lat]))
                                except ValueError:
                                    continue
                
                # ルート形状を作成
                route_count = 0
                for shape_id, points in shape_points.items():
                    if len(points) >= 2:
                        # シーケンス番号でソート
                        points.sort(key=lambda x: x[0])
                        coordinates = [p[1] for p in points]
                        
                        # 対応するルート情報を探す
                        route_name = shape_id
                        route_type = 3  # デフォルトはバス
                        for route_id, info in route_info.items():
                            if route_id in shape_id or shape_id in route_id:
                                route_name = info['name']
                                route_type = info['type']
                                break
                        
                        all_routes.append({
                            "type": "Feature",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": coordinates
                            },
                            "properties": {
                                "route_id": shape_id,
                                "route_name": route_name,
                                "route_type": route_type,
                                "transport_type": "bus",
                                "color": "#3B82F6",
                                "source": gtfs_dir.name
                            }
                        })
                        route_count += 1
                
                print(f"  - {route_count}個のバスルートを読み込みました")
                total_bus_route_count += route_count
            else:
                print(f"  - shapes.txtが見つかりません。ルート形状データなし")
        
        # 2. 鉄道データの読み込み（駅のみ、ルートは作成しない）
        railway_station_count = 0
        railway_file = YAMAGUCHI_DIR / "transport" / "yamaguchi_railway_stations.json"
        if railway_file.exists():
            print(f"鉄道駅データ読み込み: {railway_file.name}")
            with open(railway_file, 'r', encoding='utf-8') as f:
                railway_data = json.load(f)
                for feature in railway_data.get("features", []):
                    props = feature["properties"]
                    # 新幹線と在来線で色分け
                    if props.get("transport_type") == "shinkansen":
                        color = "#FFD700"  # Gold for Shinkansen
                    else:
                        color = "#FF4500"  # Orange red for local trains
                    
                    all_features.append({
                        "type": "Feature",
                        "geometry": feature["geometry"],
                        "properties": {
                            "stop_id": f"rail_{props['name']}",
                            "stop_name": props["name"],
                            "line": props["line"],
                            "type": "station",
                            "transport_type": props["transport_type"],
                            "color": color,
                            "source": "yamaguchi_railway_stations.json"
                        }
                    })
                    railway_station_count += 1
            print(f"  - {railway_station_count}個の鉄道駅を読み込みました")
        
        # 3. 鉄道路線データは正確なジオメトリがないため読み込まない
        print("注意: 鉄道路線の正確なジオメトリデータがないため、路線は表示されません")
        
        # 4. サマリー情報
        print(f"\n=== データ読み込み完了 ===")
        print(f"合計バス停数: {total_bus_stop_count}")
        print(f"合計バスルート数: {total_bus_route_count}")
        print(f"合計鉄道駅数: {railway_station_count}")
        print(f"合計地物数: {len(all_features)}")
        print(f"合計ルート数: {len(all_routes)}")
        
        return {
            "type": "FeatureCollection",
            "features": all_features[:500],  # 最大500停留所/駅
            "routes": all_routes,
            "metadata": {
                "bus_stops": total_bus_stop_count,
                "bus_routes": total_bus_route_count,
                "railway_stations": railway_station_count,
                "total_features": len(all_features),
                "total_routes": len(all_routes),
                "data_sources": [
                    "岩国市GTFS (352080_gtfs-jp)",
                    "光市GTFS (hikari_GTFS_20250401_)",
                    "山口県鉄道駅データ (yamaguchi_railway_stations.json)"
                ],
                "note": "鉄道路線は正確なジオメトリデータがないため表示されません"
            }
        }
        
    except Exception as e:
        print(f"Yamaguchi transport data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tourism/facilities/yamaguchi")
async def get_yamaguchi_tourism_data(db: Session = Depends(get_db)):
    """山口県観光施設データを取得"""
    try:
        # DBから観光施設を取得
        result = db.execute("""
            SELECT name, category, address, latitude, longitude, city
            FROM yamaguchi_tourism_facilities
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL
            LIMIT 100
        """)
        
        features = []
        for row in result:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(row.longitude), float(row.latitude)]
                },
                "properties": {
                    "name": row.name,
                    "category": row.category,
                    "address": row.address,
                    "city": row.city
                }
            })
        
        if not features:
            # サンプルデータ
            features = [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [131.4705, 34.1858]},
                    "properties": {"name": "瑠璃光寺", "category": "寺社"}
                },
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [130.9239, 33.9507]},
                    "properties": {"name": "海響館", "category": "水族館"}
                }
            ]
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
        
    except Exception as e:
        print(f"Tourism data error: {e}")
        return {"type": "FeatureCollection", "features": []}

@router.get("/accommodation/real/{prefecture}")
async def get_real_accommodation_data(prefecture: str, db: Session = Depends(get_db)):
    """実際の宿泊施設データを取得"""
    try:
        # 都道府県別の主要宿泊施設
        accommodation_data = {
            "広島県": [
                {"name": "グランドプリンスホテル広島", "lat": 34.3688, "lon": 132.4133, "capacity": 510},
                {"name": "ホテルグランヴィア広島", "lat": 34.3974, "lon": 132.4753, "capacity": 407},
                {"name": "シェラトングランドホテル広島", "lat": 34.3976, "lon": 132.4759, "capacity": 238},
                {"name": "リーガロイヤルホテル広島", "lat": 34.3954, "lon": 132.4534, "capacity": 491},
                {"name": "ANAクラウンプラザホテル広島", "lat": 34.3936, "lon": 132.4572, "capacity": 409},
                {"name": "クレイトンベイホテル", "lat": 34.2415, "lon": 132.5552, "capacity": 280},
                {"name": "福山ニューキャッスルホテル", "lat": 34.4900, "lon": 133.3627, "capacity": 325},
                {"name": "君田温泉森の泉", "lat": 34.8522, "lon": 132.8556, "capacity": 50}
            ],
            "山口県": [
                # 下関市 (Shimonoseki)
                {"name": "下関グランドホテル", "lat": 33.9507, "lon": 130.9239, "capacity": 188},
                {"name": "ドーミーインPREMIUM下関", "lat": 33.9523, "lon": 130.9251, "capacity": 146},
                {"name": "東京第一ホテル下関", "lat": 33.9485, "lon": 130.9234, "capacity": 162},
                {"name": "ヴィアイン下関", "lat": 33.9498, "lon": 130.9242, "capacity": 120},
                {"name": "プラザホテル下関", "lat": 33.9575, "lon": 130.9412, "capacity": 95},
                {"name": "川棚グランドホテル", "lat": 34.0189, "lon": 130.9564, "capacity": 110},
                
                # 山口市 (Yamaguchi City)
                {"name": "山口グランドホテル", "lat": 34.1858, "lon": 131.4714, "capacity": 120},
                {"name": "ホテルかめ福", "lat": 34.1858, "lon": 131.4705, "capacity": 80},
                {"name": "松田屋ホテル", "lat": 34.1645, "lon": 131.4580, "capacity": 150},
                {"name": "湯田温泉 西の雅 常盤", "lat": 34.1636, "lon": 131.4583, "capacity": 180},
                {"name": "国際ホテル山口", "lat": 34.1852, "lon": 131.4718, "capacity": 110},
                {"name": "湯田温泉 梅乃屋", "lat": 34.1640, "lon": 131.4585, "capacity": 65},
                {"name": "新山口ターミナルホテル", "lat": 34.0412, "lon": 131.4088, "capacity": 98},
                
                # 宇部市 (Ube)
                {"name": "ANAクラウンプラザホテル宇部", "lat": 33.9518, "lon": 131.2468, "capacity": 140},
                {"name": "国際ホテル宇部", "lat": 33.9530, "lon": 131.2440, "capacity": 102},
                {"name": "宇部72アジススパホテル", "lat": 33.9475, "lon": 131.2515, "capacity": 85},
                {"name": "東横イン新山口駅新幹線口", "lat": 34.0405, "lon": 131.4092, "capacity": 156},
                
                # 岩国市 (Iwakuni)
                {"name": "岩国国際観光ホテル", "lat": 34.1667, "lon": 132.1778, "capacity": 95},
                {"name": "岩国プラザホテル", "lat": 34.1660, "lon": 132.2195, "capacity": 78},
                {"name": "半月庵", "lat": 34.1686, "lon": 132.1790, "capacity": 60},
                {"name": "グリーンリッチホテル岩国駅前", "lat": 34.1658, "lon": 132.2193, "capacity": 135},
                
                # 周南市 (Shunan)
                {"name": "ホテルサンルート徳山", "lat": 34.0520, "lon": 131.8055, "capacity": 142},
                {"name": "東横イン徳山駅新幹線口", "lat": 34.0516, "lon": 131.8052, "capacity": 168},
                {"name": "ビジネスホテルみやこ", "lat": 34.0525, "lon": 131.8060, "capacity": 72},
                
                # 萩市 (Hagi)
                {"name": "萩本陣", "lat": 34.4083, "lon": 131.3989, "capacity": 200},
                {"name": "萩観光ホテル", "lat": 34.4167, "lon": 131.3833, "capacity": 85},
                {"name": "萩の宿 常茂恵", "lat": 34.4090, "lon": 131.3985, "capacity": 120},
                {"name": "北門屋敷", "lat": 34.4170, "lon": 131.3835, "capacity": 75},
                
                # 防府市 (Hofu)
                {"name": "ホテルルートイン防府駅前", "lat": 34.0518, "lon": 131.5635, "capacity": 156},
                {"name": "アパホテル山口防府", "lat": 34.0520, "lon": 131.5640, "capacity": 141},
                
                # 光市 (Hikari)
                {"name": "ホテル松原屋", "lat": 33.9625, "lon": 131.9420, "capacity": 68},
                
                # 長門市 (Nagato)
                {"name": "大谷山荘", "lat": 34.3712, "lon": 131.1830, "capacity": 250},
                {"name": "湯本観光ホテル西京", "lat": 34.3250, "lon": 131.1678, "capacity": 115},
                
                # 美祢市 (Mine)
                {"name": "秋芳ロイヤルホテル秋芳館", "lat": 34.2278, "lon": 131.3056, "capacity": 95}
            ]
        }
        
        hotels = accommodation_data.get(prefecture, [])
        features = []
        
        for hotel in hotels:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [hotel["lon"], hotel["lat"]]
                },
                "properties": {
                    "name": hotel["name"],
                    "capacity": hotel["capacity"],
                    "height": min(100, hotel["capacity"] / 5),
                    "occupancy_rate": 0.75
                }
            })
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
        
    except Exception as e:
        print(f"Accommodation data error: {e}")
        return {"type": "FeatureCollection", "features": []}

@router.get("/mobility/real/{prefecture}")
async def get_real_mobility_data(prefecture: str, city_only: bool = False):
    """実際の人流データ（統計的推定モデルベース）"""
    try:
        from app.services.mobility_estimator import MobilityEstimator
        estimator = MobilityEstimator()
        # 人流データの仕様について相談が必要
        # 現在のAPIは線データのみ返していますが、
        # ダミーデータのようなパーティクル表現を実現するには
        # 以下のようなデータ形式が必要です：
        
        # 1. パーティクルデータ（混雑地点）
        #    - 各地点の位置と混雑度
        #    - リアルタイムで動くパーティクルの表現
        
        # 2. フローデータ（移動経路）
        #    - 起点終点の位置と移動量
        #    - アニメーション付きの光の流れ
        
        # パーティクルアニメーション用のデータ形式に変換
        # 山口県の主要地点
        yamaguchi_points = [
            # 山口市（県庁所在地、人口: 約19万人）
            {"name": "山口駅", "lat": 34.1858, "lon": 131.4714, "population": 20000},
            {"name": "山口市役所", "lat": 34.1859, "lon": 131.4706, "population": 8000},
            {"name": "湯田温泉", "lat": 34.1636, "lon": 131.4583, "population": 15000},
            {"name": "新山口駅", "lat": 34.0411, "lon": 131.4089, "population": 25000},
            {"name": "小郡", "lat": 34.0522, "lon": 131.3919, "population": 12000},
            {"name": "香山公園", "lat": 34.1889, "lon": 131.4767, "population": 5000},
            {"name": "山口大学", "lat": 34.1487, "lon": 131.4720, "population": 10000},
            
            # 下関市（人口: 約25万人）
            {"name": "下関駅", "lat": 33.9507, "lon": 130.9239, "population": 30000},
            {"name": "唐戸市場", "lat": 33.9567, "lon": 130.9417, "population": 12000},
            {"name": "関門トンネル", "lat": 33.9667, "lon": 130.9544, "population": 8000},
            {"name": "門司港", "lat": 33.9514, "lon": 130.9608, "population": 10000},
            {"name": "海響館", "lat": 33.9572, "lon": 130.9408, "population": 10000},
            {"name": "彦島", "lat": 33.9333, "lon": 130.8667, "population": 7000},
            {"name": "新下関駅", "lat": 34.0000, "lon": 130.9944, "population": 20000},
            
            # 宇部市（人口: 約16万人）
            {"name": "宇部新川駅", "lat": 33.9533, "lon": 131.2439, "population": 15000},
            {"name": "宇部市役所", "lat": 33.9517, "lon": 131.2467, "population": 8000},
            {"name": "山口宇部空港", "lat": 33.9300, "lon": 131.2786, "population": 12000},
            {"name": "ときわ公園", "lat": 33.9425, "lon": 131.2833, "population": 8000},
            {"name": "宇部港", "lat": 33.9272, "lon": 131.2531, "population": 5000},
            
            # 周南市（人口: 約14万人）
            {"name": "徳山駅", "lat": 34.0517, "lon": 131.8050, "population": 25000},
            {"name": "周南市役所", "lat": 34.0542, "lon": 131.8064, "population": 8000},
            {"name": "新南陽駅", "lat": 34.0361, "lon": 131.7294, "population": 10000},
            {"name": "櫛ヶ浜駅", "lat": 34.0139, "lon": 131.8206, "population": 8000},
            
            # 岩国市（人口: 約13万人）
            {"name": "岩国駅", "lat": 34.1656, "lon": 132.2192, "population": 20000},
            {"name": "錦帯橋", "lat": 34.1686, "lon": 132.1778, "population": 15000},
            {"name": "岩国空港", "lat": 34.1439, "lon": 132.2356, "population": 10000},
            {"name": "岩国市役所", "lat": 34.1706, "lon": 132.2203, "population": 6000},
            
            # 防府市（人口: 約11万人）
            {"name": "防府駅", "lat": 34.0517, "lon": 131.5631, "population": 18000},
            {"name": "防府天満宮", "lat": 34.0558, "lon": 131.5703, "population": 10000},
            {"name": "防府市役所", "lat": 34.0519, "lon": 131.5636, "population": 6000},
            
            # 萩市（人口: 約4.4万人）
            {"name": "東萩駅", "lat": 34.4086, "lon": 131.3986, "population": 8000},
            {"name": "萩城下町", "lat": 34.4167, "lon": 131.3833, "population": 12000},
            {"name": "萩市役所", "lat": 34.4081, "lon": 131.3989, "population": 4000},
            
            # 光市（人口: 約5万人）
            {"name": "光駅", "lat": 33.9622, "lon": 131.9422, "population": 10000},
            {"name": "光市役所", "lat": 33.9625, "lon": 131.9417, "population": 4000},
            
            # 長門市（人口: 約3.2万人）
            {"name": "長門市駅", "lat": 34.3711, "lon": 131.1828, "population": 6000},
            {"name": "仙崎", "lat": 34.3867, "lon": 131.1950, "population": 4000},
            
            # 柳井市（人口: 約3万人）
            {"name": "柳井駅", "lat": 33.9639, "lon": 132.1014, "population": 8000},
            {"name": "柳井港", "lat": 33.9589, "lon": 132.1092, "population": 3000}
        ]
        
        # 広島県の主要地点（県全域をカバー）
        hiroshima_points = [
            # 広島市中心部（人口: 約120万人）
            {"name": "広島駅", "lat": 34.3974, "lon": 132.4753, "population": 140000},
            {"name": "紙屋町", "lat": 34.3954, "lon": 132.4572, "population": 85000},
            {"name": "八丁堀", "lat": 34.3936, "lon": 132.4636, "population": 75000},
            {"name": "平和記念公園", "lat": 34.3954, "lon": 132.4534, "population": 30000},
            {"name": "本通り", "lat": 34.3934, "lon": 132.4615, "population": 50000},
            {"name": "広島城", "lat": 34.4027, "lon": 132.4590, "population": 5000},
            {"name": "マツダスタジアム", "lat": 34.3933, "lon": 132.4845, "population": 32000},
            {"name": "宇品港", "lat": 34.3488, "lon": 132.4533, "population": 15000},
            {"name": "横川駅", "lat": 34.4107, "lon": 132.4525, "population": 35000},
            {"name": "西広島駅", "lat": 34.3747, "lon": 132.4385, "population": 25000},
            {"name": "広島大学", "lat": 34.4047, "lon": 132.7139, "population": 15000},
            {"name": "広島空港", "lat": 34.4361, "lon": 132.9194, "population": 20000},
            {"name": "広島市役所", "lat": 34.3853, "lon": 132.4553, "population": 10000},
            
            # 広島市各区
            {"name": "安佐南区中心", "lat": 34.4520, "lon": 132.4710, "population": 24000},
            {"name": "安佐北区中心", "lat": 34.5180, "lon": 132.5080, "population": 14000},
            {"name": "佐伯区中心", "lat": 34.3670, "lon": 132.3610, "population": 14000},
            {"name": "安芸区中心", "lat": 34.3580, "lon": 132.5560, "population": 8000},
            {"name": "南区中心", "lat": 34.3800, "lon": 132.4680, "population": 14000},
            {"name": "東区中心", "lat": 34.3960, "lon": 132.4820, "population": 12000},
            {"name": "西区中心", "lat": 34.3940, "lon": 132.4340, "population": 19000},
            
            # 東広島市（人口: 約19万人）
            {"name": "西条駅", "lat": 34.4308, "lon": 132.7425, "population": 30000},
            {"name": "東広島市役所", "lat": 34.4283, "lon": 132.7467, "population": 10000},
            {"name": "広島大学東広島キャンパス", "lat": 34.4018, "lon": 132.7126, "population": 20000},
            {"name": "八本松駅", "lat": 34.4241, "lon": 132.6913, "population": 8000},
            {"name": "高屋駅", "lat": 34.4483, "lon": 132.8061, "population": 5000},
            {"name": "黒瀬", "lat": 34.3686, "lon": 132.6626, "population": 6000},
            {"name": "フジグラン東広島", "lat": 34.4320, "lon": 132.7380, "population": 12000},
            {"name": "ゆめタウン東広島", "lat": 34.4250, "lon": 132.7450, "population": 10000},
            
            # 呉市（人口: 約21万人）
            {"name": "呉駅", "lat": 34.2490, "lon": 132.5556, "population": 30000},
            {"name": "呉市役所", "lat": 34.2381, "lon": 132.5659, "population": 8000},
            {"name": "大和ミュージアム", "lat": 34.2415, "lon": 132.5552, "population": 10000},
            {"name": "広駅", "lat": 34.2430, "lon": 132.5300, "population": 15000},
            {"name": "安浦駅", "lat": 34.2770, "lon": 132.7550, "population": 5000},
            {"name": "音戸", "lat": 34.1830, "lon": 132.5350, "population": 6000},
            {"name": "呉中央商店街", "lat": 34.2480, "lon": 132.5570, "population": 8000},
            {"name": "呉ポートピアパーク", "lat": 34.2520, "lon": 132.5480, "population": 5000},
            
            # 福山市（人口: 約46万人）
            {"name": "福山駅", "lat": 34.4858, "lon": 133.3627, "population": 60000},
            {"name": "福山城", "lat": 34.4900, "lon": 133.3627, "population": 8000},
            {"name": "鞆の浦", "lat": 34.3833, "lon": 133.3883, "population": 5000},
            {"name": "松永駅", "lat": 34.4500, "lon": 133.2550, "population": 15000},
            {"name": "新市駅", "lat": 34.5350, "lon": 133.2880, "population": 8000},
            {"name": "神辺駅", "lat": 34.5430, "lon": 133.3900, "population": 10000},
            {"name": "福山市役所", "lat": 34.4870, "lon": 133.3600, "population": 10000},
            {"name": "福山東IC", "lat": 34.5030, "lon": 133.3950, "population": 5000},
            {"name": "福山駅前商店街", "lat": 34.4880, "lon": 133.3600, "population": 12000},
            
            # 尾道市（人口: 約13万人）
            {"name": "尾道駅", "lat": 34.4090, "lon": 133.1950, "population": 20000},
            {"name": "千光寺", "lat": 34.4097, "lon": 133.1989, "population": 8000},
            {"name": "しまなみ海道（尾道IC）", "lat": 34.4041, "lon": 133.1875, "population": 10000},
            {"name": "向島", "lat": 34.3890, "lon": 133.2150, "population": 6000},
            {"name": "因島", "lat": 34.3100, "lon": 133.1650, "population": 5000},
            {"name": "瀬戸田", "lat": 34.3050, "lon": 133.0870, "population": 3000},
            
            # 三原市（人口: 約9万人）
            {"name": "三原駅", "lat": 34.3988, "lon": 133.0792, "population": 15000},
            {"name": "三原市役所", "lat": 34.3992, "lon": 133.0783, "population": 5000},
            {"name": "本郷駅", "lat": 34.4370, "lon": 132.9890, "population": 8000},
            {"name": "三原港", "lat": 34.3950, "lon": 133.0820, "population": 5000},
            {"name": "須波", "lat": 34.3430, "lon": 133.0250, "population": 3000},
            
            # 廿日市市（人口: 約12万人）
            {"name": "廿日市駅", "lat": 34.3483, "lon": 132.3317, "population": 15000},
            {"name": "宮島口駅", "lat": 34.3139, "lon": 132.3028, "population": 10000},
            {"name": "厳島神社", "lat": 34.2968, "lon": 132.3198, "population": 20000},
            {"name": "大野浦駅", "lat": 34.2870, "lon": 132.2750, "population": 5000},
            {"name": "吉和", "lat": 34.5230, "lon": 132.0790, "population": 1000},
            
            # 三次市（人口: 約5万人、県北部）
            {"name": "三次駅", "lat": 34.8056, "lon": 132.8528, "population": 8000},
            {"name": "三次市役所", "lat": 34.8053, "lon": 132.8522, "population": 3000},
            {"name": "十日市", "lat": 34.7950, "lon": 132.8600, "population": 5000},
            {"name": "君田", "lat": 34.8522, "lon": 132.8556, "population": 1500},
            {"name": "作木", "lat": 34.8430, "lon": 132.7450, "population": 1200},
            
            # 庄原市（人口: 約3.5万人、県北東部）
            {"name": "備後庄原駅", "lat": 34.8572, "lon": 133.0167, "population": 5000},
            {"name": "庄原市役所", "lat": 34.8569, "lon": 133.0169, "population": 2000},
            {"name": "東城", "lat": 34.8890, "lon": 133.2780, "population": 3000},
            {"name": "西城", "lat": 34.9260, "lon": 132.9940, "population": 2000},
            {"name": "高野", "lat": 35.0350, "lon": 132.8560, "population": 1000},
            
            # 大竹市（人口: 約2.7万人）
            {"name": "大竹駅", "lat": 34.2380, "lon": 132.2220, "population": 8000},
            {"name": "玖波駅", "lat": 34.2080, "lon": 132.2000, "population": 5000},
            
            # 竹原市（人口: 約2.5万人）
            {"name": "竹原駅", "lat": 34.3420, "lon": 132.9070, "population": 8000},
            {"name": "忠海駅", "lat": 34.3750, "lon": 132.9680, "population": 3000},
            
            # 江田島市（人口: 約2.3万人）
            {"name": "小用港", "lat": 34.2230, "lon": 132.4710, "population": 3000},
            {"name": "切串港", "lat": 34.1890, "lon": 132.4440, "population": 2000},
            
            # 府中市（人口: 約4万人）
            {"name": "府中駅", "lat": 34.5680, "lon": 133.2370, "population": 5000},
            {"name": "上下駅", "lat": 34.6780, "lon": 133.1820, "population": 2000},
            
            # 安芸高田市（人口: 約2.8万人）
            {"name": "向原駅", "lat": 34.5590, "lon": 132.6850, "population": 3000},
            {"name": "吉田", "lat": 34.6730, "lon": 132.7050, "population": 4000},
            
            # 安芸太田町（人口: 約6千人）
            {"name": "加計", "lat": 34.5890, "lon": 132.3180, "population": 2000},
            {"name": "戸河内IC", "lat": 34.6350, "lon": 132.1780, "population": 1000},
            
            # 北広島町（人口: 約1.8万人）
            {"name": "千代田", "lat": 34.6730, "lon": 132.5510, "population": 3000},
            {"name": "豊平", "lat": 34.6890, "lon": 132.4230, "population": 1500},
            
            # 主要IC・JCT
            {"name": "広島IC", "lat": 34.3847, "lon": 132.4147, "population": 10000},
            {"name": "広島JCT", "lat": 34.3944, "lon": 132.3850, "population": 8000},
            {"name": "福山西IC", "lat": 34.5156, "lon": 133.2775, "population": 5000},
            {"name": "尾道IC", "lat": 34.4550, "lon": 133.1633, "population": 5000},
            {"name": "東広島IC", "lat": 34.3910, "lon": 132.6740, "population": 3000},
            {"name": "高田IC", "lat": 34.6210, "lon": 132.6930, "population": 2000}
        ]
        
        # 統計的推定モデルを使用してリアルなフローを生成
        points = hiroshima_points if prefecture == "広島県" else yamaguchi_points
        
        # OD行列の推定
        estimated_flows = estimator.estimate_od_matrix(points, prefecture)
        
        # 段階的読み込み対応
        if city_only and prefecture == "広島県":
            # 広島市内のフローのみをフィルタリング
            hiroshima_city_keywords = ['広島駅', '紙屋町', '八丁堀', '平和記念', '本通り', '広島城', 
                                     'マツダスタジアム', '宇品', '横川', '西広島', '広島市役所',
                                     '安佐南区', '安佐北区', '佐伯区', '安芸区', '南区', '東区', '西区', '中区',
                                     '広島IC', '広島JCT']
            
            city_flows = []
            for flow in estimated_flows:
                origin_is_city = any(keyword in flow["origin"]["name"] for keyword in hiroshima_city_keywords)
                dest_is_city = any(keyword in flow["destination"]["name"] for keyword in hiroshima_city_keywords)
                if origin_is_city and dest_is_city:
                    city_flows.append(flow)
            
            # 上位の主要フローのみを抽出
            city_flows.sort(key=lambda x: x["volume"], reverse=True)
            major_flows = city_flows[:500]  # 市内は500フローまで
        else:
            # 上位の主要フローのみを抽出（視覚化のため）
            estimated_flows.sort(key=lambda x: x["volume"], reverse=True)
            # 広島県は全フロー表示（最大2000まで）、山口県は300に増加
            major_flows = estimated_flows[:2000] if prefecture == "広島県" else estimated_flows[:300]
        
        mobility_data = {
            prefecture: {
                "flows": major_flows
            }
        }
        
        prefecture_data = mobility_data.get(prefecture, {"flows": []})
        flows = prefecture_data["flows"]
        
        # フローデータをGeoJSON LineString形式に変換
        flow_features = []
        particle_features = []
        
        for flow in flows:
            # フローライン
            flow_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [flow["origin"]["lon"], flow["origin"]["lat"]],
                        [flow["destination"]["lon"], flow["destination"]["lat"]]
                    ]
                },
                "properties": {
                    "intensity": min(100, flow["volume"] / 500),  # 0-100にスケール
                    "volume": flow["volume"],
                    "origin_name": flow["origin"]["name"],
                    "destination_name": flow["destination"]["name"],
                    "flow_type": flow.get("flow_type", flow.get("type", "general"))  # フロータイプ
                }
            })
            
            # リアルなパーティクル生成（統計モデルベース）
            # パーティクル数を適切に設定（パフォーマンスと表示品質のバランス）
            # 距離とフロー量に基づいて調整
            # フロー数が多いので、パーティクル数を調整
            flow_index = flows.index(flow)
            if flow_index < 100:  # 上位100フローは多めに
                base_particles = flow["volume"] // 5000  # 基本パーティクル数を減らす
                num_particles = min(30, max(10, base_particles))  # 10～30個の範囲
            elif flow_index < 500:  # 次の400フローは中程度
                base_particles = flow["volume"] // 10000
                num_particles = min(15, max(5, base_particles))  # 5～15個の範囲
            else:  # それ以降は少なめ
                base_particles = flow["volume"] // 20000
                num_particles = min(10, max(3, base_particles))  # 3～10個の範囲
            realistic_particles = estimator.generate_realistic_particles(flow, num_particles)
            
            for i, particle_data in enumerate(realistic_particles):
                particle_features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [particle_data["lon"], particle_data["lat"]]
                    },
                    "properties": {
                        "size": particle_data["size"],
                        "color": particle_data["color"],
                        "speed": particle_data["speed"],
                        "origin_lon": particle_data["origin_lon"],
                        "origin_lat": particle_data["origin_lat"],
                        "destination_lon": particle_data["dest_lon"],
                        "destination_lat": particle_data["dest_lat"],
                        "control_lon": particle_data["control_lon"],
                        "control_lat": particle_data["control_lat"],
                        "flow_index": flows.index(flow),
                        "particle_index": i,
                        "flow_type": particle_data["flow_type"]
                    }
                })
        
        result = {
            "flows": {
                "type": "FeatureCollection",
                "features": flow_features
            },
            "particles": {
                "type": "FeatureCollection",
                "features": particle_features
            }
        }
        
        print(f"Returning mobility data - flows: {len(flow_features)}, particles: {len(particle_features)}")
        
        return result
        
    except Exception as e:
        print(f"Mobility data error: {e}")
        return {"flows": []}

@router.get("/events/real/{prefecture}")
async def get_real_event_data(prefecture: str, db: Session = Depends(get_db)):
    """実際のイベントデータ"""
    try:
        # 実際の主要イベント
        events_data = {
            "広島県": [
                {
                    "name": "ひろしまフラワーフェスティバル",
                    "lat": 34.3954, "lon": 132.4534,
                    "category": "festival",
                    "expected_visitors": 160000,
                    "impact_radius": 3000
                },
                {
                    "name": "広島カープ ホームゲーム",
                    "lat": 34.3933, "lon": 132.4845,
                    "category": "sports",
                    "expected_visitors": 32000,
                    "impact_radius": 2000
                },
                {
                    "name": "とうかさん大祭",
                    "lat": 34.3936, "lon": 132.4572,
                    "category": "festival",
                    "expected_visitors": 80000,
                    "impact_radius": 1500
                }
            ],
            "山口県": [
                {
                    "name": "山口七夕ちょうちんまつり",
                    "lat": 34.1858, "lon": 131.4714,
                    "category": "festival",
                    "expected_visitors": 40000,
                    "impact_radius": 2000
                },
                {
                    "name": "下関海響マラソン",
                    "lat": 33.9507, "lon": 130.9239,
                    "category": "sports",
                    "expected_visitors": 12000,
                    "impact_radius": 5000
                }
            ]
        }
        
        events = events_data.get(prefecture, [])
        features = []
        
        for event in events:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [event["lon"], event["lat"]]
                },
                "properties": {
                    "name": event["name"],
                    "category": event["category"],
                    "expected_visitors": event["expected_visitors"],
                    "impact_radius": event["impact_radius"]
                }
            })
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
        
    except Exception as e:
        print(f"Event data error: {e}")
        return {"type": "FeatureCollection", "features": []}


@router.get("/consumption/real/{prefecture}")
async def get_real_consumption_data(prefecture: str, db: Session = Depends(get_db)):
    """実際の消費データを取得"""
    try:
        # 都道府県別の主要商業エリアの消費データ
        consumption_data = {
            "広島県": [
                # 広島市中心部
                {"name": "紙屋町商店街", "lat": 34.3954, "lon": 132.4572, "amount": 25000, "area": "広島市中区", "category": "shopping"},
                {"name": "本通り商店街", "lat": 34.3934, "lon": 132.4615, "amount": 22000, "area": "広島市中区", "category": "shopping"},
                {"name": "広島駅前商業施設", "lat": 34.3974, "lon": 132.4753, "amount": 28000, "area": "広島市南区", "category": "shopping"},
                {"name": "そごう広島店", "lat": 34.3952, "lon": 132.4574, "amount": 18000, "area": "広島市中区", "category": "department"},
                {"name": "広島三越", "lat": 34.3931, "lon": 132.4616, "amount": 16000, "area": "広島市中区", "category": "department"},
                {"name": "広島パルコ", "lat": 34.3935, "lon": 132.4618, "amount": 15000, "area": "広島市中区", "category": "fashion"},
                {"name": "エディオン広島本店", "lat": 34.3953, "lon": 132.4577, "amount": 12000, "area": "広島市中区", "category": "electronics"},
                {"name": "フジグラン広島", "lat": 34.3668, "lon": 132.4711, "amount": 14000, "area": "広島市中区", "category": "supermarket"},
                {"name": "イオンモール広島府中", "lat": 34.3989, "lon": 132.4983, "amount": 20000, "area": "府中町", "category": "mall"},
                {"name": "ゆめタウン広島", "lat": 34.3856, "lon": 132.4889, "amount": 19000, "area": "広島市南区", "category": "mall"},
                {"name": "アルパーク", "lat": 34.3747, "lon": 132.4385, "amount": 17000, "area": "広島市西区", "category": "mall"},
                {"name": "マリーナホップ", "lat": 34.3453, "lon": 132.4142, "amount": 11000, "area": "広島市西区", "category": "outlet"},
                {"name": "横川商店街", "lat": 34.4107, "lon": 132.4525, "amount": 8000, "area": "広島市西区", "category": "shopping"},
                {"name": "可部商店街", "lat": 34.5189, "lon": 132.5078, "amount": 7000, "area": "広島市安佐北区", "category": "shopping"},
                {"name": "五日市商店街", "lat": 34.3712, "lon": 132.3603, "amount": 9000, "area": "広島市佐伯区", "category": "shopping"}
            ],
            "山口県": [
                # 下関市
                {"name": "シーモール下関", "lat": 33.9507, "lon": 130.9239, "amount": 15000, "area": "下関市", "category": "mall"},
                {"name": "下関大丸", "lat": 33.9506, "lon": 130.9235, "amount": 12000, "area": "下関市", "category": "department"},
                {"name": "唐戸市場", "lat": 33.9567, "lon": 130.9417, "amount": 10000, "area": "下関市", "category": "market"},
                {"name": "リピエ下関", "lat": 33.9505, "lon": 130.9238, "amount": 8000, "area": "下関市", "category": "shopping"},
                {"name": "ゆめシティ", "lat": 34.0162, "lon": 130.9456, "amount": 14000, "area": "下関市", "category": "mall"},
                
                # 山口市
                {"name": "山口井筒屋", "lat": 34.1858, "lon": 131.4714, "amount": 11000, "area": "山口市", "category": "department"},
                {"name": "ゆめタウン山口", "lat": 34.1461, "lon": 131.4782, "amount": 13000, "area": "山口市", "category": "mall"},
                {"name": "コープ山口", "lat": 34.1856, "lon": 131.4712, "amount": 7000, "area": "山口市", "category": "supermarket"},
                {"name": "アルク山口", "lat": 34.1635, "lon": 131.4585, "amount": 6000, "area": "山口市", "category": "supermarket"},
                {"name": "湯田温泉商店街", "lat": 34.1636, "lon": 131.4583, "amount": 8000, "area": "山口市", "category": "shopping"},
                
                # 宇部市
                {"name": "フジグラン宇部", "lat": 33.9661, "lon": 131.2704, "amount": 12000, "area": "宇部市", "category": "mall"},
                {"name": "ゆめタウン宇部", "lat": 33.9825, "lon": 131.2431, "amount": 11000, "area": "宇部市", "category": "mall"},
                {"name": "宇部井筒屋", "lat": 33.9530, "lon": 131.2440, "amount": 9000, "area": "宇部市", "category": "department"},
                {"name": "常盤町商店街", "lat": 33.9533, "lon": 131.2439, "amount": 7000, "area": "宇部市", "category": "shopping"},
                
                # 周南市
                {"name": "ゆめタウン徳山", "lat": 34.0669, "lon": 131.8223, "amount": 12000, "area": "周南市", "category": "mall"},
                {"name": "イオンタウン周南", "lat": 34.0265, "lon": 131.8361, "amount": 10000, "area": "周南市", "category": "mall"},
                {"name": "徳山駅前商店街", "lat": 34.0520, "lon": 131.8055, "amount": 8000, "area": "周南市", "category": "shopping"},
                
                # 岩国市
                {"name": "フジグラン岩国", "lat": 34.1425, "lon": 132.1957, "amount": 11000, "area": "岩国市", "category": "mall"},
                {"name": "ゆめタウン南岩国", "lat": 34.1306, "lon": 132.2023, "amount": 10000, "area": "岩国市", "category": "mall"},
                {"name": "岩国駅前商店街", "lat": 34.1660, "lon": 132.2195, "amount": 7000, "area": "岩国市", "category": "shopping"}
            ]
        }
        
        stores = consumption_data.get(prefecture, [])
        features = []
        
        for store in stores:
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [store["lon"], store["lat"]]
                },
                "properties": {
                    "name": store["name"],
                    "amount": store["amount"],
                    "transactions": int(store["amount"] / 50),  # 仮の取引数
                    "area": store["area"],
                    "category": store["category"]
                }
            })
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "area_summary": {
                "広島市中区": {"total_amount": 120000, "transaction_count": 2400},
                "広島市西区": {"total_amount": 35000, "transaction_count": 700},
                "広島市南区": {"total_amount": 47000, "transaction_count": 940},
                "山口市": {"total_amount": 45000, "transaction_count": 900},
                "下関市": {"total_amount": 59000, "transaction_count": 1180},
                "宇部市": {"total_amount": 39000, "transaction_count": 780}
            }
        }
        
    except Exception as e:
        print(f"Consumption data error: {e}")
        return {"type": "FeatureCollection", "features": []}
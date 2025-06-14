"""
モビリティデータ推定サービス
マクロレベルの統計データから、ミクロレベルの人流パターンを推定
"""

import numpy as np
from typing import List, Dict, Tuple
import random
from datetime import datetime

class MobilityEstimator:
    """
    実際の統計データに基づいて、リアルな人流パターンを生成
    """
    
    def __init__(self):
        # 広島県の実際の統計データ（概算）
        self.hiroshima_stats = {
            "population": 2800000,  # 広島県人口
            "hiroshima_city": 1200000,  # 広島市人口
            "daily_commuters": 450000,  # 通勤通学者数
            "tourist_annual": 70000000,  # 年間観光客数
            "major_stations_daily": {
                "広島駅": 140000,
                "紙屋町": 85000,
                "八丁堀": 75000,
                "横川駅": 35000,
                "西広島駅": 25000,
            },
            "peak_hours": [7, 8, 18, 19],  # ピーク時間帯
            "tourist_spots_daily": {
                "平和記念公園": 30000,
                "宮島": 20000,
                "広島城": 5000,
            }
        }
        
        # 山口県の統計データ
        self.yamaguchi_stats = {
            "population": 1350000,
            "daily_commuters": 180000,
            "major_stations_daily": {
                "下関駅": 25000,
                "山口駅": 15000,
                "新山口駅": 30000,
                "防府駅": 12000,
                "徳山駅": 18000,
            }
        }
    
    def estimate_od_matrix(self, points: List[Dict], prefecture: str) -> List[Dict]:
        """
        起終点（OD）行列を推定
        重力モデルとアクティビティベースモデルを組み合わせて使用
        同じ地域内の移動も含める
        """
        flows = []
        stats = self.hiroshima_stats if prefecture == "広島県" else self.yamaguchi_stats
        
        # 時間帯を考慮
        current_hour = datetime.now().hour
        is_peak = current_hour in stats.get("peak_hours", [7, 8, 18, 19])
        time_factor = 1.5 if is_peak else 1.0
        
        # 市内移動のカウンター
        city_flow_counts = {}
        
        # 地域（市区町村）を判定するヘルパー関数
        def get_city_area(location_name):
            # 広島市関連（広い範囲で判定）
            hiroshima_keywords = [
                "広島駅", "紙屋町", "八丁堀", "平和記念", "本通り", "広島城", 
                "マツダスタジアム", "宇品", "横川", "西広島", "広島市",
                "安佐南区", "安佐北区", "佐伯区", "安芸区", "南区", "東区", "西区", "中区",
                "広島IC", "広島JCT", "広島市役所"
            ]
            for keyword in hiroshima_keywords:
                if keyword in location_name:
                    return "広島市"
            
            if any(word in location_name for word in ["福山", "鞆の浦", "松永", "新市", "神辺", "福山IC"]):
                return "福山市"
            elif any(word in location_name for word in ["呉", "広駅", "安浦", "音戸", "大和ミュージアム"]):
                return "呉市"
            elif any(word in location_name for word in ["東広島", "西条", "八本松", "広島空港", "広島大学", "高屋", "黒瀬", "東広島IC"]):
                return "東広島市"
            elif any(word in location_name for word in ["尾道", "千光寺", "しまなみ", "向島", "因島", "瀬戸田", "尾道IC"]):
                return "尾道市"
            elif any(word in location_name for word in ["三原", "本郷", "三原港", "須波"]):
                return "三原市"
            elif any(word in location_name for word in ["廿日市", "宮島", "厳島", "大野浦", "吉和"]):
                return "廿日市市"
            elif any(word in location_name for word in ["三次", "十日市", "君田", "作木"]):
                return "三次市"
            elif any(word in location_name for word in ["庄原", "東城", "西城", "高野"]):
                return "庄原市"
            elif any(word in location_name for word in ["大竹", "玖波"]):
                return "大竹市"
            elif any(word in location_name for word in ["竹原", "忠海"]):
                return "竹原市"
            elif any(word in location_name for word in ["江田島", "小用", "切串"]):
                return "江田島市"
            elif any(word in location_name for word in ["府中", "上下"]):
                return "府中市"
            elif any(word in location_name for word in ["安芸高田", "向原", "吉田"]):
                return "安芸高田市"
            elif any(word in location_name for word in ["安芸太田", "加計", "戸河内"]):
                return "安芸太田町"
            elif any(word in location_name for word in ["北広島", "千代田", "豊平"]):
                return "北広島町"
            elif any(word in location_name for word in ["高田IC"]):
                return "安芸高田市"
            else:
                return "その他"
        
        # 各地点ペア間の流動を推定
        for i, origin in enumerate(points):
            for j, destination in enumerate(points):
                if i == j:
                    continue
                
                # 距離を計算（簡易版）
                distance = self._calculate_distance(
                    (origin["lat"], origin["lon"]),
                    (destination["lat"], destination["lon"])
                )
                
                # 同じ市区町村内かどうかを判定
                origin_city = get_city_area(origin["name"])
                dest_city = get_city_area(destination["name"])
                is_same_city = (origin_city == dest_city) and (origin_city != "その他")
                
                # 重力モデル：流動量 = k * (起点の魅力度 * 終点の魅力度) / 距離^2
                origin_attraction = self._get_attraction_score(origin, stats)
                dest_attraction = self._get_attraction_score(destination, stats)
                
                # 基本流動量
                base_flow = (origin_attraction * dest_attraction) / (distance ** 1.5)
                
                # 同じ市内の移動は増幅（市内移動は多い）
                if is_same_city:
                    # 市内移動は人口規模に応じて増幅
                    if origin_city == "広島市":
                        base_flow = base_flow * 3.0  # 広島市内は特に多い
                    elif origin_city in ["福山市", "呉市"]:
                        base_flow = base_flow * 2.5  # 中核都市は多め
                    elif origin_city in ["東広島市", "尾道市", "三原市", "廿日市市"]:
                        base_flow = base_flow * 2.2  # 中規模都市
                    else:
                        base_flow = base_flow * 2.0  # その他の市
                    
                    # 特に短距離（5km未満）の市内移動はさらに増幅
                    if distance < 5:
                        base_flow = base_flow * 1.5
                    # 中距離（5-10km）の市内移動も少し増幅
                    elif distance < 10 and origin_city in ["福山市", "呉市", "東広島市"]:
                        base_flow = base_flow * 1.2
                
                # 時間帯補正
                flow_volume = int(base_flow * time_factor)
                
                # 最小閾値を設定（ノイズ除去）
                # 市内移動の場合は閾値を下げて、より多くの移動を表示
                # 人口規模に応じて閾値を調整
                if is_same_city and origin_city == "広島市":
                    min_threshold = 50  # 広島市内は特に低い閾値
                elif is_same_city and origin_city in ["福山市", "呉市", "東広島市"]:
                    min_threshold = 60  # 中規模都市は低めの閾値
                elif is_same_city and origin_city in ["尾道市", "三原市", "廿日市市"]:
                    min_threshold = 70  # 小規模都市も適度に表示
                elif is_same_city:
                    min_threshold = 80  # その他の市内移動（三次市、庄原市など）
                else:
                    min_threshold = 200  # 市外への移動
                if flow_volume > min_threshold:
                    flow_type = self._classify_flow_type(origin["name"], destination["name"])
                    flows.append({
                        "origin": origin,
                        "destination": destination,
                        "volume": flow_volume,
                        "type": flow_type,
                        "flow_type": flow_type  # 両方のプロパティを設定
                    })
                    
                    # 市内移動をカウント
                    if is_same_city:
                        city_key = f"{origin_city}内"
                        city_flow_counts[city_key] = city_flow_counts.get(city_key, 0) + 1
        
        # デバッグ出力
        print(f"市内移動フロー数:")
        for city, count in city_flow_counts.items():
            print(f"  {city}: {count}フロー")
        print(f"総フロー数: {len(flows)}")
        
        return flows
    
    def _get_attraction_score(self, location: Dict, stats: Dict) -> float:
        """
        地点の魅力度（発生・吸引力）を計算
        人口データを優先的に使用し、より正確な推定を行う
        """
        location_name = location.get("name", "")
        base_population = location.get("population", 0)
        
        # 人口データがある場合は、それを基本スコアとする
        if base_population > 0:
            # 人口を基にした基本スコア（人口の10%程度を基本とする）
            base_score = base_population * 0.1
            
            # 施設タイプによる補正係数
            if "駅" in location_name:
                # 駅は人口に加えて交通ハブとしての役割があるため係数を高める
                if "広島駅" in location_name or "福山駅" in location_name:
                    return base_score * 2.0  # 主要駅は2倍
                else:
                    return base_score * 1.5  # その他の駅は1.5倍
            elif "空港" in location_name:
                return base_score * 2.5  # 空港は広域からの集客
            elif "大学" in location_name:
                return base_score * 1.8  # 大学は学生の移動が多い
            elif "市役所" in location_name or "区役所" in location_name:
                return base_score * 0.8  # 行政施設は人口比で少なめ
            elif "神社" in location_name or "公園" in location_name:
                return base_score * 1.2  # 観光地は少し多め
            elif "IC" in location_name or "JCT" in location_name:
                return base_score * 1.3  # 高速道路は交通の要所
            else:
                return base_score  # その他は人口ベース
        
        # 人口データがない場合は従来の方法で推定
        # 駅の利用者数データがある場合
        if location_name in stats.get("major_stations_daily", {}):
            return stats["major_stations_daily"][location_name] * 0.1
        
        # 観光地の場合
        if location_name in stats.get("tourist_spots_daily", {}):
            return stats["tourist_spots_daily"][location_name] * 0.15
        
        # キーワードベースの推定（人口データがない場合のフォールバック）
        if "駅" in location_name:
            return 5000
        elif "空港" in location_name:
            return 15000
        elif "大学" in location_name:
            return 8000
        elif "市役所" in location_name or "区役所" in location_name:
            return 3000
        elif "公園" in location_name:
            return 2000
        elif "港" in location_name:
            return 4000
        else:
            return 1500  # デフォルト値
    
    def _calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        2点間の距離を計算（簡易版、km単位）
        """
        lat1, lon1 = coord1
        lat2, lon2 = coord2
        
        # 簡易的な平面距離計算
        lat_diff = abs(lat2 - lat1) * 111  # 緯度1度≈111km
        lon_diff = abs(lon2 - lon1) * 91   # 緯度35度での経度1度≈91km
        
        return max(0.5, np.sqrt(lat_diff**2 + lon_diff**2))  # 最小0.5km
    
    def _classify_flow_type(self, origin: str, destination: str) -> str:
        """
        流動タイプを分類（通勤、観光、ビジネス等）
        """
        commute_keywords = ["駅", "大学", "市役所", "区役所"]
        tourist_keywords = ["公園", "城", "記念", "港", "空港"]
        
        origin_is_commute = any(keyword in origin for keyword in commute_keywords)
        dest_is_commute = any(keyword in destination for keyword in commute_keywords)
        origin_is_tourist = any(keyword in origin for keyword in tourist_keywords)
        dest_is_tourist = any(keyword in destination for keyword in tourist_keywords)
        
        if origin_is_commute and dest_is_commute:
            return "commute"
        elif origin_is_tourist or dest_is_tourist:
            return "tourism"
        else:
            return "general"
    
    def generate_realistic_particles(self, flow: Dict, num_particles: int) -> List[Dict]:
        """
        フローに沿ったリアルなパーティクル配置を生成
        ベジエ曲線を使用して自然な経路を作成
        距離に応じてパーティクル数と速度を調整
        """
        # 距離を計算
        origin = flow["origin"]
        dest = flow["destination"]
        distance = self._calculate_distance(
            (origin["lat"], origin["lon"]),
            (dest["lat"], dest["lon"])
        )
        
        # 距離に基づいてパーティクル数を調整
        # 近距離（1-5km）: 同じ市内レベル、パーティクル数を減らす
        # 中距離（5-20km）: 標準
        # 遠距離（20km以上）: パーティクル数を大幅に増やす
        if distance < 5:
            particle_multiplier = 0.3  # 近距離は少なく
        elif distance > 20:
            particle_multiplier = 2.0  # 遠距離は2倍（約20個）
        else:
            particle_multiplier = 1.0
        
        # 適切なパーティクル数に調整（パフォーマンスを考慮）
        adjusted_num_particles = int(num_particles * particle_multiplier)  # 元の設定に戻す
        particles = []
        
        # フロータイプに応じた色設定
        color_map = {
            "commute": "#00FFFF",  # シアン（通勤）
            "tourism": "#FF00FF",  # マゼンタ（観光）
            "general": "#FFFF00",  # イエロー（一般）
        }
        
        flow_type = flow.get("type", "general")
        base_color = color_map.get(flow_type, "#FFFF00")
        
        # ベジエ曲線の制御点を計算
        origin = flow["origin"]
        dest = flow["destination"]
        
        # 中間制御点（自然な曲線を作るため）
        mid_lat = (origin["lat"] + dest["lat"]) / 2
        mid_lon = (origin["lon"] + dest["lon"]) / 2
        
        # 曲線の湾曲度（ランダムに設定）
        curve_factor = random.uniform(-0.02, 0.02)
        control_lat = mid_lat + curve_factor
        control_lon = mid_lon - curve_factor
        
        for i in range(adjusted_num_particles):
            # パーティクルの初期位置（0-1の範囲でランダム）
            t = random.uniform(0, 1)
            
            # ベジエ曲線上の点を計算
            lat = (1-t)**2 * origin["lat"] + 2*(1-t)*t * control_lat + t**2 * dest["lat"]
            lon = (1-t)**2 * origin["lon"] + 2*(1-t)*t * control_lon + t**2 * dest["lon"]
            
            # 速度の変動（距離に応じて調整）
            # 近距離: ゆっくり（基本速度の0.15倍）
            # 中距離: 標準速度（基本速度の0.25倍）
            # 遠距離: 少し速い（基本速度の0.35倍）
            base_speed = 0.3 + (flow["volume"] / 100000)
            if distance < 5:
                speed_multiplier = 0.15  # 近距離はゆっくり
            elif distance > 20:
                speed_multiplier = 0.35  # 遠距離は少し速い程度に抑える
            else:
                speed_multiplier = 0.25  # 中距離は標準
            
            base_speed = base_speed * speed_multiplier
            speed_variation = random.uniform(0.8, 1.2)
            
            particles.append({
                "lat": lat,
                "lon": lon,
                "size": 2,
                "color": base_color,
                "speed": base_speed * speed_variation,
                "origin_lat": origin["lat"],
                "origin_lon": origin["lon"],
                "dest_lat": dest["lat"],
                "dest_lon": dest["lon"],
                "control_lat": control_lat,
                "control_lon": control_lon,
                "progress": t,
                "flow_type": flow_type
            })
        
        return particles
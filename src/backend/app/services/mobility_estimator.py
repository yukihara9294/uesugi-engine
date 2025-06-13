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
        """
        flows = []
        stats = self.hiroshima_stats if prefecture == "広島県" else self.yamaguchi_stats
        
        # 時間帯を考慮
        current_hour = datetime.now().hour
        is_peak = current_hour in stats.get("peak_hours", [7, 8, 18, 19])
        time_factor = 1.5 if is_peak else 1.0
        
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
                
                # 重力モデル：流動量 = k * (起点の魅力度 * 終点の魅力度) / 距離^2
                origin_attraction = self._get_attraction_score(origin["name"], stats)
                dest_attraction = self._get_attraction_score(destination["name"], stats)
                
                # 基本流動量
                base_flow = (origin_attraction * dest_attraction) / (distance ** 1.5)
                
                # 時間帯補正
                flow_volume = int(base_flow * time_factor)
                
                # 最小閾値を設定（ノイズ除去）
                if flow_volume > 1000:
                    flow_type = self._classify_flow_type(origin["name"], destination["name"])
                    flows.append({
                        "origin": origin,
                        "destination": destination,
                        "volume": flow_volume,
                        "type": flow_type,
                        "flow_type": flow_type  # 両方のプロパティを設定
                    })
        
        return flows
    
    def _get_attraction_score(self, location_name: str, stats: Dict) -> float:
        """
        地点の魅力度（発生・吸引力）を計算
        """
        # 駅の利用者数データがある場合
        if location_name in stats.get("major_stations_daily", {}):
            return stats["major_stations_daily"][location_name] * 0.1
        
        # 観光地の場合
        if location_name in stats.get("tourist_spots_daily", {}):
            return stats["tourist_spots_daily"][location_name] * 0.15
        
        # キーワードベースの推定
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
        """
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
        
        for i in range(num_particles):
            # パーティクルの初期位置（0-1の範囲でランダム）
            t = random.uniform(0, 1)
            
            # ベジエ曲線上の点を計算
            lat = (1-t)**2 * origin["lat"] + 2*(1-t)*t * control_lat + t**2 * dest["lat"]
            lon = (1-t)**2 * origin["lon"] + 2*(1-t)*t * control_lon + t**2 * dest["lon"]
            
            # 速度の変動
            base_speed = 0.3 + (flow["volume"] / 100000)
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
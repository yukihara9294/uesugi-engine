"""
気象データ収集モジュール
Open-Meteo APIから気象データを取得
"""
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class WeatherCollector:
    """Open-Meteo APIを使用して気象データを収集"""
    
    BASE_URL = "https://api.open-meteo.com/v1/forecast"
    ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
    
    # 主要都市の座標
    LOCATIONS = {
        "広島市": {"lat": 34.3853, "lng": 132.4553, "prefecture": "広島県"},
        "福山市": {"lat": 34.4858, "lng": 133.3626, "prefecture": "広島県"},
        "呉市": {"lat": 34.2486, "lng": 132.5661, "prefecture": "広島県"},
        "尾道市": {"lat": 34.4090, "lng": 133.2050, "prefecture": "広島県"},
        "山口市": {"lat": 34.1859, "lng": 131.4705, "prefecture": "山口県"},
        "下関市": {"lat": 33.9576, "lng": 130.9408, "prefecture": "山口県"},
        "宇部市": {"lat": 33.9516, "lng": 131.2467, "prefecture": "山口県"},
        "岩国市": {"lat": 34.1667, "lng": 132.2200, "prefecture": "山口県"},
    }
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data")
        
    def fetch_current_weather(self, city: str) -> Dict:
        """
        現在の天気データを取得
        """
        location = self.LOCATIONS.get(city)
        if not location:
            logger.error(f"Unknown city: {city}")
            return {}
            
        params = {
            "latitude": location["lat"],
            "longitude": location["lng"],
            "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
            "hourly": "temperature_2m,precipitation_probability,precipitation,weather_code",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            "timezone": "Asia/Tokyo",
            "forecast_days": 7
        }
        
        try:
            response = requests.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            return self._format_weather_data(data, city, location)
            
        except Exception as e:
            logger.error(f"Failed to fetch weather for {city}: {e}")
            return {}
    
    def fetch_historical_weather(self, city: str, start_date: str, end_date: str) -> Dict:
        """
        過去の気象データを取得
        """
        location = self.LOCATIONS.get(city)
        if not location:
            return {}
            
        params = {
            "latitude": location["lat"],
            "longitude": location["lng"],
            "start_date": start_date,
            "end_date": end_date,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            "timezone": "Asia/Tokyo"
        }
        
        try:
            response = requests.get(self.ARCHIVE_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            return self._format_weather_data(data, city, location, is_historical=True)
            
        except Exception as e:
            logger.error(f"Failed to fetch historical weather for {city}: {e}")
            return {}
    
    def _format_weather_data(self, raw_data: Dict, city: str, location: Dict, is_historical: bool = False) -> Dict:
        """
        気象データを統一フォーマットに変換
        """
        formatted_data = {
            "data_layer": "environment",
            "source": "Open-Meteo",
            "timestamp": datetime.now().isoformat(),
            "location": {
                "city": city,
                "prefecture": location["prefecture"],
                "lat": location["lat"],
                "lng": location["lng"]
            },
            "data": {
                "type": "historical" if is_historical else "forecast"
            }
        }
        
        # 現在の天気データ
        if "current" in raw_data:
            formatted_data["data"]["current"] = {
                "temperature": raw_data["current"]["temperature_2m"],
                "humidity": raw_data["current"]["relative_humidity_2m"],
                "precipitation": raw_data["current"]["precipitation"],
                "weather_code": raw_data["current"]["weather_code"],
                "wind_speed": raw_data["current"]["wind_speed_10m"],
                "wind_direction": raw_data["current"]["wind_direction_10m"],
                "time": raw_data["current"]["time"]
            }
        
        # 日別データ
        if "daily" in raw_data:
            formatted_data["data"]["daily"] = []
            for i in range(len(raw_data["daily"]["time"])):
                formatted_data["data"]["daily"].append({
                    "date": raw_data["daily"]["time"][i],
                    "weather_code": raw_data["daily"]["weather_code"][i],
                    "temperature_max": raw_data["daily"]["temperature_2m_max"][i],
                    "temperature_min": raw_data["daily"]["temperature_2m_min"][i],
                    "precipitation": raw_data["daily"]["precipitation_sum"][i]
                })
        
        return formatted_data
    
    def collect_all_weather(self) -> Dict:
        """
        全都市の気象データを収集
        """
        results = {}
        
        for city in self.LOCATIONS.keys():
            logger.info(f"Fetching weather for {city}...")
            data = self.fetch_current_weather(city)
            
            if data:
                results[city] = data
                
        # 結果を保存
        self._save_results(results)
        return results
    
    def _save_results(self, data: Dict):
        """
        収集したデータを保存
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = self.data_dir / "raw" / f"weather_{timestamp}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Weather data saved to {output_path}")


# 地震データコレクター
class EarthquakeCollector:
    """気象庁の地震データを収集"""
    
    BASE_URL = "https://www.jma.go.jp/bosai/quake/data/list.json"
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data")
        
    def fetch_recent_earthquakes(self) -> List[Dict]:
        """
        最近の地震データを取得
        """
        try:
            response = requests.get(self.BASE_URL)
            response.raise_for_status()
            data = response.json()
            
            # 広島県・山口県周辺の地震のみフィルタリング
            filtered_data = []
            for quake in data:
                if self._is_nearby_earthquake(quake):
                    filtered_data.append(self._format_earthquake_data(quake))
                    
            return filtered_data
            
        except Exception as e:
            logger.error(f"Failed to fetch earthquake data: {e}")
            return []
    
    def _is_nearby_earthquake(self, quake: Dict) -> bool:
        """
        広島・山口周辺の地震かどうか判定
        """
        # 簡易的な判定（実際はより詳細な地域判定が必要）
        if "pref" in quake:
            nearby_prefs = ["広島県", "山口県", "島根県", "岡山県", "愛媛県", "大分県", "福岡県"]
            for pref in nearby_prefs:
                if pref in str(quake.get("pref", "")):
                    return True
        return False
    
    def _format_earthquake_data(self, quake: Dict) -> Dict:
        """
        地震データを統一フォーマットに変換
        """
        return {
            "data_layer": "environment",
            "source": "JMA",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "type": "earthquake",
                "time": quake.get("at", ""),
                "magnitude": quake.get("mag", ""),
                "max_intensity": quake.get("maxi", ""),
                "hypocenter": quake.get("hyp", ""),
                "depth": quake.get("dep", "")
            }
        }


if __name__ == "__main__":
    # 気象データ収集テスト
    weather = WeatherCollector()
    results = weather.collect_all_weather()
    
    # 地震データ収集テスト
    # earthquake = EarthquakeCollector()
    # quakes = earthquake.fetch_recent_earthquakes()
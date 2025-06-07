"""
OpenWeatherMap API連携サービス
気象データの取得と保存
"""

import httpx
import asyncio
from typing import Optional, Dict, List
from datetime import datetime
from loguru import logger
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.heatmap import WeatherData
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class WeatherService:
    """気象データサービス"""
    
    def __init__(self):
        self.api_key = settings.OPENWEATHERMAP_API_KEY
        self.base_url = "https://api.openweathermap.org/data/2.5"
        self.timeout = 10.0
    
    async def get_current_weather(self, lat: float, lon: float) -> Optional[Dict]:
        """現在の気象データを取得"""
        
        if not self.api_key:
            logger.warning("OpenWeatherMap API key not configured")
            return None
        
        url = f"{self.base_url}/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",  # 摂氏温度
            "lang": "ja"
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                logger.info(f"Weather data retrieved for ({lat}, {lon})")
                return self._parse_weather_data(data, lat, lon)
                
        except httpx.TimeoutException:
            logger.error(f"Weather API timeout for ({lat}, {lon})")
            return None
        except httpx.HTTPStatusError as e:
            logger.error(f"Weather API error {e.response.status_code}: {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Unexpected weather API error: {str(e)}")
            return None
    
    async def get_forecast(self, lat: float, lon: float, days: int = 5) -> Optional[List[Dict]]:
        """天気予報データを取得"""
        
        if not self.api_key:
            return None
        
        url = f"{self.base_url}/forecast"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self.api_key,
            "units": "metric",
            "lang": "ja",
            "cnt": days * 8  # 3時間ごと × 8 = 24時間
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                forecasts = []
                for item in data.get("list", []):
                    forecast = self._parse_forecast_item(item, lat, lon)
                    if forecast:
                        forecasts.append(forecast)
                
                return forecasts
                
        except Exception as e:
            logger.error(f"Forecast API error: {str(e)}")
            return None
    
    def _parse_weather_data(self, data: Dict, lat: float, lon: float) -> Dict:
        """OpenWeatherMapレスポンスをパース"""
        
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        wind = data.get("wind", {})
        
        return {
            "timestamp": datetime.fromtimestamp(data.get("dt", 0)),
            "latitude": lat,
            "longitude": lon,
            "temperature": main.get("temp"),
            "humidity": main.get("humidity"),
            "pressure": main.get("pressure"),
            "wind_speed": wind.get("speed"),
            "wind_direction": wind.get("deg"),
            "weather_condition": weather.get("description"),
            "weather_code": weather.get("id"),
            "visibility": data.get("visibility", 0) / 1000.0,  # m to km
            "precipitation": data.get("rain", {}).get("1h", 0.0),  # 1時間の降水量
            "data_source": "openweathermap"
        }
    
    def _parse_forecast_item(self, item: Dict, lat: float, lon: float) -> Dict:
        """予報データアイテムをパース"""
        
        main = item.get("main", {})
        weather = item.get("weather", [{}])[0]
        wind = item.get("wind", {})
        
        return {
            "timestamp": datetime.fromtimestamp(item.get("dt", 0)),
            "latitude": lat,
            "longitude": lon,
            "temperature": main.get("temp"),
            "humidity": main.get("humidity"),
            "pressure": main.get("pressure"),
            "wind_speed": wind.get("speed"),
            "wind_direction": wind.get("deg"),
            "weather_condition": weather.get("description"),
            "weather_code": weather.get("id"),
            "precipitation": item.get("rain", {}).get("3h", 0),  # 3時間降水量
            "data_source": "openweathermap_forecast"
        }
    
    async def save_weather_data(self, weather_data: Dict) -> bool:
        """気象データをデータベースに保存"""
        
        try:
            query = text("""
            INSERT INTO weather_data (
                timestamp, location, temperature, humidity, precipitation,
                wind_speed, wind_direction, pressure, visibility,
                weather_condition, weather_code, data_source
            ) VALUES (
                :timestamp, ST_Point(:longitude, :latitude, 4326),
                :temperature, :humidity, :precipitation,
                :wind_speed, :wind_direction, :pressure, :visibility,
                :weather_condition, :weather_code, :data_source
            )
            """)
            
            async with AsyncSessionLocal() as session:
                await session.execute(query, weather_data)
                await session.commit()
            
            logger.info(f"Weather data saved for ({weather_data['latitude']}, {weather_data['longitude']})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save weather data: {str(e)}")
            return False
    
    async def get_weather_for_landmarks(self) -> List[Dict]:
        """ベンチマーク施設の気象データを取得"""
        
        weather_data = []
        landmarks = settings.LANDMARKS
        
        for name, coords in landmarks.items():
            data = await self.get_current_weather(coords["lat"], coords["lon"])
            if data:
                data["landmark_name"] = name
                weather_data.append(data)
                # レート制限対応
                await asyncio.sleep(0.1)
        
        return weather_data
    
    async def update_weather_batch(self):
        """バッチでの気象データ更新"""
        
        logger.info("Starting weather data batch update")
        
        # ベンチマーク施設の気象データ取得
        weather_data = await self.get_weather_for_landmarks()
        
        # データベース保存
        saved_count = 0
        for data in weather_data:
            if await self.save_weather_data(data):
                saved_count += 1
        
        logger.info(f"Weather batch update completed: {saved_count}/{len(weather_data)} saved")
        return saved_count


# サービスインスタンス
weather_service = WeatherService()
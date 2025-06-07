"""
気象データAPI
OpenWeatherMapからの気象情報取得・配信
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta
from app.services.weather_service import weather_service
from app.core.database import AsyncSessionLocal
from app.core.config import settings
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

class WeatherResponse(BaseModel):
    """気象データレスポンス"""
    latitude: float
    longitude: float
    timestamp: datetime
    temperature: Optional[float]
    humidity: Optional[float]
    precipitation: Optional[float]
    wind_speed: Optional[float]
    wind_direction: Optional[float]
    weather_condition: Optional[str]
    landmark_name: Optional[str] = None

class WeatherSummary(BaseModel):
    """気象データサマリー"""
    current_weather: List[WeatherResponse]
    average_temperature: Optional[float]
    total_precipitation: Optional[float]
    dominant_condition: Optional[str]

@router.get("/current")
async def get_current_weather(
    lat: float = Query(..., description="緯度"),
    lon: float = Query(..., description="経度")
):
    """指定地点の現在の気象データを取得"""
    
    weather_data = await weather_service.get_current_weather(lat, lon)
    
    if not weather_data:
        raise HTTPException(
            status_code=503, 
            detail="気象データの取得に失敗しました。APIキーまたはネットワーク接続を確認してください。"
        )
    
    return weather_data

@router.get("/landmarks", response_model=WeatherSummary)
async def get_landmarks_weather():
    """ベンチマーク施設の気象データを取得"""
    
    weather_data = await weather_service.get_weather_for_landmarks()
    
    if not weather_data:
        return WeatherSummary(
            current_weather=[],
            average_temperature=None,
            total_precipitation=None,
            dominant_condition=None
        )
    
    # 統計計算
    temperatures = [w["temperature"] for w in weather_data if w.get("temperature")]
    precipitations = [w.get("precipitation", 0) for w in weather_data]
    conditions = [w["weather_condition"] for w in weather_data if w.get("weather_condition")]
    
    avg_temp = sum(temperatures) / len(temperatures) if temperatures else None
    total_precip = sum(precipitations) if precipitations else None
    dominant_condition = max(set(conditions), key=conditions.count) if conditions else None
    
    # レスポンス作成
    weather_responses = [WeatherResponse(**data) for data in weather_data]
    
    return WeatherSummary(
        current_weather=weather_responses,
        average_temperature=avg_temp,
        total_precipitation=total_precip,
        dominant_condition=dominant_condition
    )

@router.get("/forecast")
async def get_weather_forecast(
    lat: float = Query(..., description="緯度"),
    lon: float = Query(..., description="経度"),
    days: int = Query(5, le=5, description="予報日数")
):
    """指定地点の天気予報を取得"""
    
    forecast_data = await weather_service.get_forecast(lat, lon, days)
    
    if not forecast_data:
        raise HTTPException(
            status_code=503,
            detail="天気予報データの取得に失敗しました"
        )
    
    return {
        "location": {"latitude": lat, "longitude": lon},
        "forecast": forecast_data,
        "forecast_count": len(forecast_data)
    }

@router.get("/history")
async def get_weather_history(
    lat: float = Query(..., description="緯度"),
    lon: float = Query(..., description="経度"),
    start_time: Optional[datetime] = Query(None, description="開始時刻"),
    end_time: Optional[datetime] = Query(None, description="終了時刻"),
    radius: float = Query(1000, description="検索半径（メートル）")
):
    """保存済み気象データの履歴を取得"""
    
    # デフォルト時間範囲（過去7日間）
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    query = """
    SELECT 
        timestamp,
        ST_X(location) as longitude,
        ST_Y(location) as latitude,
        temperature,
        humidity,
        precipitation,
        wind_speed,
        wind_direction,
        pressure,
        weather_condition,
        weather_code
    FROM weather_data
    WHERE 
        ST_DWithin(
            location,
            ST_Point(:lon, :lat, 4326),
            :radius
        )
        AND timestamp BETWEEN :start_time AND :end_time
    ORDER BY timestamp DESC
    LIMIT 100
    """
    
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(query), {
                "lat": lat,
                "lon": lon,
                "radius": radius,
                "start_time": start_time,
                "end_time": end_time
            })
            rows = result.mappings().all()
        
        history = []
        for row in rows:
            history.append({
                "timestamp": row["timestamp"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "temperature": row["temperature"],
                "humidity": row["humidity"],
                "precipitation": row["precipitation"],
                "wind_speed": row["wind_speed"],
                "wind_direction": row["wind_direction"],
                "pressure": row["pressure"],
                "weather_condition": row["weather_condition"],
                "weather_code": row["weather_code"]
            })
        
        return {
            "location": {"latitude": lat, "longitude": lon},
            "time_range": {"start": start_time, "end": end_time},
            "history": history,
            "count": len(history)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"履歴データの取得に失敗しました: {str(e)}")

@router.post("/update")
async def update_weather_data():
    """気象データの手動更新"""
    
    try:
        saved_count = await weather_service.update_weather_batch()
        return {
            "message": "気象データを更新しました",
            "updated_locations": saved_count,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"気象データの更新に失敗しました: {str(e)}")

@router.get("/conditions")
async def get_weather_conditions():
    """利用可能な気象条件一覧を取得"""
    
    query = """
    SELECT 
        weather_condition,
        weather_code,
        COUNT(*) as occurrence_count,
        AVG(temperature) as avg_temperature
    FROM weather_data
    WHERE weather_condition IS NOT NULL
    GROUP BY weather_condition, weather_code
    ORDER BY occurrence_count DESC
    """
    
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(query))
            rows = result.mappings().all()
        
        conditions = []
        for row in rows:
            conditions.append({
                "condition": row["weather_condition"],
                "code": row["weather_code"],
                "occurrence_count": row["occurrence_count"],
                "avg_temperature": float(row["avg_temperature"]) if row["avg_temperature"] else None
            })
        
        return {"conditions": conditions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"気象条件の取得に失敗しました: {str(e)}")
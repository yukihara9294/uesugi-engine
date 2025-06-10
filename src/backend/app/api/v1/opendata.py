"""
オープンデータAPIエンドポイント
リアルタイムの気象データや地震データを提供
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
import json
from pathlib import Path
from datetime import datetime
from app.core.database import get_db

router = APIRouter()


@router.get("/weather/current")
async def get_current_weather():
    """現在の気象データを取得（ファイルから）"""
    try:
        # 最新の収集結果を読み込み
        results_dir = Path("uesugi-engine-data/collection_results")
        json_files = list(results_dir.glob("free_data_*.json"))
        
        if not json_files:
            raise HTTPException(status_code=404, detail="気象データが見つかりません")
            
        latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        weather_data = data.get('weather', {})
        
        # レスポンス形式に整形
        formatted_data = []
        for city_name, city_data in weather_data.items():
            if city_data.get('status') == 'success':
                current = city_data.get('current', {})
                formatted_data.append({
                    "city": city_name,
                    "temperature": current.get('temperature_2m', 0),
                    "humidity": current.get('relative_humidity_2m', 0),
                    "precipitation": current.get('precipitation', 0),
                    "weather_code": current.get('weather_code', 0),
                    "wind_speed": current.get('wind_speed_10m', 0),
                    "observation_time": current.get('time', '')
                })
                
        return {
            "status": "success",
            "data": formatted_data,
            "source": "Open-Meteo",
            "updated_at": data.get('timestamp', '')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather/forecast/{city}")
async def get_weather_forecast(city: str):
    """特定都市の天気予報を取得"""
    try:
        results_dir = Path("uesugi-engine-data/collection_results")
        json_files = list(results_dir.glob("free_data_*.json"))
        
        if not json_files:
            raise HTTPException(status_code=404, detail="気象データが見つかりません")
            
        latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        weather_data = data.get('weather', {})
        city_data = weather_data.get(city)
        
        if not city_data or city_data.get('status') != 'success':
            raise HTTPException(status_code=404, detail=f"{city}の気象データが見つかりません")
            
        return {
            "status": "success",
            "city": city,
            "current": city_data.get('current', {}),
            "daily_forecast": city_data.get('daily_forecast', {}),
            "source": "Open-Meteo"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/earthquakes/recent")
async def get_recent_earthquakes(limit: int = 20):
    """最近の地震データを取得"""
    try:
        results_dir = Path("uesugi-engine-data/collection_results")
        json_files = list(results_dir.glob("free_data_*.json"))
        
        if not json_files:
            raise HTTPException(status_code=404, detail="地震データが見つかりません")
            
        latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        earthquakes = data.get('earthquakes', [])[:limit]
        
        # レスポンス形式に整形
        formatted_quakes = []
        for quake in earthquakes:
            if 'hypocenter' in quake:
                hypo = quake['hypocenter']
                formatted_quakes.append({
                    "event_id": quake.get('eventId', ''),
                    "magnitude": quake.get('magnitude'),
                    "depth": hypo.get('depth', 0),
                    "location": {
                        "lat": hypo.get('latitude', 0),
                        "lng": hypo.get('longitude', 0),
                        "name": hypo.get('name', '')
                    },
                    "origin_time": quake.get('originTime', ''),
                    "max_intensity": quake.get('maxInt')
                })
                
        return {
            "status": "success",
            "count": len(formatted_quakes),
            "data": formatted_quakes,
            "source": "気象庁"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/gtfs/available")
async def get_available_gtfs():
    """利用可能なGTFSフィードを取得"""
    try:
        results_dir = Path("uesugi-engine-data/collection_results")
        json_files = list(results_dir.glob("free_data_*.json"))
        
        if not json_files:
            raise HTTPException(status_code=404, detail="GTFSデータが見つかりません")
            
        latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        gtfs_data = data.get('gtfs', {})
        
        # 利用可能なフィードのみ
        available_feeds = []
        for operator, info in gtfs_data.items():
            if info.get('status') == 'available':
                available_feeds.append({
                    "operator": operator,
                    "url": info.get('url', ''),
                    "type": info.get('type', ''),
                    "status": "available"
                })
                
        return {
            "status": "success",
            "count": len(available_feeds),
            "feeds": available_feeds
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_opendata_status():
    """オープンデータ収集状況を取得"""
    try:
        summary_path = Path("uesugi-engine-data/collection_results/latest_summary.txt")
        
        if summary_path.exists():
            with open(summary_path, 'r', encoding='utf-8') as f:
                summary = f.read()
        else:
            summary = "収集サマリーが見つかりません"
            
        # 最新の収集時刻を取得
        results_dir = Path("uesugi-engine-data/collection_results")
        json_files = list(results_dir.glob("free_data_*.json"))
        
        if json_files:
            latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
            with open(latest_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                last_updated = data.get('timestamp', 'Unknown')
        else:
            last_updated = "データ未収集"
            
        return {
            "status": "success",
            "last_updated": last_updated,
            "summary": summary,
            "available_data": {
                "weather": "5都市の気象データ",
                "earthquakes": "最新の地震情報",
                "gtfs": "公共交通GTFSフィード",
                "prefectures": "都府県オープンデータ"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
"""
ヒートマップデータAPI
地理空間データの取得と配信
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from app.core.database import get_db, AsyncSessionLocal
from app.models.heatmap import HeatmapPoint
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
import json

router = APIRouter()

class HeatmapResponse(BaseModel):
    """ヒートマップレスポンス"""
    type: str = "FeatureCollection"
    features: List[dict]
    metadata: dict

class BoundingBox(BaseModel):
    """境界ボックス"""
    north: float
    south: float
    east: float
    west: float

@router.get("/points", response_model=HeatmapResponse)
async def get_heatmap_points(
    # 地理範囲
    north: float = Query(34.9, description="北緯"),
    south: float = Query(34.0, description="南緯"),
    east: float = Query(133.3, description="東経"),
    west: float = Query(132.0, description="西経"),
    
    # 時間範囲
    start_time: Optional[datetime] = Query(None, description="開始時刻"),
    end_time: Optional[datetime] = Query(None, description="終了時刻"),
    
    # フィルタ条件
    categories: Optional[str] = Query(None, description="カテゴリ（カンマ区切り）"),
    data_sources: Optional[str] = Query(None, description="データソース（カンマ区切り）"),
    min_intensity: Optional[float] = Query(0.0, description="最小強度"),
    
    # ページング
    limit: int = Query(1000, le=5000, description="最大取得数"),
    offset: int = Query(0, description="オフセット"),
    
    db: Session = Depends(get_db)
):
    """ヒートマップポイントデータの取得"""
    
    # デフォルト時間範囲（過去24時間）
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(hours=24)
    
    # SQLクエリ構築
    query = """
    SELECT 
        id,
        ST_X(location) as longitude,
        ST_Y(location) as latitude,
        timestamp,
        data_source,
        category,
        subcategory,
        sentiment_score,
        intensity,
        text_content,
        user_type,
        metadata_json
    FROM heatmap_points
    WHERE 
        ST_Within(
            location, 
            ST_MakeEnvelope(:west, :south, :east, :north, 4326)
        )
        AND timestamp BETWEEN :start_time AND :end_time
        AND intensity >= :min_intensity
    """
    
    params = {
        "west": west, "south": south, "east": east, "north": north,
        "start_time": start_time, "end_time": end_time,
        "min_intensity": min_intensity
    }
    
    # カテゴリフィルタ
    if categories:
        category_list = [cat.strip() for cat in categories.split(",")]
        placeholders = ",".join([f":cat_{i}" for i in range(len(category_list))])
        query += f" AND category IN ({placeholders})"
        for i, cat in enumerate(category_list):
            params[f"cat_{i}"] = cat
    
    # データソースフィルタ
    if data_sources:
        source_list = [src.strip() for src in data_sources.split(",")]
        placeholders = ",".join([f":src_{i}" for i in range(len(source_list))])
        query += f" AND data_source IN ({placeholders})"
        for i, src in enumerate(source_list):
            params[f"src_{i}"] = src
    
    # ページング
    query += f" ORDER BY timestamp DESC LIMIT {limit} OFFSET {offset}"
    
    # クエリ実行
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(query), params)
            rows = result.mappings().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")
    
    # GeoJSONフィーチャーに変換
    features = []
    for row in rows:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row["longitude"], row["latitude"]]
            },
            "properties": {
                "id": str(row["id"]),
                "timestamp": row["timestamp"].isoformat(),
                "data_source": row["data_source"],
                "category": row["category"],
                "subcategory": row["subcategory"],
                "sentiment_score": row["sentiment_score"],
                "intensity": row["intensity"],
                "text_content": row["text_content"],
                "user_type": row["user_type"],
                "metadata": row["metadata_json"]
            }
        }
        features.append(feature)
    
    # レスポンス構築
    return HeatmapResponse(
        features=features,
        metadata={
            "count": len(features),
            "bounds": {"north": north, "south": south, "east": east, "west": west},
            "time_range": {"start": start_time.isoformat(), "end": end_time.isoformat()},
            "filters": {
                "categories": categories.split(",") if categories else None,
                "data_sources": data_sources.split(",") if data_sources else None,
                "min_intensity": min_intensity
            }
        }
    )

@router.get("/density")
async def get_density_grid(
    north: float = Query(34.9),
    south: float = Query(34.0),
    east: float = Query(133.3),
    west: float = Query(132.0),
    grid_size: float = Query(0.01, description="グリッドサイズ（度）"),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    categories: Optional[str] = Query(None)
):
    """密度グリッドデータの取得"""
    
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(hours=24)
    
    # グリッド密度計算クエリ
    query = """
    SELECT 
        FLOOR(ST_X(location) / :grid_size) * :grid_size as grid_lon,
        FLOOR(ST_Y(location) / :grid_size) * :grid_size as grid_lat,
        COUNT(*) as point_count,
        AVG(intensity) as avg_intensity,
        AVG(sentiment_score) as avg_sentiment
    FROM heatmap_points
    WHERE 
        ST_Within(location, ST_MakeEnvelope(:west, :south, :east, :north, 4326))
        AND timestamp BETWEEN :start_time AND :end_time
    """
    
    params = {
        "grid_size": grid_size,
        "west": west, "south": south, "east": east, "north": north,
        "start_time": start_time, "end_time": end_time
    }
    
    if categories:
        category_list = [cat.strip() for cat in categories.split(",")]
        placeholders = ",".join([f":cat_{i}" for i in range(len(category_list))])
        query += f" AND category IN ({placeholders})"
        for i, cat in enumerate(category_list):
            params[f"cat_{i}"] = cat
    
    query += " GROUP BY grid_lon, grid_lat HAVING COUNT(*) > 0"
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query), params)
        rows = result.mappings().all()
    
    # グリッドデータをGeoJSONに変換
    features = []
    for row in rows:
        # グリッドセルの境界を計算
        min_lon = row["grid_lon"]
        max_lon = row["grid_lon"] + grid_size
        min_lat = row["grid_lat"]
        max_lat = row["grid_lat"] + grid_size
        
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [min_lon, min_lat],
                    [max_lon, min_lat],
                    [max_lon, max_lat],
                    [min_lon, max_lat],
                    [min_lon, min_lat]
                ]]
            },
            "properties": {
                "point_count": row["point_count"],
                "avg_intensity": float(row["avg_intensity"]) if row["avg_intensity"] else 0,
                "avg_sentiment": float(row["avg_sentiment"]) if row["avg_sentiment"] else 0,
                "density": row["point_count"] / (grid_size ** 2)
            }
        }
        features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "grid_size": grid_size,
            "cell_count": len(features),
            "total_points": sum(f["properties"]["point_count"] for f in features)
        }
    }

@router.get("/categories")
async def get_available_categories():
    """利用可能なカテゴリ一覧の取得"""
    
    query = """
    SELECT 
        category,
        COUNT(*) as point_count,
        AVG(intensity) as avg_intensity
    FROM heatmap_points
    GROUP BY category
    ORDER BY point_count DESC
    """
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(query))
        rows = result.mappings().all()
    
    return {
        "categories": [
            {
                "name": row["category"],
                "point_count": row["point_count"],
                "avg_intensity": float(row["avg_intensity"])
            }
            for row in rows
        ]
    }
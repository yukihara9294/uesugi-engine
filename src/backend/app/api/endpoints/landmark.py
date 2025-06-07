"""
ランドマークデータAPI
"""

from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.models.heatmap import LandmarkData
from app.schemas.landmark import (
    LandmarkResponse,
    LandmarkListResponse,
    LandmarkStatistics,
    LandmarkSearchParams
)

router = APIRouter()


@router.get("/list", response_model=LandmarkListResponse)
async def get_landmarks(
    north: float = Query(..., description="北端の緯度"),
    south: float = Query(..., description="南端の緯度"),
    east: float = Query(..., description="東端の経度"),
    west: float = Query(..., description="西端の経度"),
    landmark_type: Optional[str] = Query(None, description="ランドマークタイプ"),
    q: Optional[str] = Query(None, description="検索キーワード"),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0, description="最低評価"),
    min_popularity: Optional[float] = Query(None, ge=0.0, le=1.0, description="最低人気度"),
    is_benchmark: Optional[bool] = Query(None, description="ベンチマーク施設のみ"),
    limit: int = Query(50, ge=1, le=200, description="最大取得件数"),
    db: AsyncSession = Depends(get_db)
):
    """指定エリア内のランドマークを取得"""
    try:
        # クエリ構築
        query = select(LandmarkData).where(
            and_(
                func.ST_Within(
                    LandmarkData.location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                ),
                LandmarkData.is_active == True
            )
        )
        
        # フィルター適用
        if landmark_type:
            query = query.where(LandmarkData.landmark_type == landmark_type)
        
        if q:
            search_pattern = f"%{q}%"
            query = query.where(
                or_(
                    LandmarkData.name.ilike(search_pattern),
                    LandmarkData.name_en.ilike(search_pattern),
                    LandmarkData.description.ilike(search_pattern)
                )
            )
        
        if min_rating is not None:
            query = query.where(LandmarkData.rating >= min_rating)
        
        if min_popularity is not None:
            query = query.where(LandmarkData.popularity_score >= min_popularity)
        
        if is_benchmark is not None:
            query = query.where(LandmarkData.is_benchmark == is_benchmark)
        
        # 人気度順でソート
        query = query.order_by(LandmarkData.popularity_score.desc()).limit(limit)
        
        # 実行
        result = await db.execute(query)
        landmarks = result.scalars().all()
        
        # GeoJSON形式に変換
        features = []
        for landmark in landmarks:
            # 座標を取得
            coords = await db.execute(
                select(
                    func.ST_X(LandmarkData.location),
                    func.ST_Y(LandmarkData.location)
                ).where(LandmarkData.id == landmark.id)
            )
            coord_result = coords.first()
            lon, lat = coord_result[0], coord_result[1]
            
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "properties": {
                    "id": str(landmark.id),
                    "name": landmark.name,
                    "name_en": landmark.name_en,
                    "landmark_type": landmark.landmark_type,
                    "description": landmark.description,
                    "address": landmark.address,
                    "phone": landmark.phone,
                    "website": landmark.website,
                    "popularity_score": landmark.popularity_score,
                    "rating": landmark.rating,
                    "review_count": landmark.review_count,
                    "opening_hours": landmark.opening_hours,
                    "price_range": landmark.price_range,
                    "is_benchmark": landmark.is_benchmark,
                    "created_at": landmark.created_at.isoformat() if landmark.created_at else None
                }
            })
        
        # 統計情報
        metadata = {
            "total_landmarks": len(features),
            "bounds": {
                "north": north,
                "south": south,
                "east": east,
                "west": west
            },
            "query_params": {
                "landmark_type": landmark_type,
                "search_keyword": q,
                "min_rating": min_rating,
                "min_popularity": min_popularity,
                "is_benchmark": is_benchmark
            }
        }
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Error getting landmarks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{landmark_id}", response_model=LandmarkResponse)
async def get_landmark_by_id(
    landmark_id: str,
    db: AsyncSession = Depends(get_db)
):
    """特定のランドマーク情報を取得"""
    try:
        # ランドマーク取得
        query = select(LandmarkData).where(
            and_(
                LandmarkData.id == landmark_id,
                LandmarkData.is_active == True
            )
        )
        
        result = await db.execute(query)
        landmark = result.scalar_one_or_none()
        
        if not landmark:
            raise HTTPException(status_code=404, detail="Landmark not found")
        
        # 座標を取得
        coords = await db.execute(
            select(
                func.ST_X(LandmarkData.location),
                func.ST_Y(LandmarkData.location)
            ).where(LandmarkData.id == landmark.id)
        )
        coord_result = coords.first()
        lon, lat = coord_result[0], coord_result[1]
        
        return {
            "id": str(landmark.id),
            "name": landmark.name,
            "name_en": landmark.name_en,
            "landmark_type": landmark.landmark_type,
            "location": {
                "lat": lat,
                "lon": lon
            },
            "description": landmark.description,
            "address": landmark.address,
            "phone": landmark.phone,
            "website": landmark.website,
            "popularity_score": landmark.popularity_score,
            "rating": landmark.rating,
            "review_count": landmark.review_count,
            "opening_hours": landmark.opening_hours,
            "price_range": landmark.price_range,
            "is_benchmark": landmark.is_benchmark,
            "created_at": landmark.created_at,
            "updated_at": landmark.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting landmark by id: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/statistics/summary", response_model=LandmarkStatistics)
async def get_landmark_statistics(
    north: Optional[float] = Query(None, description="北端の緯度"),
    south: Optional[float] = Query(None, description="南端の緯度"),
    east: Optional[float] = Query(None, description="東端の経度"),
    west: Optional[float] = Query(None, description="西端の経度"),
    db: AsyncSession = Depends(get_db)
):
    """ランドマーク統計情報を取得"""
    try:
        # 基本クエリ
        base_query = select(LandmarkData).where(LandmarkData.is_active == True)
        
        # エリア指定がある場合
        if all([north, south, east, west]):
            base_query = base_query.where(
                func.ST_Within(
                    LandmarkData.location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                )
            )
        
        # 全ランドマーク数
        total_query = select(func.count(LandmarkData.id)).select_from(base_query.subquery())
        total_result = await db.execute(total_query)
        total_landmarks = total_result.scalar()
        
        # タイプ別集計
        type_query = select(
            LandmarkData.landmark_type,
            func.count(LandmarkData.id).label('count')
        ).where(LandmarkData.is_active == True)
        
        if all([north, south, east, west]):
            type_query = type_query.where(
                func.ST_Within(
                    LandmarkData.location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                )
            )
        
        type_query = type_query.group_by(LandmarkData.landmark_type)
        type_result = await db.execute(type_query)
        type_counts = {row.landmark_type: row.count for row in type_result}
        
        # 平均評価
        rating_query = select(
            func.avg(LandmarkData.rating).label('avg_rating'),
            func.sum(LandmarkData.review_count).label('total_reviews')
        ).where(
            and_(
                LandmarkData.is_active == True,
                LandmarkData.rating.isnot(None)
            )
        )
        
        if all([north, south, east, west]):
            rating_query = rating_query.where(
                func.ST_Within(
                    LandmarkData.location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                )
            )
        
        rating_result = await db.execute(rating_query)
        rating_data = rating_result.first()
        
        # ベンチマーク施設数
        benchmark_query = select(func.count(LandmarkData.id)).where(
            and_(
                LandmarkData.is_active == True,
                LandmarkData.is_benchmark == True
            )
        )
        
        if all([north, south, east, west]):
            benchmark_query = benchmark_query.where(
                func.ST_Within(
                    LandmarkData.location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                )
            )
        
        benchmark_result = await db.execute(benchmark_query)
        benchmark_count = benchmark_result.scalar()
        
        return {
            "total_landmarks": total_landmarks or 0,
            "landmarks_by_type": type_counts,
            "average_rating": float(rating_data.avg_rating) if rating_data.avg_rating else 0.0,
            "total_reviews": rating_data.total_reviews or 0,
            "benchmark_landmarks": benchmark_count or 0
        }
        
    except Exception as e:
        logger.error(f"Error getting landmark statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nearby/{lat}/{lon}")
async def get_nearby_landmarks(
    lat: float,
    lon: float,
    radius: float = Query(1000, description="検索半径（メートル）"),
    landmark_type: Optional[str] = Query(None, description="ランドマークタイプ"),
    limit: int = Query(10, ge=1, le=50, description="最大取得件数"),
    db: AsyncSession = Depends(get_db)
):
    """指定地点の近くのランドマークを取得"""
    try:
        # 距離計算を含むクエリ
        point = func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326)
        distance = func.ST_Distance(
            func.ST_Transform(LandmarkData.location, 3857),
            func.ST_Transform(point, 3857)
        )
        
        query = select(
            LandmarkData,
            distance.label('distance')
        ).where(
            and_(
                LandmarkData.is_active == True,
                distance <= radius
            )
        )
        
        if landmark_type:
            query = query.where(LandmarkData.landmark_type == landmark_type)
        
        # 距離順でソート
        query = query.order_by('distance').limit(limit)
        
        result = await db.execute(query)
        landmarks_with_distance = result.all()
        
        # レスポンス形式に変換
        nearby_landmarks = []
        for landmark, distance_m in landmarks_with_distance:
            # 座標を取得
            coords = await db.execute(
                select(
                    func.ST_X(LandmarkData.location),
                    func.ST_Y(LandmarkData.location)
                ).where(LandmarkData.id == landmark.id)
            )
            coord_result = coords.first()
            landmark_lon, landmark_lat = coord_result[0], coord_result[1]
            
            nearby_landmarks.append({
                "id": str(landmark.id),
                "name": landmark.name,
                "name_en": landmark.name_en,
                "landmark_type": landmark.landmark_type,
                "location": {
                    "lat": landmark_lat,
                    "lon": landmark_lon
                },
                "distance": round(distance_m, 2),
                "popularity_score": landmark.popularity_score,
                "rating": landmark.rating,
                "is_benchmark": landmark.is_benchmark
            })
        
        return {
            "center": {
                "lat": lat,
                "lon": lon
            },
            "radius": radius,
            "total_found": len(nearby_landmarks),
            "landmarks": nearby_landmarks
        }
        
    except Exception as e:
        logger.error(f"Error getting nearby landmarks: {e}")
        raise HTTPException(status_code=500, detail=str(e))
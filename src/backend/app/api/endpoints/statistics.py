"""
統計データAPI
ヒートマップデータの集計・分析機能
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from app.core.database import AsyncSessionLocal
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

class CategoryStats(BaseModel):
    """カテゴリ統計"""
    category: str
    point_count: int
    avg_intensity: float
    avg_sentiment: float
    percentage: float

class TimeSeriesPoint(BaseModel):
    """時系列データポイント"""
    timestamp: datetime
    count: int
    avg_intensity: float
    avg_sentiment: float

class LandmarkStats(BaseModel):
    """ランドマーク統計"""
    landmark: str
    latitude: float
    longitude: float
    point_count: int
    avg_intensity: float
    dominant_category: str

class StatsSummary(BaseModel):
    """統計サマリー"""
    total_points: int
    time_range: Dict[str, datetime]
    category_breakdown: List[CategoryStats]
    sentiment_distribution: Dict[str, int]
    peak_hours: List[int]

@router.get("/summary", response_model=StatsSummary)
async def get_statistics_summary(
    start_time: Optional[datetime] = Query(None, description="開始時刻"),
    end_time: Optional[datetime] = Query(None, description="終了時刻"),
    categories: Optional[str] = Query(None, description="フィルタするカテゴリ")
):
    """統計サマリーの取得"""
    
    # デフォルト時間範囲（過去7日間）
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    # 基本クエリ条件
    where_conditions = ["timestamp BETWEEN :start_time AND :end_time"]
    params = {"start_time": start_time, "end_time": end_time}
    
    # カテゴリフィルタ
    if categories:
        category_list = [cat.strip() for cat in categories.split(",")]
        placeholders = ",".join([f":cat_{i}" for i in range(len(category_list))])
        where_conditions.append(f"category IN ({placeholders})")
        for i, cat in enumerate(category_list):
            params[f"cat_{i}"] = cat
    
    where_clause = " AND ".join(where_conditions)
    
    # 1. 総ポイント数
    total_query = text(f"SELECT COUNT(*) as total FROM heatmap_points WHERE {where_clause}")
    async with AsyncSessionLocal() as session:
        result = await session.execute(total_query, params)
        total_result = result.mappings().first()
        total_points = total_result["total"] if total_result else 0
    
    # 2. カテゴリ別統計
    category_query = f"""
    SELECT 
        category,
        COUNT(*) as point_count,
        AVG(intensity) as avg_intensity,
        AVG(sentiment_score) as avg_sentiment,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM heatmap_points WHERE {where_clause}) as percentage
    FROM heatmap_points 
    WHERE {where_clause}
    GROUP BY category
    ORDER BY point_count DESC
    """
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(category_query), params)
        category_results = result.mappings().all()
    category_breakdown = [
        CategoryStats(
            category=row["category"],
            point_count=row["point_count"],
            avg_intensity=float(row["avg_intensity"]) if row["avg_intensity"] else 0,
            avg_sentiment=float(row["avg_sentiment"]) if row["avg_sentiment"] else 0,
            percentage=float(row["percentage"]) if row["percentage"] else 0
        )
        for row in category_results
    ]
    
    # 3. 感情分布
    sentiment_query = f"""
    SELECT 
        CASE 
            WHEN sentiment_score >= 0.3 THEN 'positive'
            WHEN sentiment_score <= -0.3 THEN 'negative'
            ELSE 'neutral'
        END as sentiment_category,
        COUNT(*) as count
    FROM heatmap_points 
    WHERE {where_clause} AND sentiment_score IS NOT NULL
    GROUP BY sentiment_category
    """
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(sentiment_query), params)
        sentiment_results = result.mappings().all()
    sentiment_distribution = {
        row["sentiment_category"]: row["count"] 
        for row in sentiment_results
    }
    
    # 4. ピーク時間帯
    peak_hours_query = f"""
    SELECT 
        EXTRACT(hour FROM timestamp) as hour,
        COUNT(*) as count
    FROM heatmap_points 
    WHERE {where_clause}
    GROUP BY hour
    ORDER BY count DESC
    LIMIT 5
    """
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(text(peak_hours_query), params)
        peak_results = result.mappings().all()
    peak_hours = [int(row["hour"]) for row in peak_results]
    
    return StatsSummary(
        total_points=total_points,
        time_range={"start": start_time, "end": end_time},
        category_breakdown=category_breakdown,
        sentiment_distribution=sentiment_distribution,
        peak_hours=peak_hours
    )

@router.get("/timeseries")
async def get_timeseries_data(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    interval: str = Query("1hour", description="集計間隔: 1hour, 6hours, 1day"),
    categories: Optional[str] = Query(None)
):
    """時系列データの取得"""
    
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    # 間隔設定
    interval_mapping = {
        "1hour": "1 hour",
        "6hours": "6 hours", 
        "1day": "1 day",
        "1week": "1 week"
    }
    
    pg_interval = interval_mapping.get(interval, "1 hour")
    
    # ベースクエリ
    where_conditions = ["timestamp BETWEEN :start_time AND :end_time"]
    params = {"start_time": start_time, "end_time": end_time}
    
    if categories:
        category_list = [cat.strip() for cat in categories.split(",")]
        placeholders = ",".join([f":cat_{i}" for i in range(len(category_list))])
        where_conditions.append(f"category IN ({placeholders})")
        for i, cat in enumerate(category_list):
            params[f"cat_{i}"] = cat
    
    where_clause = " AND ".join(where_conditions)
    
    query = f"""
    SELECT 
        date_trunc('{pg_interval.split()[1]}', timestamp) as time_bucket,
        COUNT(*) as count,
        AVG(intensity) as avg_intensity,
        AVG(sentiment_score) as avg_sentiment
    FROM heatmap_points
    WHERE {where_clause}
    GROUP BY time_bucket
    ORDER BY time_bucket
    """
    
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(query), params)
            rows = result.mappings().all()
        
        timeseries = [
            TimeSeriesPoint(
                timestamp=row["time_bucket"],
                count=row["count"],
                avg_intensity=float(row["avg_intensity"]) if row["avg_intensity"] else 0,
                avg_sentiment=float(row["avg_sentiment"]) if row["avg_sentiment"] else 0
            )
            for row in rows
        ]
        
        return {
            "timeseries": timeseries,
            "interval": interval,
            "total_points": sum(t.count for t in timeseries)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"時系列データの取得に失敗しました: {str(e)}")

@router.get("/landmarks")
async def get_landmark_statistics(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    radius: float = Query(500, description="ランドマーク周辺の検索半径（メートル）")
):
    """ランドマーク周辺の統計"""
    
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    query = """
    SELECT 
        l.name as landmark,
        ST_X(l.location) as longitude,
        ST_Y(l.location) as latitude,
        COUNT(h.id) as point_count,
        AVG(h.intensity) as avg_intensity,
        mode() WITHIN GROUP (ORDER BY h.category) as dominant_category
    FROM landmark_data l
    LEFT JOIN heatmap_points h ON ST_DWithin(l.location, h.location, :radius)
    WHERE l.is_benchmark = true
        AND (h.timestamp IS NULL OR h.timestamp BETWEEN :start_time AND :end_time)
    GROUP BY l.id, l.name, l.location
    ORDER BY point_count DESC
    """
    
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(query), {
                "radius": radius,
                "start_time": start_time,
                "end_time": end_time
            })
            rows = result.mappings().all()
        
        landmarks = [
            LandmarkStats(
                landmark=row["landmark"],
                latitude=row["latitude"],
                longitude=row["longitude"],
                point_count=row["point_count"],
                avg_intensity=float(row["avg_intensity"]) if row["avg_intensity"] else 0,
                dominant_category=row["dominant_category"] or "未分類"
            )
            for row in rows
        ]
        
        return {
            "landmarks": landmarks,
            "search_radius": radius,
            "time_range": {"start": start_time, "end": end_time}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ランドマーク統計の取得に失敗しました: {str(e)}")

@router.get("/sentiment-analysis")
async def get_sentiment_analysis(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    categories: Optional[str] = Query(None),
    landmarks: Optional[str] = Query(None, description="ランドマーク名（カンマ区切り）")
):
    """感情分析結果の詳細"""
    
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    where_conditions = [
        "timestamp BETWEEN :start_time AND :end_time",
        "sentiment_score IS NOT NULL"
    ]
    params = {"start_time": start_time, "end_time": end_time}
    
    # フィルタ条件の追加
    if categories:
        category_list = [cat.strip() for cat in categories.split(",")]
        placeholders = ",".join([f":cat_{i}" for i in range(len(category_list))])
        where_conditions.append(f"category IN ({placeholders})")
        for i, cat in enumerate(category_list):
            params[f"cat_{i}"] = cat
    
    # ランドマークフィルタ（メタデータから）
    if landmarks:
        landmark_list = [lm.strip() for lm in landmarks.split(",")]
        landmark_conditions = []
        for i, landmark in enumerate(landmark_list):
            landmark_conditions.append(f"metadata_json->>'landmark' = :landmark_{i}")
            params[f"landmark_{i}"] = landmark
        if landmark_conditions:
            where_conditions.append(f"({' OR '.join(landmark_conditions)})")
    
    where_clause = " AND ".join(where_conditions)
    
    # 感情スコア分布
    distribution_query = f"""
    SELECT 
        CASE 
            WHEN sentiment_score >= 0.6 THEN 'very_positive'
            WHEN sentiment_score >= 0.2 THEN 'positive'
            WHEN sentiment_score >= -0.2 THEN 'neutral'
            WHEN sentiment_score >= -0.6 THEN 'negative'
            ELSE 'very_negative'
        END as sentiment_level,
        COUNT(*) as count,
        AVG(sentiment_score) as avg_score
    FROM heatmap_points
    WHERE {where_clause}
    GROUP BY sentiment_level
    ORDER BY avg_score DESC
    """
    
    # カテゴリ別感情
    category_sentiment_query = f"""
    SELECT 
        category,
        AVG(sentiment_score) as avg_sentiment,
        STDDEV(sentiment_score) as sentiment_stddev,
        COUNT(*) as count
    FROM heatmap_points
    WHERE {where_clause}
    GROUP BY category
    ORDER BY avg_sentiment DESC
    """
    
    try:
        async with AsyncSessionLocal() as session:
            dist_result = await session.execute(text(distribution_query), params)
            distribution_results = dist_result.mappings().all()
            
            cat_result = await session.execute(text(category_sentiment_query), params)
            category_results = cat_result.mappings().all()
        
        sentiment_distribution = [
            {
                "level": row["sentiment_level"],
                "count": row["count"],
                "avg_score": float(row["avg_score"]) if row["avg_score"] else 0
            }
            for row in distribution_results
        ]
        
        category_sentiment = [
            {
                "category": row["category"],
                "avg_sentiment": float(row["avg_sentiment"]) if row["avg_sentiment"] else 0,
                "sentiment_stddev": float(row["sentiment_stddev"]) if row["sentiment_stddev"] else 0,
                "count": row["count"]
            }
            for row in category_results
        ]
        
        return {
            "sentiment_distribution": sentiment_distribution,
            "category_sentiment": category_sentiment,
            "total_analyzed": sum(item["count"] for item in sentiment_distribution),
            "filters": {
                "categories": categories.split(",") if categories else None,
                "landmarks": landmarks.split(",") if landmarks else None
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"感情分析データの取得に失敗しました: {str(e)}")

@router.get("/hourly-patterns")
async def get_hourly_patterns(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    categories: Optional[str] = Query(None)
):
    """時間帯別パターン分析"""
    
    if not end_time:
        end_time = datetime.now()
    if not start_time:
        start_time = end_time - timedelta(days=7)
    
    where_conditions = ["timestamp BETWEEN :start_time AND :end_time"]
    params = {"start_time": start_time, "end_time": end_time}
    
    if categories:
        category_list = [cat.strip() for cat in categories.split(",")]
        placeholders = ",".join([f":cat_{i}" for i in range(len(category_list))])
        where_conditions.append(f"category IN ({placeholders})")
        for i, cat in enumerate(category_list):
            params[f"cat_{i}"] = cat
    
    where_clause = " AND ".join(where_conditions)
    
    query = f"""
    SELECT 
        EXTRACT(hour FROM timestamp) as hour,
        category,
        COUNT(*) as count,
        AVG(intensity) as avg_intensity,
        AVG(sentiment_score) as avg_sentiment
    FROM heatmap_points
    WHERE {where_clause}
    GROUP BY hour, category
    ORDER BY hour, count DESC
    """
    
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text(query), params)
            rows = result.mappings().all()
        
        # 時間帯別にグループ化
        hourly_patterns = {}
        for row in rows:
            hour = int(row["hour"])
            if hour not in hourly_patterns:
                hourly_patterns[hour] = []
            
            hourly_patterns[hour].append({
                "category": row["category"],
                "count": row["count"],
                "avg_intensity": float(row["avg_intensity"]) if row["avg_intensity"] else 0,
                "avg_sentiment": float(row["avg_sentiment"]) if row["avg_sentiment"] else 0
            })
        
        return {
            "hourly_patterns": hourly_patterns,
            "peak_hours": sorted(hourly_patterns.keys(), 
                               key=lambda h: sum(item["count"] for item in hourly_patterns[h]), 
                               reverse=True)[:5]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"時間帯パターンの取得に失敗しました: {str(e)}")
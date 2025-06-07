"""
人流データAPI
"""

from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from loguru import logger

from app.core.database import get_db
from app.models.mobility import MobilityFlow, AccommodationData, ConsumptionData
from app.schemas.mobility import (
    MobilityFlowResponse, 
    AccommodationResponse,
    ConsumptionResponse,
    MobilityHeatmapResponse
)

router = APIRouter()


@router.get("/flows", response_model=MobilityFlowResponse)
async def get_mobility_flows(
    north: float = Query(..., description="北端の緯度"),
    south: float = Query(..., description="南端の緯度"),
    east: float = Query(..., description="東端の経度"),
    west: float = Query(..., description="西端の経度"),
    start_time: datetime = Query(None, description="開始時刻"),
    end_time: datetime = Query(None, description="終了時刻"),
    flow_type: Optional[str] = Query(None, description="移動タイプ"),
    transport_mode: Optional[str] = Query(None, description="交通手段"),
    min_flow_count: int = Query(100, description="最小移動人数"),
    limit: int = Query(50, description="最大件数"),
    db: AsyncSession = Depends(get_db)
):
    """指定エリア・時間の人流データを取得"""
    try:
        # デフォルト時間範囲（24時間）
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(hours=24)
        
        # クエリ構築（主要ルートのみ取得）
        query = select(MobilityFlow).where(
            and_(
                MobilityFlow.timestamp >= start_time,
                MobilityFlow.timestamp <= end_time,
                func.ST_Within(
                    MobilityFlow.origin_location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                ),
                MobilityFlow.flow_count >= min_flow_count  # 最小移動人数でフィルタ
            )
        )
        
        if flow_type:
            query = query.where(MobilityFlow.flow_type == flow_type)
        if transport_mode:
            query = query.where(MobilityFlow.transport_mode == transport_mode)
        
        # 移動人数の多い順にソートして上位のみ取得
        query = query.order_by(MobilityFlow.flow_count.desc()).limit(limit)
        
        # 実行
        result = await db.execute(query)
        flows = result.scalars().all()
        
        # GeoJSON形式に変換
        features = []
        for flow in flows:
            # 起点と終点の座標を取得
            origin_coords = await db.execute(
                select(
                    func.ST_X(MobilityFlow.origin_location),
                    func.ST_Y(MobilityFlow.origin_location)
                ).where(MobilityFlow.id == flow.id)
            )
            origin_result = origin_coords.first()
            origin_lon, origin_lat = origin_result[0], origin_result[1]
            
            dest_coords = await db.execute(
                select(
                    func.ST_X(MobilityFlow.destination_location),
                    func.ST_Y(MobilityFlow.destination_location)
                ).where(MobilityFlow.id == flow.id)
            )
            dest_result = dest_coords.first()
            dest_lon, dest_lat = dest_result[0], dest_result[1]
            
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [origin_lon, origin_lat],
                        [dest_lon, dest_lat]
                    ]
                },
                "properties": {
                    "id": str(flow.id),
                    "timestamp": flow.timestamp.isoformat(),
                    "flow_count": flow.flow_count,
                    "flow_type": flow.flow_type,
                    "transport_mode": flow.transport_mode,
                    "origin_area": flow.origin_area,
                    "destination_area": flow.destination_area,
                    "tourist_ratio": flow.tourist_ratio,
                    "confidence": flow.confidence
                }
            })
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "total_flows": len(features),
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting mobility flows: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/heatmap", response_model=MobilityHeatmapResponse)
async def get_mobility_heatmap(
    north: float = Query(..., description="北端の緯度"),
    south: float = Query(..., description="南端の緯度"),
    east: float = Query(..., description="東端の経度"),
    west: float = Query(..., description="西端の経度"),
    timestamp: datetime = Query(None, description="対象時刻"),
    resolution: int = Query(20, description="グリッド解像度"),
    db: AsyncSession = Depends(get_db)
):
    """人流密度ヒートマップデータを取得"""
    try:
        if not timestamp:
            timestamp = datetime.utcnow()
        
        # 1時間の範囲でデータを集計
        start_time = timestamp - timedelta(minutes=30)
        end_time = timestamp + timedelta(minutes=30)
        
        # エリア内の人流を集計
        query = select(
            MobilityFlow.origin_location,
            func.sum(MobilityFlow.flow_count).label('total_flow')
        ).where(
            and_(
                MobilityFlow.timestamp >= start_time,
                MobilityFlow.timestamp <= end_time,
                func.ST_Within(
                    MobilityFlow.origin_location,
                    func.ST_MakeEnvelope(west, south, east, north, 4326)
                )
            )
        ).group_by(MobilityFlow.origin_location)
        
        result = await db.execute(query)
        points = result.all()
        
        # ヒートマップ用のポイントデータ生成
        features = []
        max_flow = max([p.total_flow for p in points]) if points else 1
        
        for point in points:
            coords = await db.execute(
                select(
                    func.ST_X(point.origin_location),
                    func.ST_Y(point.origin_location)
                )
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
                    "density": point.total_flow / max_flow,
                    "flow_count": point.total_flow
                }
            })
        
        return {
            "type": "FeatureCollection",
            "features": features,
            "metadata": {
                "timestamp": timestamp.isoformat(),
                "max_flow": max_flow,
                "total_points": len(features)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting mobility heatmap: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/accommodation", response_model=AccommodationResponse)
async def get_accommodation_data(
    date: datetime = Query(None, description="対象日"),
    area: Optional[str] = Query(None, description="エリア"),
    facility_type: Optional[str] = Query(None, description="施設タイプ"),
    db: AsyncSession = Depends(get_db)
):
    """宿泊データを取得"""
    try:
        if not date:
            date = datetime.utcnow().date()
        
        # クエリ構築
        query = select(AccommodationData).where(
            func.date(AccommodationData.date) == date
        )
        
        if area:
            query = query.where(AccommodationData.area == area)
        if facility_type:
            query = query.where(AccommodationData.facility_type == facility_type)
        
        result = await db.execute(query)
        accommodations = result.scalars().all()
        
        # 集計データ
        total_rooms = sum(a.total_rooms or 0 for a in accommodations)
        occupied_rooms = sum(a.occupied_rooms or 0 for a in accommodations)
        total_guests = sum(a.total_guests or 0 for a in accommodations)
        
        # 施設ごとのデータ
        facilities = []
        for acc in accommodations:
            coords = await db.execute(
                select(
                    func.ST_X(acc.location),
                    func.ST_Y(acc.location)
                ).where(AccommodationData.id == acc.id)
            )
            coord_result = coords.first()
            lon, lat = coord_result[0], coord_result[1]
            
            facilities.append({
                "facility_id": acc.facility_id,
                "facility_name": acc.facility_name,
                "facility_type": acc.facility_type,
                "location": {"lat": lat, "lon": lon},
                "area": acc.area,
                "occupancy_rate": acc.occupancy_rate,
                "total_guests": acc.total_guests,
                "average_price": acc.average_price,
                "domestic_ratio": (acc.domestic_guests / acc.total_guests) if acc.total_guests else 0
            })
        
        return {
            "date": date.isoformat(),
            "summary": {
                "total_facilities": len(facilities),
                "total_rooms": total_rooms,
                "occupied_rooms": occupied_rooms,
                "overall_occupancy_rate": occupied_rooms / total_rooms if total_rooms else 0,
                "total_guests": total_guests
            },
            "facilities": facilities
        }
        
    except Exception as e:
        logger.error(f"Error getting accommodation data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/consumption", response_model=ConsumptionResponse)
async def get_consumption_data(
    start_time: datetime = Query(None, description="開始時刻"),
    end_time: datetime = Query(None, description="終了時刻"),
    area: Optional[str] = Query(None, description="エリア"),
    store_category: Optional[str] = Query(None, description="店舗カテゴリ"),
    db: AsyncSession = Depends(get_db)
):
    """消費データを取得"""
    try:
        if not end_time:
            end_time = datetime.utcnow()
        if not start_time:
            start_time = end_time - timedelta(hours=24)
        
        # クエリ構築
        query = select(ConsumptionData).where(
            and_(
                ConsumptionData.timestamp >= start_time,
                ConsumptionData.timestamp <= end_time
            )
        )
        
        if area:
            query = query.where(ConsumptionData.area == area)
        if store_category:
            query = query.where(ConsumptionData.store_category == store_category)
        
        result = await db.execute(query)
        consumptions = result.scalars().all()
        
        # カテゴリ別集計
        category_summary = {}
        area_summary = {}
        hourly_trend = {}
        
        for cons in consumptions:
            # カテゴリ別
            if cons.store_category not in category_summary:
                category_summary[cons.store_category] = {
                    "transaction_count": 0,
                    "total_amount": 0
                }
            category_summary[cons.store_category]["transaction_count"] += cons.transaction_count or 0
            category_summary[cons.store_category]["total_amount"] += cons.total_amount or 0
            
            # エリア別
            if cons.area not in area_summary:
                area_summary[cons.area] = {
                    "transaction_count": 0,
                    "total_amount": 0
                }
            area_summary[cons.area]["transaction_count"] += cons.transaction_count or 0
            area_summary[cons.area]["total_amount"] += cons.total_amount or 0
            
            # 時間帯別
            hour = cons.timestamp.hour
            if hour not in hourly_trend:
                hourly_trend[hour] = {
                    "transaction_count": 0,
                    "total_amount": 0
                }
            hourly_trend[hour]["transaction_count"] += cons.transaction_count or 0
            hourly_trend[hour]["total_amount"] += cons.total_amount or 0
        
        # 店舗データ
        stores = []
        for cons in consumptions[:50]:  # 上位50店舗
            coords = await db.execute(
                select(
                    func.ST_X(cons.location),
                    func.ST_Y(cons.location)
                ).where(ConsumptionData.id == cons.id)
            )
            coord_result = coords.first()
            lon, lat = coord_result[0], coord_result[1]
            
            stores.append({
                "store_id": cons.store_id,
                "store_name": cons.store_name,
                "store_category": cons.store_category,
                "location": {"lat": lat, "lon": lon},
                "area": cons.area,
                "transaction_count": cons.transaction_count,
                "total_amount": cons.total_amount,
                "average_amount": cons.average_amount,
                "tourist_ratio": cons.tourist_ratio
            })
        
        return {
            "period": {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat()
            },
            "summary": {
                "total_transactions": sum(c["transaction_count"] for c in category_summary.values()),
                "total_amount": sum(c["total_amount"] for c in category_summary.values()),
                "category_breakdown": category_summary,
                "area_breakdown": area_summary,
                "hourly_trend": hourly_trend
            },
            "top_stores": stores
        }
        
    except Exception as e:
        logger.error(f"Error getting consumption data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
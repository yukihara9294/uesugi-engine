"""
人流・宿泊・消費データのスキーマ定義
"""

from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime


# 人流データ
class MobilityFlowResponse(BaseModel):
    """人流データレスポンス"""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class MobilityHeatmapResponse(BaseModel):
    """人流ヒートマップレスポンス"""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]
    metadata: Dict[str, Any]


# 宿泊データ
class FacilityData(BaseModel):
    """施設データ"""
    facility_id: str
    facility_name: str
    facility_type: str
    location: Dict[str, float]
    area: str
    occupancy_rate: float
    total_guests: int
    average_price: float
    domestic_ratio: float


class AccommodationSummary(BaseModel):
    """宿泊サマリー"""
    total_facilities: int
    total_rooms: int
    occupied_rooms: int
    overall_occupancy_rate: float
    total_guests: int


class AccommodationResponse(BaseModel):
    """宿泊データレスポンス"""
    date: str
    summary: AccommodationSummary
    facilities: List[FacilityData]


# 消費データ
class StoreData(BaseModel):
    """店舗データ"""
    store_id: str
    store_name: str
    store_category: str
    location: Dict[str, float]
    area: str
    transaction_count: int
    total_amount: float
    average_amount: float
    tourist_ratio: float


class ConsumptionSummary(BaseModel):
    """消費サマリー"""
    total_transactions: int
    total_amount: float
    category_breakdown: Dict[str, Dict[str, float]]
    area_breakdown: Dict[str, Dict[str, float]]
    hourly_trend: Dict[int, Dict[str, float]]


class ConsumptionResponse(BaseModel):
    """消費データレスポンス"""
    period: Dict[str, str]
    summary: ConsumptionSummary
    top_stores: List[StoreData]
"""
ランドマークデータのスキーマ定義
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime


class LandmarkBase(BaseModel):
    """ランドマーク基本スキーマ"""
    name: str
    name_en: Optional[str] = None
    landmark_type: str
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    popularity_score: float = Field(default=0.0, ge=0.0, le=1.0)
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    review_count: int = 0
    opening_hours: Optional[Dict[str, Any]] = None
    price_range: Optional[str] = None
    is_benchmark: bool = False


class LandmarkLocation(BaseModel):
    """位置情報"""
    lat: float
    lon: float


class LandmarkFeature(BaseModel):
    """GeoJSON Feature形式のランドマーク"""
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]


class LandmarkResponse(BaseModel):
    """単一ランドマークレスポンス"""
    id: str
    name: str
    name_en: Optional[str] = None
    landmark_type: str
    location: LandmarkLocation
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    popularity_score: float
    rating: Optional[float] = None
    review_count: int
    opening_hours: Optional[Dict[str, Any]] = None
    price_range: Optional[str] = None
    is_benchmark: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class LandmarkListResponse(BaseModel):
    """ランドマーク一覧レスポンス（GeoJSON形式）"""
    type: str = "FeatureCollection"
    features: List[LandmarkFeature]
    metadata: Dict[str, Any]


class LandmarkStatistics(BaseModel):
    """ランドマーク統計情報"""
    total_landmarks: int
    landmarks_by_type: Dict[str, int]
    average_rating: float
    total_reviews: int
    benchmark_landmarks: int


class LandmarkSearchParams(BaseModel):
    """ランドマーク検索パラメータ"""
    q: Optional[str] = Field(None, description="検索キーワード")
    landmark_type: Optional[str] = Field(None, description="ランドマークタイプ")
    min_rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="最低評価")
    min_popularity: Optional[float] = Field(None, ge=0.0, le=1.0, description="最低人気度")
    is_benchmark: Optional[bool] = Field(None, description="ベンチマーク施設のみ")
    limit: int = Field(50, ge=1, le=200, description="最大取得件数")
    offset: int = Field(0, ge=0, description="オフセット")
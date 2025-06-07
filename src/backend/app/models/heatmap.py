"""
ヒートマップデータモデル
地理空間データとSNS・気象データの統合モデル
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
import uuid
from app.core.database import Base


class HeatmapPoint(Base):
    """ヒートマップポイントデータ"""
    __tablename__ = "heatmap_points"
    
    # 基本情報
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # 地理情報（PostGIS）
    location = Column(Geometry('POINT', srid=4326), nullable=False, index=True)
    prefecture = Column(String(50), default="広島県")
    city = Column(String(100), nullable=True)
    
    # データソース情報
    data_source = Column(String(50), nullable=False, index=True)  # 'sns', 'weather', 'event', etc.
    source_id = Column(String(200), nullable=True)  # 元データのID
    
    # カテゴリ分類
    category = Column(String(50), nullable=False, index=True)  # '観光', 'グルメ', 'イベント', etc.
    subcategory = Column(String(100), nullable=True)
    
    # 感情・評価データ
    sentiment_score = Column(Float, nullable=True)  # -1.0 to 1.0
    intensity = Column(Float, default=1.0)  # ヒートマップでの強度
    confidence = Column(Float, default=1.0)  # データの信頼度
    
    # テキストデータ
    text_content = Column(Text, nullable=True)
    language = Column(String(10), default="ja")
    
    # メタデータ
    metadata_json = Column(JSON, nullable=True)
    is_verified = Column(Boolean, default=False)
    
    # 分析用フィールド
    user_type = Column(String(20), nullable=True)  # 'local', 'tourist', 'business'
    age_group = Column(String(20), nullable=True)
    
    # 作成・更新時刻
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<HeatmapPoint(id={self.id}, category={self.category}, source={self.data_source})>"


class WeatherData(Base):
    """気象データ"""
    __tablename__ = "weather_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # 地理情報
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    station_id = Column(String(50), nullable=True)
    
    # 気象データ
    temperature = Column(Float, nullable=True)  # 摂氏
    humidity = Column(Float, nullable=True)     # %
    precipitation = Column(Float, nullable=True) # mm
    wind_speed = Column(Float, nullable=True)   # m/s
    wind_direction = Column(Float, nullable=True) # degrees
    pressure = Column(Float, nullable=True)     # hPa
    uv_index = Column(Float, nullable=True)
    visibility = Column(Float, nullable=True)   # km
    
    # 天候状況
    weather_condition = Column(String(100), nullable=True)
    weather_code = Column(String(20), nullable=True)
    
    # データソース
    data_source = Column(String(50), default="openweathermap")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EventData(Base):
    """イベントデータ"""
    __tablename__ = "event_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # イベント基本情報
    event_name = Column(String(200), nullable=False)
    event_type = Column(String(50), nullable=False)  # 'festival', 'concert', 'sports', etc.
    
    # 時間情報
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=True)
    
    # 地理情報
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    venue_name = Column(String(200), nullable=True)
    address = Column(Text, nullable=True)
    
    # イベント詳細
    description = Column(Text, nullable=True)
    organizer = Column(String(200), nullable=True)
    capacity = Column(Integer, nullable=True)
    ticket_price = Column(Float, nullable=True)
    
    # 影響範囲
    influence_radius = Column(Float, default=1000.0)  # meters
    expected_attendance = Column(Integer, nullable=True)
    
    # メタデータ
    official_url = Column(String(500), nullable=True)
    source_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LandmarkData(Base):
    """ランドマーク・POIデータ"""
    __tablename__ = "landmark_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # 基本情報
    name = Column(String(200), nullable=False)
    name_en = Column(String(200), nullable=True)
    landmark_type = Column(String(50), nullable=False)  # 'tourist_spot', 'restaurant', 'hotel', etc.
    
    # 地理情報
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    address = Column(Text, nullable=True)
    
    # 詳細情報
    description = Column(Text, nullable=True)
    phone = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    
    # 評価・人気度
    popularity_score = Column(Float, default=0.0)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, default=0)
    
    # 運営情報
    opening_hours = Column(JSON, nullable=True)
    price_range = Column(String(20), nullable=True)
    
    # データソース
    source = Column(String(50), default="openstreetmap")
    source_id = Column(String(100), nullable=True)
    
    # フラグ
    is_benchmark = Column(Boolean, default=False)  # ベンチマーク施設かどうか
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
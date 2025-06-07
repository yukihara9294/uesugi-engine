"""
人流データモデル
"""

from sqlalchemy import Column, Integer, Float, String, DateTime, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
import uuid
from datetime import datetime

from app.core.database import Base


class MobilityFlow(Base):
    """人流データモデル"""
    __tablename__ = "mobility_flows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # 起点・終点情報
    origin_location = Column(Geometry('POINT', srid=4326), nullable=False)
    destination_location = Column(Geometry('POINT', srid=4326), nullable=False)
    
    # 地域情報
    origin_area = Column(String(100))
    destination_area = Column(String(100))
    
    # 人流データ
    flow_count = Column(Integer, nullable=False)  # 移動人数
    flow_type = Column(String(50))  # 移動タイプ（通勤、観光、買い物など）
    transport_mode = Column(String(50))  # 交通手段（徒歩、車、電車など）
    
    # 属性情報
    age_group = Column(String(20))  # 年齢層
    gender_ratio = Column(Float)  # 男性比率（0-1）
    tourist_ratio = Column(Float)  # 観光客比率（0-1）
    
    # 時間帯情報
    hour_of_day = Column(Integer)
    day_of_week = Column(Integer)
    is_holiday = Column(Integer)
    
    # メタデータ
    data_source = Column(String(50))
    confidence = Column(Float)
    metadata_json = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # インデックス
    __table_args__ = (
        Index('idx_mobility_timestamp_area', 'timestamp', 'origin_area', 'destination_area'),
        Index('idx_mobility_flow_type', 'flow_type'),
    )


class AccommodationData(Base):
    """宿泊データモデル"""
    __tablename__ = "accommodation_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # 施設情報
    facility_id = Column(String(50))
    facility_name = Column(String(200))
    facility_type = Column(String(50))  # ホテル、旅館、民泊など
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    area = Column(String(100))
    
    # 宿泊データ
    total_rooms = Column(Integer)
    occupied_rooms = Column(Integer)
    occupancy_rate = Column(Float)  # 稼働率（0-1）
    
    # 宿泊者属性
    total_guests = Column(Integer)
    domestic_guests = Column(Integer)
    foreign_guests = Column(Integer)
    average_stay_days = Column(Float)
    
    # 価格情報
    average_price = Column(Float)
    price_index = Column(Float)  # 価格指数（前年同期比など）
    
    # メタデータ
    data_source = Column(String(50))
    metadata_json = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # インデックス
    __table_args__ = (
        Index('idx_accommodation_date_area', 'date', 'area'),
        Index('idx_accommodation_facility', 'facility_id'),
    )


class ConsumptionData(Base):
    """消費データモデル"""
    __tablename__ = "consumption_data"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # 店舗・エリア情報
    store_id = Column(String(50))
    store_name = Column(String(200))
    store_category = Column(String(50))  # 飲食、物販、サービスなど
    location = Column(Geometry('POINT', srid=4326), nullable=False)
    area = Column(String(100))
    
    # 消費データ
    transaction_count = Column(Integer)  # 取引件数
    total_amount = Column(Float)  # 総売上額
    average_amount = Column(Float)  # 平均単価
    
    # 消費者属性
    tourist_ratio = Column(Float)  # 観光客比率（0-1）
    age_distribution = Column(JSON)  # 年齢分布
    payment_methods = Column(JSON)  # 支払い方法分布
    
    # カテゴリ別データ
    category_breakdown = Column(JSON)  # カテゴリ別売上
    top_items = Column(JSON)  # 売れ筋商品
    
    # メタデータ
    data_source = Column(String(50))
    metadata_json = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    # インデックス
    __table_args__ = (
        Index('idx_consumption_timestamp_area', 'timestamp', 'area'),
        Index('idx_consumption_store', 'store_id'),
        Index('idx_consumption_category', 'store_category'),
    )
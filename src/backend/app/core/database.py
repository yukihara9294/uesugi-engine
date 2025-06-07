"""
データベース設定と接続管理
SQLAlchemy + PostGIS設定
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
import asyncpg
from app.core.config import settings

# データベースURL
DATABASE_URL = settings.DATABASE_URL

# 非同期エンジンの作成（PostgreSQL用）
ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)

# SQLAlchemy エンジンとセッション
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラス
Base = declarative_base()

# メタデータ
metadata = MetaData()

# 非同期セッションメーカー
AsyncSessionLocal = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def get_database():
    """非同期データベースセッションの取得"""
    async with AsyncSessionLocal() as session:
        yield session

async def create_tables():
    """テーブルの作成"""
    # PostGISエクステンションを有効化（PostgreSQLの場合）
    if "postgresql" in DATABASE_URL:
        try:
            conn = await asyncpg.connect(DATABASE_URL)
            await conn.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            await conn.close()
        except Exception as e:
            print(f"PostGIS extension setup: {e}")
    
    # テーブル作成
    Base.metadata.create_all(bind=engine)

async def get_db():
    """データベースセッションの取得（非同期）"""
    async with AsyncSessionLocal() as session:
        yield session

# データベース接続開始・終了
async def connect_db():
    """データベース接続開始"""
    # SQLAlchemy 2.0では接続プールが自動管理されるため、明示的な接続は不要
    pass

async def disconnect_db():
    """データベース接続終了"""
    # エンジンの破棄
    await async_engine.dispose()
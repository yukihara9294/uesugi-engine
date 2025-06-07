"""
ヘルスチェックエンドポイント
システムの稼働状況確認
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db, AsyncSessionLocal
import time
import psutil
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

@router.get("/")
async def health_check():
    """基本ヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

@router.get("/detailed")
async def detailed_health_check(db: Session = Depends(get_db)):
    """詳細ヘルスチェック"""
    
    # データベース接続チェック
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # システムリソース
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": time.time(),
        "version": "1.0.0",
        "components": {
            "database": db_status,
            "api": "healthy"
        },
        "system": {
            "memory_usage": f"{memory.percent}%",
            "disk_usage": f"{(disk.used / disk.total) * 100:.1f}%",
            "cpu_count": psutil.cpu_count(),
            "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
        }
    }
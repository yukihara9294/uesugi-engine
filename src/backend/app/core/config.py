"""
設定管理
環境変数とアプリケーション設定を管理
"""

import os
from typing import List, Optional
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # 基本設定
    DEBUG: bool = False
    SECRET_KEY: str = "dev_secret_key_change_in_production"
    
    # データベース設定
    DATABASE_URL: str = "sqlite:///./uesugi_heatmap.db"
    
    # Redis設定
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS設定
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # API設定
    OPENWEATHERMAP_API_KEY: Optional[str] = None
    E_STAT_API_KEY: Optional[str] = None
    
    # Phase 1設定
    USE_DUMMY_DATA: bool = True
    DUMMY_DATA_POINTS: int = 1000
    
    # ログ設定
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = None
    
    # API制限設定
    API_RATE_LIMIT: int = 1000
    
    # 広島県設定
    HIROSHIMA_BOUNDS: dict = {
        "north": 34.9,
        "south": 34.0,
        "east": 133.3,
        "west": 132.0
    }
    
    # ベンチマーク施設座標
    LANDMARKS: dict = {
        "原爆ドーム": {"lat": 34.3955, "lon": 132.4536},
        "宮島": {"lat": 34.2965, "lon": 132.3196},
        "広島駅": {"lat": 34.3978, "lon": 132.4751},
        "マツダスタジアム": {"lat": 34.3916, "lon": 132.4848},
        "本通り商店街": {"lat": 34.3935, "lon": 132.4595}
    }
    
    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        raise ValueError("CORS_ORIGINS must be a list or comma-separated string")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# 設定インスタンス
settings = Settings()

# 開発環境での設定確認
if settings.DEBUG:
    print("🔧 Development mode enabled")
    print(f"📍 Landmarks configured: {len(settings.LANDMARKS)}")
    print(f"🌐 CORS origins: {settings.CORS_ORIGINS}")
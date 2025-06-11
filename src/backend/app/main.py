"""
Uesugi Engine - 広島県ソーシャルヒートマップ API
メインアプリケーション
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import uvicorn
from loguru import logger

from app.core.config import settings
from app.core.database import create_tables
from app.api.endpoints import heatmap, weather, statistics, health, mobility, landmark, event, data_management
from app.api.v1 import opendata, real_data
from app.services.dummy_data_generator import generate_initial_data

# アプリケーションの初期化
app = FastAPI(
    title="Uesugi Engine Heatmap API",
    description="広島県ソーシャルヒートマップのバックエンドAPI - データに基づく観光施策支援システム",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ミドルウェアの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.herokuapp.com"]
)

# リクエスト時間計測ミドルウェア
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# ルーターの登録
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(heatmap.router, prefix="/api/v1/heatmap", tags=["heatmap"])
app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
app.include_router(statistics.router, prefix="/api/v1/statistics", tags=["statistics"])
app.include_router(mobility.router, prefix="/api/v1/mobility", tags=["mobility"])
app.include_router(landmark.router, prefix="/api/v1/landmarks", tags=["landmarks"])
app.include_router(event.router, prefix="/api/v1/events", tags=["events"])
app.include_router(opendata.router, prefix="/api/v1/opendata", tags=["opendata"])
app.include_router(real_data.router, prefix="/api/v1/real", tags=["real_data"])
app.include_router(data_management.router, prefix="/api/v1/management", tags=["management"])

# イベントハンドラー
@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    logger.info("🚀 Uesugi Engine API starting up...")
    
    # データベーステーブル作成
    await create_tables()
    logger.info("✅ Database tables created")
    
    # Phase 1: ダミーデータ生成
    if settings.USE_DUMMY_DATA:
        await generate_initial_data()
        logger.info("✅ Dummy data generated")
    
    logger.info("🎉 Uesugi Engine API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    """アプリケーション終了時の処理"""
    logger.info("👋 Uesugi Engine API shutting down...")

# エラーハンドラー
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "指定されたリソースが見つかりません",
            "path": str(request.url.path)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "サーバー内部エラーが発生しました"
        }
    )

# ルートエンドポイント
@app.get("/")
async def root():
    """API情報の取得"""
    return {
        "name": "Uesugi Engine Heatmap API",
        "version": "1.0.0",
        "description": "広島県ソーシャルヒートマップAPI",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "heatmap": "/api/v1/heatmap",
            "weather": "/api/v1/weather",
            "statistics": "/api/v1/statistics",
            "mobility": "/api/v1/mobility",
            "landmarks": "/api/v1/landmarks",
            "events": "/api/v1/events"
        },
        "status": "running"
    }

# 開発サーバー起動
if __name__ == "__main__":
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
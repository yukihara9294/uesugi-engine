"""
Data management API endpoints
Handles data integration tasks including GTFS import
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
from typing import Dict
import subprocess
import sys
import os
from pathlib import Path
from loguru import logger

from app.core.database import get_db
from app.core.config import settings

router = APIRouter()


@router.post("/integrate/gtfs")
async def integrate_gtfs_data(background_tasks: BackgroundTasks):
    """
    Trigger GTFS data integration into PostgreSQL database
    Runs the integration script in the background
    """
    try:
        # Add integration task to background
        background_tasks.add_task(run_gtfs_integration)
        
        return {
            "status": "accepted",
            "message": "GTFS integration started in background",
            "detail": "Check logs for progress"
        }
    except Exception as e:
        logger.error(f"Failed to start GTFS integration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def run_gtfs_integration():
    """Execute GTFS integration script"""
    try:
        logger.info("Starting GTFS integration process...")
        
        # Path to the integration script
        script_path = Path("/app/scripts/integrate_gtfs_to_postgresql.py")
        
        # Check if script exists in the container
        if not script_path.exists():
            # Try alternative location
            script_path = Path("/scripts/integrate_gtfs_to_postgresql.py")
            
        if not script_path.exists():
            logger.error(f"Integration script not found at {script_path}")
            return
            
        # Parse DATABASE_URL to get connection parameters
        from urllib.parse import urlparse
        db_url = urlparse(settings.DATABASE_URL)
        
        # Run the script
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            env={
                **os.environ,
                "POSTGRES_HOST": db_url.hostname or "db",
                "POSTGRES_PORT": str(db_url.port or 5432),
                "POSTGRES_DB": db_url.path.lstrip("/") if db_url.path else "uesugi_heatmap",
                "POSTGRES_USER": db_url.username or "uesugi_user",
                "POSTGRES_PASSWORD": db_url.password or "uesugi_password",
                "DATABASE_URL": settings.DATABASE_URL,
            }
        )
        
        if result.returncode == 0:
            logger.info(f"GTFS integration completed successfully: {result.stdout}")
        else:
            logger.error(f"GTFS integration failed: {result.stderr}")
            
    except Exception as e:
        logger.error(f"Error during GTFS integration: {e}")


@router.get("/integrate/status")
async def get_integration_status():
    """
    Get the status of data integration processes
    """
    # This could be enhanced to track actual job status
    return {
        "status": "ready",
        "available_integrations": ["gtfs"],
        "message": "Integration system is ready"
    }
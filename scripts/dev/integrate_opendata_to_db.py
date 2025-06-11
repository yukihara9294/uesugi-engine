#!/usr/bin/env python3
"""
収集したオープンデータをPostgreSQLデータベースに統合するスクリプト
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'app'))

import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
import asyncpg
from typing import Dict, List
import pandas as pd

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OpenDataIntegrator:
    """オープンデータをデータベースに統合"""
    
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'uesugi_heatmap',
            'user': 'postgres',
            'password': 'postgres'
        }
        self.data_dir = Path("uesugi-engine-data")
        
    async def integrate_all(self):
        """全データを統合"""
        logger.info("=== オープンデータ統合開始 ===")
        
        # 最新の収集結果を読み込み
        latest_result = self._get_latest_collection_result()
        if not latest_result:
            logger.error("収集結果が見つかりません")
            return
            
        # データベース接続
        conn = await asyncpg.connect(**self.db_config)
        
        try:
            # 1. 気象データの統合
            await self._integrate_weather_data(conn, latest_result.get('weather', {}))
            
            # 2. 地震データの統合
            await self._integrate_earthquake_data(conn, latest_result.get('earthquakes', []))
            
            # 3. GTFSデータの統合（URLのみ保存）
            await self._integrate_gtfs_data(conn, latest_result.get('gtfs', {}))
            
            # 4. 環境モニタリングデータの統合
            await self._integrate_environmental_data(conn, latest_result.get('environmental', {}))
            
            logger.info("✅ データ統合完了")
            
        except Exception as e:
            logger.error(f"データ統合エラー: {e}")
            raise
        finally:
            await conn.close()
            
    def _get_latest_collection_result(self) -> Dict:
        """最新の収集結果を取得"""
        results_dir = self.data_dir / "collection_results"
        if not results_dir.exists():
            return {}
            
        # 最新のファイルを取得
        json_files = list(results_dir.glob("free_data_*.json"))
        if not json_files:
            return {}
            
        latest_file = max(json_files, key=lambda p: p.stat().st_mtime)
        
        with open(latest_file, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    async def _integrate_weather_data(self, conn, weather_data: Dict):
        """気象データをデータベースに統合"""
        logger.info("気象データ統合中...")
        
        # weather_dataテーブルが存在しない場合は作成
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS weather_data (
                id SERIAL PRIMARY KEY,
                city VARCHAR(100),
                prefecture VARCHAR(50),
                lat FLOAT,
                lng FLOAT,
                temperature FLOAT,
                humidity INTEGER,
                precipitation FLOAT,
                weather_code INTEGER,
                wind_speed FLOAT,
                observation_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 都市座標情報
        city_coords = {
            "広島市": {"lat": 34.3853, "lng": 132.4553, "pref": "広島県"},
            "山口市": {"lat": 34.1859, "lng": 131.4705, "pref": "山口県"},
            "福岡市": {"lat": 33.5904, "lng": 130.4017, "pref": "福岡県"},
            "大阪市": {"lat": 34.6937, "lng": 135.5023, "pref": "大阪府"},
            "東京都": {"lat": 35.6762, "lng": 139.6503, "pref": "東京都"}
        }
        
        for city_name, data in weather_data.items():
            if data.get('status') == 'success' and 'current' in data:
                current = data['current']
                coords = city_coords.get(city_name, {})
                
                try:
                    await conn.execute('''
                        INSERT INTO weather_data 
                        (city, prefecture, lat, lng, temperature, humidity, 
                         precipitation, weather_code, wind_speed, observation_time)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ''',
                        city_name,
                        coords.get('pref', ''),
                        coords.get('lat', 0),
                        coords.get('lng', 0),
                        current.get('temperature_2m', 0),
                        current.get('relative_humidity_2m', 0),
                        current.get('precipitation', 0),
                        current.get('weather_code', 0),
                        current.get('wind_speed_10m', 0),
                        datetime.fromisoformat(current.get('time', datetime.now().isoformat()))
                    )
                    logger.info(f"✓ {city_name}の気象データを保存")
                except Exception as e:
                    logger.error(f"✗ {city_name}の気象データ保存失敗: {e}")
                    
    async def _integrate_earthquake_data(self, conn, earthquake_data: List):
        """地震データをデータベースに統合"""
        logger.info("地震データ統合中...")
        
        # earthquake_dataテーブルが存在しない場合は作成
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS earthquake_data (
                id SERIAL PRIMARY KEY,
                event_id VARCHAR(100) UNIQUE,
                magnitude FLOAT,
                depth INTEGER,
                lat FLOAT,
                lng FLOAT,
                place VARCHAR(200),
                event_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        for quake in earthquake_data[:20]:  # 最新20件のみ
            try:
                # 地震データの解析（JMAフォーマット）
                event_id = quake.get('eventId', '')
                magnitude = float(quake.get('magnitude', 0)) if quake.get('magnitude') else None
                
                # 震源情報
                hypocenter = quake.get('hypocenter', {})
                depth = hypocenter.get('depth', 0)
                lat = hypocenter.get('latitude', 0)
                lng = hypocenter.get('longitude', 0)
                place = hypocenter.get('name', '')
                
                # 発生時刻
                origin_time = quake.get('originTime', '')
                if origin_time:
                    event_time = datetime.fromisoformat(origin_time.replace('Z', '+00:00'))
                else:
                    event_time = datetime.now()
                
                await conn.execute('''
                    INSERT INTO earthquake_data 
                    (event_id, magnitude, depth, lat, lng, place, event_time)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (event_id) DO NOTHING
                ''',
                    event_id, magnitude, depth, lat, lng, place, event_time
                )
                
            except Exception as e:
                logger.error(f"地震データ保存エラー: {e}")
                
        logger.info(f"✓ {len(earthquake_data[:20])}件の地震データを保存")
        
    async def _integrate_gtfs_data(self, conn, gtfs_data: Dict):
        """GTFSデータ情報をデータベースに統合"""
        logger.info("GTFSデータ情報統合中...")
        
        # gtfs_feedsテーブルが存在しない場合は作成
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS gtfs_feeds (
                id SERIAL PRIMARY KEY,
                operator_name VARCHAR(100) UNIQUE,
                feed_url TEXT,
                feed_type VARCHAR(100),
                status VARCHAR(50),
                last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        for operator, info in gtfs_data.items():
            if info.get('status') == 'available':
                try:
                    await conn.execute('''
                        INSERT INTO gtfs_feeds 
                        (operator_name, feed_url, feed_type, status)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (operator_name) 
                        DO UPDATE SET 
                            feed_url = EXCLUDED.feed_url,
                            status = EXCLUDED.status,
                            last_checked = CURRENT_TIMESTAMP
                    ''',
                        operator,
                        info.get('url', ''),
                        info.get('type', ''),
                        'available'
                    )
                    logger.info(f"✓ {operator}のGTFS情報を保存")
                except Exception as e:
                    logger.error(f"✗ {operator}のGTFS情報保存失敗: {e}")
                    
    async def _integrate_environmental_data(self, conn, env_data: Dict):
        """環境モニタリングデータ情報をデータベースに統合"""
        logger.info("環境データ情報統合中...")
        
        # environmental_sourcesテーブルが存在しない場合は作成
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS environmental_sources (
                id SERIAL PRIMARY KEY,
                category VARCHAR(100),
                name VARCHAR(200),
                description TEXT,
                url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        for category, sources in env_data.items():
            if isinstance(sources, dict):
                for source_name, source_info in sources.items():
                    try:
                        await conn.execute('''
                            INSERT INTO environmental_sources 
                            (category, name, description, url)
                            VALUES ($1, $2, $3, $4)
                        ''',
                            category,
                            source_name,
                            source_info.get('description', ''),
                            source_info.get('url', '')
                        )
                        logger.info(f"✓ {category} - {source_name}の情報を保存")
                    except Exception as e:
                        logger.error(f"環境データ情報保存エラー: {e}")
                        

async def main():
    """メイン処理"""
    integrator = OpenDataIntegrator()
    await integrator.integrate_all()
    
    print("\n📊 データベース統合完了")
    print("次のステップ:")
    print("1. フロントエンドでリアルデータを表示")
    print("2. APIキーを取得したら追加データを収集")
    print("3. 定期的な更新スケジュールを設定")


if __name__ == "__main__":
    asyncio.run(main())
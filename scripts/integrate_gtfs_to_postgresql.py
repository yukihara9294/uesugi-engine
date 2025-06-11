#!/usr/bin/env python3
"""
GTFS データ PostgreSQL 統合スクリプト

このスクリプトは収集済みのGTFSデータをPostgreSQLデータベースに統合します。
PostGISを使用して空間インデックスを設定し、効率的な地理空間クエリを実現します。
"""

import os
import sys
import json
import csv
import zipfile
from datetime import datetime
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_batch
import logging

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try to import settings, but fall back to environment variables if not available
try:
    from src.backend.app.core.config import settings
except ImportError:
    # Running standalone - use environment variables
    class Settings:
        def __init__(self):
            self.DATABASE_URL = os.environ.get('DATABASE_URL', '')
            if self.DATABASE_URL:
                from urllib.parse import urlparse
                db_url = urlparse(self.DATABASE_URL)
                self.POSTGRES_HOST = db_url.hostname or os.environ.get('POSTGRES_HOST', 'localhost')
                self.POSTGRES_PORT = db_url.port or int(os.environ.get('POSTGRES_PORT', 5432))
                self.POSTGRES_DB = db_url.path.lstrip("/") if db_url.path else os.environ.get('POSTGRES_DB', 'uesugi_heatmap')
                self.POSTGRES_USER = db_url.username or os.environ.get('POSTGRES_USER', 'uesugi_user')
                self.POSTGRES_PASSWORD = db_url.password or os.environ.get('POSTGRES_PASSWORD', 'uesugi_password')
            else:
                self.POSTGRES_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
                self.POSTGRES_PORT = int(os.environ.get('POSTGRES_PORT', 5432))
                self.POSTGRES_DB = os.environ.get('POSTGRES_DB', 'uesugi_heatmap')
                self.POSTGRES_USER = os.environ.get('POSTGRES_USER', 'uesugi_user')
                self.POSTGRES_PASSWORD = os.environ.get('POSTGRES_PASSWORD', 'uesugi_password')
    
    settings = Settings()

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GTFSIntegrator:
    """GTFSデータをPostgreSQLに統合するクラス"""
    
    def __init__(self):
        self.conn = None
        self.cursor = None
        # Check if running in Docker container
        if os.path.exists("/uesugi-engine-data"):
            self.data_dir = Path("/uesugi-engine-data")
        else:
            self.data_dir = Path(__file__).parent.parent / "uesugi-engine-data"
        
    def connect_db(self):
        """データベースに接続"""
        try:
            self.conn = psycopg2.connect(
                host=settings.POSTGRES_HOST,
                port=settings.POSTGRES_PORT,
                database=settings.POSTGRES_DB,
                user=settings.POSTGRES_USER,
                password=settings.POSTGRES_PASSWORD
            )
            self.cursor = self.conn.cursor()
            logger.info("データベースに接続しました")
        except Exception as e:
            logger.error(f"データベース接続エラー: {e}")
            raise
            
    def close_db(self):
        """データベース接続を閉じる"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("データベース接続を閉じました")
        
    def create_gtfs_tables(self):
        """GTFSテーブルを作成"""
        logger.info("GTFSテーブルを作成しています...")
        
        # PostGIS拡張を有効化
        self.cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
        
        # GTFSテーブル作成SQL
        tables_sql = """
        -- 事業者テーブル
        CREATE TABLE IF NOT EXISTS gtfs_agency (
            agency_id VARCHAR(255) PRIMARY KEY,
            agency_name VARCHAR(255) NOT NULL,
            agency_url VARCHAR(255),
            agency_timezone VARCHAR(50),
            agency_lang VARCHAR(10),
            agency_phone VARCHAR(50),
            agency_fare_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 路線テーブル
        CREATE TABLE IF NOT EXISTS gtfs_routes (
            route_id VARCHAR(255) PRIMARY KEY,
            agency_id VARCHAR(255),
            route_short_name VARCHAR(50),
            route_long_name VARCHAR(255),
            route_desc TEXT,
            route_type INTEGER,
            route_url VARCHAR(255),
            route_color VARCHAR(6),
            route_text_color VARCHAR(6),
            route_sort_order INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES gtfs_agency(agency_id) ON DELETE CASCADE
        );
        
        -- 停留所テーブル
        CREATE TABLE IF NOT EXISTS gtfs_stops (
            stop_id VARCHAR(255) PRIMARY KEY,
            stop_code VARCHAR(50),
            stop_name VARCHAR(255) NOT NULL,
            stop_desc TEXT,
            stop_lat DECIMAL(10, 8),
            stop_lon DECIMAL(11, 8),
            zone_id VARCHAR(255),
            stop_url VARCHAR(255),
            location_type INTEGER DEFAULT 0,
            parent_station VARCHAR(255),
            stop_timezone VARCHAR(50),
            wheelchair_boarding INTEGER,
            platform_code VARCHAR(50),
            geom GEOMETRY(Point, 4326),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- サービスカレンダーテーブル
        CREATE TABLE IF NOT EXISTS gtfs_calendar (
            service_id VARCHAR(255) PRIMARY KEY,
            monday BOOLEAN,
            tuesday BOOLEAN,
            wednesday BOOLEAN,
            thursday BOOLEAN,
            friday BOOLEAN,
            saturday BOOLEAN,
            sunday BOOLEAN,
            start_date DATE,
            end_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- トリップテーブル
        CREATE TABLE IF NOT EXISTS gtfs_trips (
            trip_id VARCHAR(255) PRIMARY KEY,
            route_id VARCHAR(255),
            service_id VARCHAR(255),
            trip_headsign VARCHAR(255),
            trip_short_name VARCHAR(50),
            direction_id INTEGER,
            block_id VARCHAR(255),
            shape_id VARCHAR(255),
            wheelchair_accessible INTEGER,
            bikes_allowed INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (route_id) REFERENCES gtfs_routes(route_id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES gtfs_calendar(service_id) ON DELETE CASCADE
        );
        
        -- 時刻表テーブル
        CREATE TABLE IF NOT EXISTS gtfs_stop_times (
            trip_id VARCHAR(255),
            arrival_time TIME,
            departure_time TIME,
            stop_id VARCHAR(255),
            stop_sequence INTEGER,
            stop_headsign VARCHAR(255),
            pickup_type INTEGER DEFAULT 0,
            drop_off_type INTEGER DEFAULT 0,
            shape_dist_traveled DECIMAL(10, 2),
            timepoint INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (trip_id, stop_sequence),
            FOREIGN KEY (trip_id) REFERENCES gtfs_trips(trip_id) ON DELETE CASCADE,
            FOREIGN KEY (stop_id) REFERENCES gtfs_stops(stop_id) ON DELETE CASCADE
        );
        
        -- 形状テーブル
        CREATE TABLE IF NOT EXISTS gtfs_shapes (
            shape_id VARCHAR(255),
            shape_pt_lat DECIMAL(10, 8),
            shape_pt_lon DECIMAL(11, 8),
            shape_pt_sequence INTEGER,
            shape_dist_traveled DECIMAL(10, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (shape_id, shape_pt_sequence)
        );
        
        -- カレンダー例外日テーブル
        CREATE TABLE IF NOT EXISTS gtfs_calendar_dates (
            service_id VARCHAR(255),
            date DATE,
            exception_type INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (service_id, date),
            FOREIGN KEY (service_id) REFERENCES gtfs_calendar(service_id) ON DELETE CASCADE
        );
        
        -- 運賃属性テーブル
        CREATE TABLE IF NOT EXISTS gtfs_fare_attributes (
            fare_id VARCHAR(255) PRIMARY KEY,
            price DECIMAL(10, 2),
            currency_type VARCHAR(3),
            payment_method INTEGER,
            transfers INTEGER,
            agency_id VARCHAR(255),
            transfer_duration INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (agency_id) REFERENCES gtfs_agency(agency_id) ON DELETE CASCADE
        );
        
        -- 運賃ルールテーブル
        CREATE TABLE IF NOT EXISTS gtfs_fare_rules (
            fare_id VARCHAR(255),
            route_id VARCHAR(255),
            origin_id VARCHAR(255),
            destination_id VARCHAR(255),
            contains_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fare_id) REFERENCES gtfs_fare_attributes(fare_id) ON DELETE CASCADE,
            FOREIGN KEY (route_id) REFERENCES gtfs_routes(route_id) ON DELETE CASCADE
        );
        
        -- 翻訳テーブル
        CREATE TABLE IF NOT EXISTS gtfs_translations (
            table_name VARCHAR(50),
            field_name VARCHAR(50),
            language VARCHAR(10),
            translation TEXT,
            record_id VARCHAR(255),
            record_sub_id VARCHAR(255),
            field_value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- インデックス作成
        CREATE INDEX IF NOT EXISTS idx_gtfs_stops_geom ON gtfs_stops USING GIST (geom);
        CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_stop_id ON gtfs_stop_times (stop_id);
        CREATE INDEX IF NOT EXISTS idx_gtfs_stop_times_trip_id ON gtfs_stop_times (trip_id);
        CREATE INDEX IF NOT EXISTS idx_gtfs_trips_route_id ON gtfs_trips (route_id);
        CREATE INDEX IF NOT EXISTS idx_gtfs_trips_service_id ON gtfs_trips (service_id);
        CREATE INDEX IF NOT EXISTS idx_gtfs_shapes_shape_id ON gtfs_shapes (shape_id);
        """
        
        try:
            self.cursor.execute(tables_sql)
            self.conn.commit()
            logger.info("GTFSテーブルの作成が完了しました")
        except Exception as e:
            self.conn.rollback()
            logger.error(f"テーブル作成エラー: {e}")
            raise
            
    def load_gtfs_data(self, region="hiroshima"):
        """GTFSデータを読み込んでデータベースに挿入"""
        logger.info(f"{region}のGTFSデータを読み込んでいます...")
        
        # GTFSデータディレクトリ - 複数の可能性をチェック
        possible_dirs = [
            self.data_dir / region / "transport" / "bus" / "gtfs",
            self.data_dir / region / "transport" / "bus" / "gtfs_extracted",
            self.data_dir / region / "transport" / "bus"
        ]
        
        gtfs_dir = None
        for dir_path in possible_dirs:
            if dir_path.exists():
                # .txtファイルが存在するか確認
                txt_files = list(dir_path.glob("*.txt"))
                if txt_files:
                    gtfs_dir = dir_path
                    logger.info(f"GTFSファイルが見つかりました: {gtfs_dir}")
                    break
                    
        if not gtfs_dir:
            logger.error(f"GTFSファイルが見つかりません。確認したディレクトリ: {possible_dirs}")
            return
            
        # GTFSファイルを直接処理
        if list(gtfs_dir.glob("*.txt")):
            logger.info(f"GTFSファイルを処理中: {gtfs_dir}")
            self._process_operator_gtfs(gtfs_dir)
                
    def _process_operator_gtfs(self, operator_dir):
        """事業者ごとのGTFSデータを処理"""
        # GTFSファイルの優先順位（.txtファイルを優先、なければ.zip内を探す）
        txt_files = list(operator_dir.glob("*.txt"))
        
        if txt_files:
            # .txtファイルが存在する場合
            self._load_agency(operator_dir / "agency.txt")
            self._load_routes(operator_dir / "routes.txt")
            self._load_stops(operator_dir / "stops.txt")
            self._load_calendar(operator_dir / "calendar.txt")
            self._load_trips(operator_dir / "trips.txt")
            self._load_stop_times(operator_dir / "stop_times.txt")
            self._load_shapes(operator_dir / "shapes.txt")
            self._load_calendar_dates(operator_dir / "calendar_dates.txt")
            self._load_fare_attributes(operator_dir / "fare_attributes.txt")
            self._load_fare_rules(operator_dir / "fare_rules.txt")
            self._load_translations(operator_dir / "translations.txt")
        else:
            # .zipファイルを探す
            zip_files = list(operator_dir.glob("*.zip"))
            if zip_files:
                self._process_gtfs_zip(zip_files[0])
                
    def _process_gtfs_zip(self, zip_path):
        """GTFSのZIPファイルを処理"""
        logger.info(f"ZIPファイルを処理中: {zip_path}")
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # 一時ディレクトリに展開
            temp_dir = zip_path.parent / "temp_gtfs"
            temp_dir.mkdir(exist_ok=True)
            zip_ref.extractall(temp_dir)
            
            # 展開したファイルを処理
            self._load_agency(temp_dir / "agency.txt")
            self._load_routes(temp_dir / "routes.txt")
            self._load_stops(temp_dir / "stops.txt")
            self._load_calendar(temp_dir / "calendar.txt")
            self._load_trips(temp_dir / "trips.txt")
            self._load_stop_times(temp_dir / "stop_times.txt")
            self._load_shapes(temp_dir / "shapes.txt")
            self._load_calendar_dates(temp_dir / "calendar_dates.txt")
            self._load_fare_attributes(temp_dir / "fare_attributes.txt")
            self._load_fare_rules(temp_dir / "fare_rules.txt")
            self._load_translations(temp_dir / "translations.txt")
            
            # 一時ディレクトリを削除
            import shutil
            shutil.rmtree(temp_dir)
            
    def _load_agency(self, file_path):
        """agency.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"agency.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    data.append((
                        row.get('agency_id', ''),
                        row.get('agency_name', ''),
                        row.get('agency_url', ''),
                        row.get('agency_timezone', 'Asia/Tokyo'),
                        row.get('agency_lang', 'ja'),
                        row.get('agency_phone', ''),
                        row.get('agency_fare_url', '')
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_agency (
                        agency_id, agency_name, agency_url, agency_timezone,
                        agency_lang, agency_phone, agency_fare_url
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (agency_id) DO UPDATE SET
                        agency_name = EXCLUDED.agency_name,
                        agency_url = EXCLUDED.agency_url,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件の事業者データを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"agency.txt読み込みエラー: {e}")
            
    def _load_routes(self, file_path):
        """routes.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"routes.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    data.append((
                        row.get('route_id', ''),
                        row.get('agency_id', ''),
                        row.get('route_short_name', ''),
                        row.get('route_long_name', ''),
                        row.get('route_desc', ''),
                        int(row.get('route_type', 3)),  # 3 = バス
                        row.get('route_url', ''),
                        row.get('route_color', ''),
                        row.get('route_text_color', ''),
                        int(row.get('route_sort_order', 0)) if row.get('route_sort_order') else None
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_routes (
                        route_id, agency_id, route_short_name, route_long_name,
                        route_desc, route_type, route_url, route_color,
                        route_text_color, route_sort_order
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (route_id) DO UPDATE SET
                        route_long_name = EXCLUDED.route_long_name,
                        route_desc = EXCLUDED.route_desc,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件の路線データを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"routes.txt読み込みエラー: {e}")
            
    def _load_stops(self, file_path):
        """stops.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"stops.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    lat = float(row.get('stop_lat', 0))
                    lon = float(row.get('stop_lon', 0))
                    
                    # PostGISのPOINTジオメトリを作成
                    self.cursor.execute(
                        """
                        INSERT INTO gtfs_stops (
                            stop_id, stop_code, stop_name, stop_desc,
                            stop_lat, stop_lon, zone_id, stop_url,
                            location_type, parent_station, stop_timezone,
                            wheelchair_boarding, platform_code, geom
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                            ST_SetSRID(ST_MakePoint(%s, %s), 4326)
                        )
                        ON CONFLICT (stop_id) DO UPDATE SET
                            stop_name = EXCLUDED.stop_name,
                            stop_lat = EXCLUDED.stop_lat,
                            stop_lon = EXCLUDED.stop_lon,
                            geom = EXCLUDED.geom,
                            updated_at = CURRENT_TIMESTAMP
                        """,
                        (
                            row.get('stop_id', ''),
                            row.get('stop_code', ''),
                            row.get('stop_name', ''),
                            row.get('stop_desc', ''),
                            lat,
                            lon,
                            row.get('zone_id', ''),
                            row.get('stop_url', ''),
                            int(row.get('location_type', 0)) if row.get('location_type') else 0,
                            row.get('parent_station', ''),
                            row.get('stop_timezone', ''),
                            int(row.get('wheelchair_boarding', 0)) if row.get('wheelchair_boarding') else None,
                            row.get('platform_code', ''),
                            lon,
                            lat
                        )
                    )
                    
                self.conn.commit()
                logger.info(f"停留所データを挿入しました")
                
        except Exception as e:
            self.conn.rollback()
            logger.error(f"stops.txt読み込みエラー: {e}")
            
    def _load_calendar(self, file_path):
        """calendar.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"calendar.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    # 日付文字列をdateオブジェクトに変換
                    start_date = datetime.strptime(row['start_date'], '%Y%m%d').date()
                    end_date = datetime.strptime(row['end_date'], '%Y%m%d').date()
                    
                    data.append((
                        row.get('service_id', ''),
                        bool(int(row.get('monday', 0))),
                        bool(int(row.get('tuesday', 0))),
                        bool(int(row.get('wednesday', 0))),
                        bool(int(row.get('thursday', 0))),
                        bool(int(row.get('friday', 0))),
                        bool(int(row.get('saturday', 0))),
                        bool(int(row.get('sunday', 0))),
                        start_date,
                        end_date
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_calendar (
                        service_id, monday, tuesday, wednesday, thursday,
                        friday, saturday, sunday, start_date, end_date
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (service_id) DO UPDATE SET
                        monday = EXCLUDED.monday,
                        tuesday = EXCLUDED.tuesday,
                        wednesday = EXCLUDED.wednesday,
                        thursday = EXCLUDED.thursday,
                        friday = EXCLUDED.friday,
                        saturday = EXCLUDED.saturday,
                        sunday = EXCLUDED.sunday,
                        start_date = EXCLUDED.start_date,
                        end_date = EXCLUDED.end_date,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件のカレンダーデータを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"calendar.txt読み込みエラー: {e}")
            
    def _load_trips(self, file_path):
        """trips.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"trips.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    data.append((
                        row.get('trip_id', ''),
                        row.get('route_id', ''),
                        row.get('service_id', ''),
                        row.get('trip_headsign', ''),
                        row.get('trip_short_name', ''),
                        int(row.get('direction_id', 0)) if row.get('direction_id') else None,
                        row.get('block_id', ''),
                        row.get('shape_id', ''),
                        int(row.get('wheelchair_accessible', 0)) if row.get('wheelchair_accessible') else None,
                        int(row.get('bikes_allowed', 0)) if row.get('bikes_allowed') else None
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_trips (
                        trip_id, route_id, service_id, trip_headsign,
                        trip_short_name, direction_id, block_id, shape_id,
                        wheelchair_accessible, bikes_allowed
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (trip_id) DO UPDATE SET
                        trip_headsign = EXCLUDED.trip_headsign,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件のトリップデータを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"trips.txt読み込みエラー: {e}")
            
    def _load_stop_times(self, file_path):
        """stop_times.txtを読み込み（大量データのため分割処理）"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"stop_times.txtを読み込み中: {file_path}")
        
        try:
            batch_size = 10000
            batch_data = []
            total_count = 0
            
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    # 時刻の形式を確認（24時間を超える場合の処理）
                    arrival_time = self._parse_gtfs_time(row.get('arrival_time', ''))
                    departure_time = self._parse_gtfs_time(row.get('departure_time', ''))
                    
                    batch_data.append((
                        row.get('trip_id', ''),
                        arrival_time,
                        departure_time,
                        row.get('stop_id', ''),
                        int(row.get('stop_sequence', 0)),
                        row.get('stop_headsign', ''),
                        int(row.get('pickup_type', 0)) if row.get('pickup_type') else 0,
                        int(row.get('drop_off_type', 0)) if row.get('drop_off_type') else 0,
                        float(row.get('shape_dist_traveled', 0)) if row.get('shape_dist_traveled') else None,
                        int(row.get('timepoint', 1)) if row.get('timepoint') else None
                    ))
                    
                    if len(batch_data) >= batch_size:
                        self._insert_stop_times_batch(batch_data)
                        total_count += len(batch_data)
                        logger.info(f"{total_count}件処理済み...")
                        batch_data = []
                        
                # 残りのデータを挿入
                if batch_data:
                    self._insert_stop_times_batch(batch_data)
                    total_count += len(batch_data)
                    
            logger.info(f"{total_count}件の時刻表データを挿入しました")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"stop_times.txt読み込みエラー: {e}")
            
    def _parse_gtfs_time(self, time_str):
        """GTFS時刻形式をパース（24時間を超える場合の処理）"""
        if not time_str:
            return None
            
        parts = time_str.split(':')
        if len(parts) != 3:
            return None
            
        hours = int(parts[0])
        minutes = int(parts[1])
        seconds = int(parts[2])
        
        # 24時間を超える場合は24時間以内に正規化
        if hours >= 24:
            hours = hours % 24
            
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        
    def _insert_stop_times_batch(self, batch_data):
        """stop_timesデータをバッチ挿入"""
        query = """
        INSERT INTO gtfs_stop_times (
            trip_id, arrival_time, departure_time, stop_id,
            stop_sequence, stop_headsign, pickup_type, drop_off_type,
            shape_dist_traveled, timepoint
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (trip_id, stop_sequence) DO UPDATE SET
            arrival_time = EXCLUDED.arrival_time,
            departure_time = EXCLUDED.departure_time,
            updated_at = CURRENT_TIMESTAMP
        """
        execute_batch(self.cursor, query, batch_data)
        self.conn.commit()
        
    def _load_shapes(self, file_path):
        """shapes.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"shapes.txtを読み込み中: {file_path}")
        
        try:
            batch_size = 10000
            batch_data = []
            total_count = 0
            
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    batch_data.append((
                        row.get('shape_id', ''),
                        float(row.get('shape_pt_lat', 0)),
                        float(row.get('shape_pt_lon', 0)),
                        int(row.get('shape_pt_sequence', 0)),
                        float(row.get('shape_dist_traveled', 0)) if row.get('shape_dist_traveled') else None
                    ))
                    
                    if len(batch_data) >= batch_size:
                        query = """
                        INSERT INTO gtfs_shapes (
                            shape_id, shape_pt_lat, shape_pt_lon,
                            shape_pt_sequence, shape_dist_traveled
                        ) VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (shape_id, shape_pt_sequence) DO UPDATE SET
                            shape_pt_lat = EXCLUDED.shape_pt_lat,
                            shape_pt_lon = EXCLUDED.shape_pt_lon,
                            updated_at = CURRENT_TIMESTAMP
                        """
                        execute_batch(self.cursor, query, batch_data)
                        self.conn.commit()
                        total_count += len(batch_data)
                        logger.info(f"{total_count}件処理済み...")
                        batch_data = []
                        
                # 残りのデータを挿入
                if batch_data:
                    query = """
                    INSERT INTO gtfs_shapes (
                        shape_id, shape_pt_lat, shape_pt_lon,
                        shape_pt_sequence, shape_dist_traveled
                    ) VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (shape_id, shape_pt_sequence) DO UPDATE SET
                        shape_pt_lat = EXCLUDED.shape_pt_lat,
                        shape_pt_lon = EXCLUDED.shape_pt_lon,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, batch_data)
                    self.conn.commit()
                    total_count += len(batch_data)
                    
            logger.info(f"{total_count}件の形状データを挿入しました")
            
        except Exception as e:
            self.conn.rollback()
            logger.error(f"shapes.txt読み込みエラー: {e}")
            
    def _load_calendar_dates(self, file_path):
        """calendar_dates.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"calendar_dates.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    date = datetime.strptime(row['date'], '%Y%m%d').date()
                    
                    data.append((
                        row.get('service_id', ''),
                        date,
                        int(row.get('exception_type', 1))
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_calendar_dates (
                        service_id, date, exception_type
                    ) VALUES (%s, %s, %s)
                    ON CONFLICT (service_id, date) DO UPDATE SET
                        exception_type = EXCLUDED.exception_type,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件のカレンダー例外データを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"calendar_dates.txt読み込みエラー: {e}")
            
    def _load_fare_attributes(self, file_path):
        """fare_attributes.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"fare_attributes.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    data.append((
                        row.get('fare_id', ''),
                        float(row.get('price', 0)),
                        row.get('currency_type', 'JPY'),
                        int(row.get('payment_method', 0)),
                        int(row.get('transfers', -1)) if row.get('transfers') else None,
                        row.get('agency_id', ''),
                        int(row.get('transfer_duration', 0)) if row.get('transfer_duration') else None
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_fare_attributes (
                        fare_id, price, currency_type, payment_method,
                        transfers, agency_id, transfer_duration
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (fare_id) DO UPDATE SET
                        price = EXCLUDED.price,
                        updated_at = CURRENT_TIMESTAMP
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件の運賃属性データを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"fare_attributes.txt読み込みエラー: {e}")
            
    def _load_fare_rules(self, file_path):
        """fare_rules.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"fare_rules.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    data.append((
                        row.get('fare_id', ''),
                        row.get('route_id', ''),
                        row.get('origin_id', ''),
                        row.get('destination_id', ''),
                        row.get('contains_id', '')
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_fare_rules (
                        fare_id, route_id, origin_id, destination_id, contains_id
                    ) VALUES (%s, %s, %s, %s, %s)
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件の運賃ルールデータを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"fare_rules.txt読み込みエラー: {e}")
            
    def _load_translations(self, file_path):
        """translations.txtを読み込み"""
        if not file_path.exists():
            logger.warning(f"ファイルが見つかりません: {file_path}")
            return
            
        logger.info(f"translations.txtを読み込み中: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                data = []
                for row in reader:
                    data.append((
                        row.get('table_name', ''),
                        row.get('field_name', ''),
                        row.get('language', ''),
                        row.get('translation', ''),
                        row.get('record_id', ''),
                        row.get('record_sub_id', ''),
                        row.get('field_value', '')
                    ))
                    
                if data:
                    query = """
                    INSERT INTO gtfs_translations (
                        table_name, field_name, language, translation,
                        record_id, record_sub_id, field_value
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    execute_batch(self.cursor, query, data)
                    self.conn.commit()
                    logger.info(f"{len(data)}件の翻訳データを挿入しました")
                    
        except Exception as e:
            self.conn.rollback()
            logger.error(f"translations.txt読み込みエラー: {e}")
            
    def create_summary_views(self):
        """分析用のビューを作成"""
        logger.info("分析用ビューを作成しています...")
        
        views_sql = """
        -- 路線別停留所数ビュー
        CREATE OR REPLACE VIEW v_route_stop_count AS
        SELECT 
            r.route_id,
            r.route_long_name,
            r.route_short_name,
            a.agency_name,
            COUNT(DISTINCT st.stop_id) as stop_count
        FROM gtfs_routes r
        JOIN gtfs_agency a ON r.agency_id = a.agency_id
        JOIN gtfs_trips t ON r.route_id = t.route_id
        JOIN gtfs_stop_times st ON t.trip_id = st.trip_id
        GROUP BY r.route_id, r.route_long_name, r.route_short_name, a.agency_name;
        
        -- エリア別停留所密度ビュー
        CREATE OR REPLACE VIEW v_stop_density AS
        SELECT 
            ST_SnapToGrid(geom, 0.01) as grid_geom,
            COUNT(*) as stop_count
        FROM gtfs_stops
        WHERE location_type = 0
        GROUP BY grid_geom;
        
        -- 時間帯別運行本数ビュー
        CREATE OR REPLACE VIEW v_service_frequency AS
        SELECT 
            EXTRACT(HOUR FROM arrival_time) as hour,
            COUNT(DISTINCT trip_id) as trip_count
        FROM gtfs_stop_times
        GROUP BY hour
        ORDER BY hour;
        """
        
        try:
            self.cursor.execute(views_sql)
            self.conn.commit()
            logger.info("分析用ビューの作成が完了しました")
        except Exception as e:
            self.conn.rollback()
            logger.error(f"ビュー作成エラー: {e}")
            
    def verify_data(self):
        """統合されたデータを検証"""
        logger.info("統合データを検証しています...")
        
        queries = [
            ("事業者数", "SELECT COUNT(*) FROM gtfs_agency"),
            ("路線数", "SELECT COUNT(*) FROM gtfs_routes"),
            ("停留所数", "SELECT COUNT(*) FROM gtfs_stops WHERE location_type = 0"),
            ("トリップ数", "SELECT COUNT(*) FROM gtfs_trips"),
            ("時刻表レコード数", "SELECT COUNT(*) FROM gtfs_stop_times"),
            ("サービスカレンダー数", "SELECT COUNT(*) FROM gtfs_calendar"),
        ]
        
        for label, query in queries:
            self.cursor.execute(query)
            count = self.cursor.fetchone()[0]
            logger.info(f"{label}: {count:,}")
            
        # 地理的範囲を確認
        self.cursor.execute("""
            SELECT 
                MIN(stop_lat) as min_lat,
                MAX(stop_lat) as max_lat,
                MIN(stop_lon) as min_lon,
                MAX(stop_lon) as max_lon
            FROM gtfs_stops
            WHERE location_type = 0
        """)
        bounds = self.cursor.fetchone()
        logger.info(f"地理的範囲: 緯度 {bounds[0]:.4f} - {bounds[1]:.4f}, 経度 {bounds[2]:.4f} - {bounds[3]:.4f}")
        
    def run(self):
        """統合処理を実行"""
        try:
            # データベース接続
            self.connect_db()
            
            # テーブル作成
            self.create_gtfs_tables()
            
            # GTFSデータ読み込み
            self.load_gtfs_data("hiroshima")
            
            # 分析用ビュー作成
            self.create_summary_views()
            
            # データ検証
            self.verify_data()
            
            logger.info("GTFS統合が完了しました！")
            
        except Exception as e:
            logger.error(f"統合処理エラー: {e}")
            raise
        finally:
            self.close_db()


def main():
    """メイン処理"""
    integrator = GTFSIntegrator()
    integrator.run()


if __name__ == "__main__":
    main()
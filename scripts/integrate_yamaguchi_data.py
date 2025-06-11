#!/usr/bin/env python3
"""
山口県収集データのPostgreSQL統合スクリプト
122個のCSV/Excelファイルを統一スキーマでデータベースに格納
"""
import os
import sys
import csv
import json
import logging
from datetime import datetime
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_batch
import openpyxl

# プロジェクトルートパスを追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class YamaguchiDataIntegrator:
    """山口県データのDB統合"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data" / "yamaguchi"
        
        # DB接続設定
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
            'database': os.getenv('DB_NAME', 'uesugi_db'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
        
        self.conn = None
        self.cursor = None
        
    def connect_db(self):
        """データベース接続"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            self.cursor = self.conn.cursor()
            logger.info("✅ PostgreSQL接続成功")
            return True
        except Exception as e:
            logger.error(f"❌ DB接続エラー: {e}")
            return False
            
    def create_tables(self):
        """統一スキーマのテーブル作成"""
        try:
            # PostGIS拡張
            self.cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            
            # 観光施設テーブル
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS yamaguchi_tourism_facilities (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    category VARCHAR(100),
                    address TEXT,
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    location GEOMETRY(Point, 4326),
                    city VARCHAR(100),
                    description TEXT,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_tourism_location 
                ON yamaguchi_tourism_facilities USING GIST(location);
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_tourism_category 
                ON yamaguchi_tourism_facilities(category);
            """)
            
            # 人口統計テーブル
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS yamaguchi_population (
                    id SERIAL PRIMARY KEY,
                    city_code VARCHAR(10),
                    city_name VARCHAR(100),
                    district_name VARCHAR(100),
                    year INTEGER,
                    month INTEGER,
                    age_group VARCHAR(50),
                    gender VARCHAR(10),
                    population INTEGER,
                    households INTEGER,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_pop_city_date 
                ON yamaguchi_population(city_code, year, month);
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_pop_age 
                ON yamaguchi_population(age_group);
            """)
            
            # イベント情報テーブル
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS yamaguchi_events (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    category VARCHAR(100),
                    venue TEXT,
                    start_date DATE,
                    end_date DATE,
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    location GEOMETRY(Point, 4326),
                    city VARCHAR(100),
                    description TEXT,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_events_date 
                ON yamaguchi_events(start_date, end_date);
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_events_location 
                ON yamaguchi_events USING GIST(location);
            """)
            
            # 公共施設テーブル（Wi-Fi、トイレ等）
            self.cursor.execute("""
                CREATE TABLE IF NOT EXISTS yamaguchi_public_facilities (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    facility_type VARCHAR(100),
                    address TEXT,
                    latitude DOUBLE PRECISION,
                    longitude DOUBLE PRECISION,
                    location GEOMETRY(Point, 4326),
                    city VARCHAR(100),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_public_type 
                ON yamaguchi_public_facilities(facility_type);
                
                CREATE INDEX IF NOT EXISTS idx_yamaguchi_public_location 
                ON yamaguchi_public_facilities USING GIST(location);
            """)
            
            self.conn.commit()
            logger.info("✅ テーブル作成完了")
            
        except Exception as e:
            logger.error(f"❌ テーブル作成エラー: {e}")
            self.conn.rollback()
            raise
            
    def read_csv_file(self, file_path):
        """CSVファイル読み込み（文字コード自動判定）"""
        encodings = ['utf-8', 'shift_jis', 'cp932', 'utf-8-sig']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    reader = csv.DictReader(f)
                    return list(reader)
            except UnicodeDecodeError:
                continue
                
        logger.error(f"Failed to read CSV: {file_path}")
        return []
        
    def read_excel_file(self, file_path):
        """Excelファイル読み込み"""
        try:
            wb = openpyxl.load_workbook(file_path, read_only=True)
            sheet = wb.active
            
            # ヘッダー行を取得
            headers = []
            for cell in sheet[1]:
                headers.append(cell.value)
                
            # データ行を読み込み
            data = []
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if any(row):  # 空行をスキップ
                    row_dict = {}
                    for i, value in enumerate(row):
                        if i < len(headers) and headers[i]:
                            row_dict[headers[i]] = value
                    data.append(row_dict)
                    
            return data
            
        except Exception as e:
            logger.error(f"Failed to read Excel: {file_path} - {e}")
            return []
            
    def import_tourism_data(self):
        """観光データのインポート"""
        logger.info("観光データインポート開始...")
        
        tourism_dir = self.data_dir / "tourism"
        if not tourism_dir.exists():
            logger.warning("観光データディレクトリが存在しません")
            return
            
        count = 0
        for file_path in tourism_dir.glob("*"):
            if file_path.suffix == '.csv':
                data = self.read_csv_file(file_path)
            elif file_path.suffix in ['.xlsx', '.xls']:
                data = self.read_excel_file(file_path)
            else:
                continue
                
            for row in data:
                try:
                    # カラム名の正規化（異なるファイルでのカラム名の揺れに対応）
                    name = row.get('施設名') or row.get('名称') or row.get('name') or 'Unknown'
                    category = row.get('カテゴリ') or row.get('分類') or row.get('category') or '観光施設'
                    address = row.get('住所') or row.get('所在地') or row.get('address') or ''
                    
                    # 座標の取得
                    lat = None
                    lon = None
                    for lat_key in ['緯度', '緯度(latitude)', 'latitude', 'lat', 'y']:
                        if lat_key in row and row[lat_key]:
                            try:
                                lat = float(row[lat_key])
                                break
                            except:
                                pass
                                
                    for lon_key in ['経度', '経度(longitude)', 'longitude', 'lon', 'lng', 'x']:
                        if lon_key in row and row[lon_key]:
                            try:
                                lon = float(row[lon_key])
                                break
                            except:
                                pass
                    
                    # データ挿入
                    if lat and lon:
                        self.cursor.execute("""
                            INSERT INTO yamaguchi_tourism_facilities 
                            (name, category, address, latitude, longitude, location, metadata)
                            VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s)
                            ON CONFLICT DO NOTHING
                        """, (
                            name, category, address, lat, lon, lon, lat,
                            json.dumps(row, ensure_ascii=False)
                        ))
                        count += 1
                        
                except Exception as e:
                    logger.warning(f"データ挿入エラー: {e}")
                    continue
                    
        self.conn.commit()
        logger.info(f"✅ 観光データ {count}件インポート完了")
        
    def import_population_data(self):
        """人口データのインポート"""
        logger.info("人口データインポート開始...")
        
        population_dir = self.data_dir / "population"
        if not population_dir.exists():
            logger.warning("人口データディレクトリが存在しません")
            return
            
        count = 0
        for file_path in population_dir.glob("*"):
            if file_path.suffix == '.csv':
                data = self.read_csv_file(file_path)
                
                # ファイル名から年月を抽出
                filename = file_path.stem
                year_month = None
                if len(filename) >= 6:
                    try:
                        # YYYYMM形式を探す
                        for i in range(len(filename) - 5):
                            potential_date = filename[i:i+6]
                            if potential_date.isdigit() and potential_date.startswith('20'):
                                year = int(potential_date[:4])
                                month = int(potential_date[4:6])
                                if 2000 <= year <= 2030 and 1 <= month <= 12:
                                    year_month = (year, month)
                                    break
                    except:
                        pass
                        
                for row in data:
                    try:
                        # カラム名の正規化
                        city_name = row.get('市区町村') or row.get('市町村名') or row.get('地域') or ''
                        population = None
                        
                        # 人口数の取得
                        for pop_key in ['人口', '総数', '人口総数', 'population']:
                            if pop_key in row and row[pop_key]:
                                try:
                                    # カンマを除去して数値に変換
                                    pop_str = str(row[pop_key]).replace(',', '').replace('人', '')
                                    population = int(pop_str)
                                    break
                                except:
                                    pass
                        
                        if city_name and population and year_month:
                            self.cursor.execute("""
                                INSERT INTO yamaguchi_population 
                                (city_name, year, month, population, metadata)
                                VALUES (%s, %s, %s, %s, %s)
                                ON CONFLICT DO NOTHING
                            """, (
                                city_name, year_month[0], year_month[1], population,
                                json.dumps(row, ensure_ascii=False)
                            ))
                            count += 1
                            
                    except Exception as e:
                        logger.warning(f"人口データ挿入エラー: {e}")
                        continue
                        
        self.conn.commit()
        logger.info(f"✅ 人口データ {count}件インポート完了")
        
    def generate_summary_report(self):
        """インポート結果のサマリー生成"""
        try:
            # 各テーブルのレコード数を取得
            tables = [
                'yamaguchi_tourism_facilities',
                'yamaguchi_population',
                'yamaguchi_events',
                'yamaguchi_public_facilities'
            ]
            
            report = {
                'timestamp': datetime.now().isoformat(),
                'table_counts': {}
            }
            
            for table in tables:
                self.cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = self.cursor.fetchone()[0]
                report['table_counts'][table] = count
                
            # レポート保存
            report_path = self.data_dir / f"db_import_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2)
                
            logger.info(f"✅ レポート生成: {report_path}")
            
            # サマリー表示
            print("\n" + "="*60)
            print("山口県データ PostgreSQL統合完了")
            print("="*60)
            for table, count in report['table_counts'].items():
                print(f"{table}: {count:,}件")
                
        except Exception as e:
            logger.error(f"レポート生成エラー: {e}")
            
    def run(self):
        """統合処理の実行"""
        try:
            # DB接続
            if not self.connect_db():
                return
                
            # テーブル作成
            self.create_tables()
            
            # データインポート
            self.import_tourism_data()
            self.import_population_data()
            
            # レポート生成
            self.generate_summary_report()
            
        except Exception as e:
            logger.error(f"統合処理エラー: {e}")
            if self.conn:
                self.conn.rollback()
                
        finally:
            if self.cursor:
                self.cursor.close()
            if self.conn:
                self.conn.close()


def main():
    """メイン処理"""
    print("\n🗄️ 山口県データ PostgreSQL統合開始")
    print("="*60)
    
    integrator = YamaguchiDataIntegrator()
    integrator.run()


if __name__ == "__main__":
    main()
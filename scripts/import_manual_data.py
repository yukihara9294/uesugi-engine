#!/usr/bin/env python3
"""
手動ダウンロードデータ取り込みスクリプト

手動でダウンロードしたCSVやZIPファイルを
Uesugi Engine形式に変換して取り込みます。
"""

import os
import sys
import csv
import json
import zipfile
from pathlib import Path
from datetime import datetime
import pandas as pd
import logging
import chardet

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ManualDataImporter:
    """手動ダウンロードデータ取り込みクラス"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent / "uesugi-engine-data"
        self.processed_dir = self.base_dir / "processed"
        self.processed_dir.mkdir(exist_ok=True)
        
    def detect_encoding(self, file_path):
        """ファイルのエンコーディングを検出"""
        with open(file_path, 'rb') as f:
            result = chardet.detect(f.read())
        return result['encoding']
        
    def read_csv_safely(self, file_path):
        """CSVファイルを安全に読み込み（エンコーディング自動検出）"""
        encoding = self.detect_encoding(file_path)
        logger.info(f"検出されたエンコーディング: {encoding}")
        
        try:
            # pandas で読み込み
            df = pd.read_csv(file_path, encoding=encoding)
            return df
        except Exception as e:
            logger.error(f"CSV読み込みエラー: {e}")
            # UTF-8で再試行
            try:
                df = pd.read_csv(file_path, encoding='utf-8')
                return df
            except:
                # Shift-JISで再試行
                df = pd.read_csv(file_path, encoding='shift-jis')
                return df
                
    def process_yamaguchi_opendata(self):
        """山口県オープンデータの処理"""
        logger.info("山口県オープンデータの処理を開始")
        
        yamaguchi_dir = self.base_dir / "yamaguchi" / "opendata"
        if not yamaguchi_dir.exists():
            logger.warning(f"山口県データフォルダが見つかりません: {yamaguchi_dir}")
            return
            
        processed_data = {
            "region": "yamaguchi",
            "processed_at": datetime.now().isoformat(),
            "data_types": {}
        }
        
        # 観光データ処理
        tourism_dir = yamaguchi_dir / "tourism"
        if tourism_dir.exists():
            for csv_file in tourism_dir.glob("*.csv"):
                logger.info(f"処理中: {csv_file.name}")
                df = self.read_csv_safely(csv_file)
                
                if "tourist" in csv_file.name.lower():
                    processed_data["data_types"]["tourist_spots"] = self.process_tourist_spots(df)
                elif "event" in csv_file.name.lower():
                    processed_data["data_types"]["events"] = self.process_events(df)
                    
        # 人口データ処理
        population_dir = yamaguchi_dir / "population"
        if population_dir.exists():
            for csv_file in population_dir.glob("*.csv"):
                logger.info(f"処理中: {csv_file.name}")
                df = self.read_csv_safely(csv_file)
                processed_data["data_types"]["population"] = self.process_population(df)
                
        # 保存
        output_file = self.processed_dir / "yamaguchi_processed.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"山口県データ処理完了: {output_file}")
        
    def process_tourist_spots(self, df):
        """観光地データの処理"""
        spots = []
        
        # カラム名の推測（日本語対応）
        name_cols = ['名称', '観光地名', '施設名', 'name']
        lat_cols = ['緯度', '北緯', 'latitude', 'lat']
        lon_cols = ['経度', '東経', 'longitude', 'lon', 'lng']
        desc_cols = ['説明', '概要', '内容', 'description']
        
        name_col = next((col for col in name_cols if col in df.columns), None)
        lat_col = next((col for col in lat_cols if col in df.columns), None)
        lon_col = next((col for col in lon_cols if col in df.columns), None)
        desc_col = next((col for col in desc_cols if col in df.columns), None)
        
        for _, row in df.iterrows():
            spot = {
                "name": row[name_col] if name_col else "名称不明",
                "type": "tourist_spot",
                "description": row[desc_col] if desc_col else ""
            }
            
            # 座標情報
            if lat_col and lon_col:
                try:
                    spot["coordinates"] = {
                        "lat": float(row[lat_col]),
                        "lon": float(row[lon_col])
                    }
                except:
                    pass
                    
            spots.append(spot)
            
        logger.info(f"観光地データ: {len(spots)}件処理")
        return spots
        
    def process_events(self, df):
        """イベントデータの処理"""
        events = []
        
        # カラム名の推測
        name_cols = ['イベント名', '名称', 'event_name', 'name']
        date_cols = ['開催日', '日時', '開催日時', 'date']
        location_cols = ['開催場所', '場所', '会場', 'location', 'venue']
        
        name_col = next((col for col in name_cols if col in df.columns), None)
        date_col = next((col for col in date_cols if col in df.columns), None)
        location_col = next((col for col in location_cols if col in df.columns), None)
        
        for _, row in df.iterrows():
            event = {
                "name": row[name_col] if name_col else "イベント名不明",
                "type": "event"
            }
            
            if date_col and pd.notna(row[date_col]):
                event["date"] = str(row[date_col])
                
            if location_col and pd.notna(row[location_col]):
                event["location"] = str(row[location_col])
                
            events.append(event)
            
        logger.info(f"イベントデータ: {len(events)}件処理")
        return events
        
    def process_population(self, df):
        """人口データの処理"""
        population_data = []
        
        # カラム名の推測
        area_cols = ['市町村', '地域', '市区町村', 'area', 'city']
        pop_cols = ['人口', '総人口', 'population', 'total']
        
        area_col = next((col for col in area_cols if col in df.columns), None)
        pop_col = next((col for col in pop_cols if col in df.columns), None)
        
        for _, row in df.iterrows():
            data = {
                "area": row[area_col] if area_col else "不明",
                "population": int(row[pop_col]) if pop_col and pd.notna(row[pop_col]) else 0
            }
            
            # 年齢別人口があれば追加
            age_groups = ['0-14歳', '15-64歳', '65歳以上']
            for age in age_groups:
                if age in df.columns:
                    data[age] = int(row[age]) if pd.notna(row[age]) else 0
                    
            population_data.append(data)
            
        logger.info(f"人口データ: {len(population_data)}件処理")
        return population_data
        
    def process_resas_data(self):
        """RESASデータの処理"""
        logger.info("RESASデータの処理を開始")
        
        resas_dir = self.base_dir / "resas"
        if not resas_dir.exists():
            logger.warning(f"RESASデータフォルダが見つかりません: {resas_dir}")
            return
            
        for region_dir in resas_dir.iterdir():
            if region_dir.is_dir():
                logger.info(f"地域処理中: {region_dir.name}")
                
                region_data = {
                    "region": region_dir.name,
                    "processed_at": datetime.now().isoformat(),
                    "indicators": {}
                }
                
                for csv_file in region_dir.glob("*.csv"):
                    logger.info(f"ファイル処理中: {csv_file.name}")
                    
                    df = self.read_csv_safely(csv_file)
                    
                    if "population" in csv_file.name:
                        region_data["indicators"]["population_trend"] = self.process_resas_population(df)
                    elif "economy" in csv_file.name:
                        region_data["indicators"]["economy"] = self.process_resas_economy(df)
                    elif "tourism" in csv_file.name:
                        region_data["indicators"]["tourism"] = self.process_resas_tourism(df)
                        
                # 保存
                output_file = self.processed_dir / f"resas_{region_dir.name}.json"
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(region_data, f, ensure_ascii=False, indent=2)
                    
                logger.info(f"RESAS {region_dir.name}データ処理完了")
                
    def process_resas_population(self, df):
        """RESAS人口データの処理"""
        # RESASの典型的な形式を想定
        return {
            "total": df['総人口'].iloc[-1] if '総人口' in df.columns else None,
            "trend": df[['年', '総人口']].to_dict('records') if '年' in df.columns else []
        }
        
    def process_resas_economy(self, df):
        """RESAS経済データの処理"""
        return {
            "gdp": df['地域内総生産'].iloc[-1] if '地域内総生産' in df.columns else None,
            "industries": df.to_dict('records')[:10]  # 上位10件
        }
        
    def process_resas_tourism(self, df):
        """RESAS観光データの処理"""
        return {
            "visitors": df['観光客数'].iloc[-1] if '観光客数' in df.columns else None,
            "trend": df.to_dict('records')[:12]  # 直近12ヶ月
        }
        
    def process_gtfs_data(self):
        """GTFSデータの処理"""
        logger.info("GTFSデータの処理を開始")
        
        gtfs_dir = self.base_dir / "gtfs"
        if not gtfs_dir.exists():
            logger.warning(f"GTFSデータフォルダが見つかりません: {gtfs_dir}")
            return
            
        for operator_dir in gtfs_dir.iterdir():
            if operator_dir.is_dir():
                logger.info(f"事業者処理中: {operator_dir.name}")
                
                for zip_file in operator_dir.glob("*.zip"):
                    logger.info(f"GTFSファイル処理中: {zip_file.name}")
                    
                    # 展開先
                    extract_dir = operator_dir / "extracted"
                    extract_dir.mkdir(exist_ok=True)
                    
                    # ZIP展開
                    with zipfile.ZipFile(zip_file, 'r') as z:
                        z.extractall(extract_dir)
                        
                    # 基本情報の抽出
                    gtfs_info = self.extract_gtfs_info(extract_dir)
                    
                    # 保存
                    output_file = self.processed_dir / f"gtfs_{operator_dir.name}_info.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(gtfs_info, f, ensure_ascii=False, indent=2)
                        
    def extract_gtfs_info(self, gtfs_dir):
        """GTFS基本情報の抽出"""
        info = {
            "extracted_at": datetime.now().isoformat(),
            "files": [],
            "summary": {}
        }
        
        # agency.txt
        agency_file = gtfs_dir / "agency.txt"
        if agency_file.exists():
            df = self.read_csv_safely(agency_file)
            info["summary"]["agencies"] = len(df)
            info["files"].append("agency.txt")
            
        # routes.txt
        routes_file = gtfs_dir / "routes.txt"
        if routes_file.exists():
            df = self.read_csv_safely(routes_file)
            info["summary"]["routes"] = len(df)
            info["files"].append("routes.txt")
            
        # stops.txt
        stops_file = gtfs_dir / "stops.txt"
        if stops_file.exists():
            df = self.read_csv_safely(stops_file)
            info["summary"]["stops"] = len(df)
            info["files"].append("stops.txt")
            
        return info
        
    def create_import_summary(self):
        """取り込み結果のサマリー作成"""
        summary = {
            "import_date": datetime.now().isoformat(),
            "processed_files": [],
            "statistics": {}
        }
        
        # 処理済みファイルの集計
        for json_file in self.processed_dir.glob("*.json"):
            summary["processed_files"].append(str(json_file.name))
            
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # 統計情報の抽出
            if "yamaguchi" in json_file.name:
                summary["statistics"]["yamaguchi"] = {
                    "tourist_spots": len(data.get("data_types", {}).get("tourist_spots", [])),
                    "events": len(data.get("data_types", {}).get("events", [])),
                    "population_areas": len(data.get("data_types", {}).get("population", []))
                }
                
        # サマリー保存
        summary_file = self.base_dir / "import_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        logger.info(f"インポートサマリー作成完了: {summary_file}")
        
        # 結果表示
        print("\n=== データ取り込み完了 ===")
        print(f"処理日時: {summary['import_date']}")
        print(f"処理ファイル数: {len(summary['processed_files'])}")
        print("\n処理済みファイル:")
        for file in summary['processed_files']:
            print(f"  - {file}")
            
        if summary["statistics"]:
            print("\n統計情報:")
            for region, stats in summary["statistics"].items():
                print(f"\n{region}:")
                for key, value in stats.items():
                    print(f"  - {key}: {value}件")
                    

def main():
    """メイン処理"""
    importer = ManualDataImporter()
    
    print("手動ダウンロードデータの取り込みを開始します...")
    print(f"データフォルダ: {importer.base_dir}")
    
    # 各種データの処理
    try:
        # 山口県オープンデータ
        importer.process_yamaguchi_opendata()
        
        # RESASデータ
        importer.process_resas_data()
        
        # GTFSデータ
        importer.process_gtfs_data()
        
        # サマリー作成
        importer.create_import_summary()
        
        print("\n全ての処理が完了しました！")
        
    except Exception as e:
        logger.error(f"エラーが発生しました: {e}")
        print(f"\nエラー: {e}")
        print("エラーの詳細はログを確認してください")
        

if __name__ == "__main__":
    main()
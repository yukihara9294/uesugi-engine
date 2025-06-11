#!/usr/bin/env python3
"""
6地域統合データ収集スクリプト
広島県、山口県、福岡県、大阪府、東京都、（岡山県）の統合データ収集

開発ロードマップに基づく6地域:
1. 広島県 - 開発拠点、初期実装済み
2. 山口県 - 隣接県として優先度高
3. 福岡県 - 九州の拠点都市
4. 大阪府 - 関西の中心地
5. 東京都 - 首都圏データ
6. 岡山県 - 中国地方の主要都市（追加予定）
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'app'))

import asyncio
import logging
from datetime import datetime
from pathlib import Path
import json
import subprocess
import concurrent.futures
from typing import Dict, List, Any

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SixRegionsIntegratedCollector:
    """6地域統合データ収集クラス"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data"
        self.scripts_dir = self.base_dir / "scripts"
        
        # 6地域の定義
        self.regions = {
            "hiroshima": {
                "name": "広島県",
                "code": "34",
                "scripts": [
                    "collect_hiroshima_opendata.py",
                    "collect_hiroshima_bus_gtfs.py"
                ],
                "priority": 1
            },
            "yamaguchi": {
                "name": "山口県", 
                "code": "35",
                "scripts": [
                    "collect_yamaguchi_data_v2.py"
                ],
                "priority": 1
            },
            "fukuoka": {
                "name": "福岡県",
                "code": "40", 
                "scripts": [
                    "collect_bodik_fukuoka_data.py"
                ],
                "priority": 2
            },
            "osaka": {
                "name": "大阪府",
                "code": "27",
                "scripts": [
                    "collect_major_cities_opendata.py"  # 大阪含む
                ],
                "priority": 2
            },
            "tokyo": {
                "name": "東京都",
                "code": "13",
                "scripts": [
                    "collect_major_cities_opendata.py"  # 東京含む
                ],
                "priority": 2
            },
            "okayama": {
                "name": "岡山県",
                "code": "33",
                "scripts": [
                    # 岡山専用スクリプトは未作成
                ],
                "priority": 3
            }
        }
        
        # 統合データディレクトリ
        self.integrated_dir = self.data_dir / "6regions_integrated"
        self.integrated_dir.mkdir(parents=True, exist_ok=True)
        
    def run_collection_script(self, script_name: str, region: str) -> Dict[str, Any]:
        """個別の収集スクリプトを実行"""
        script_path = self.scripts_dir / script_name
        
        if not script_path.exists():
            logger.warning(f"スクリプトが見つかりません: {script_path}")
            return {"status": "not_found", "region": region, "script": script_name}
            
        try:
            logger.info(f"実行中: {script_name} ({region})")
            
            # Pythonスクリプトを実行
            result = subprocess.run(
                [sys.executable, str(script_path)],
                capture_output=True,
                text=True,
                timeout=600  # 10分タイムアウト
            )
            
            if result.returncode == 0:
                logger.info(f"✅ 完了: {script_name}")
                return {
                    "status": "success",
                    "region": region,
                    "script": script_name,
                    "output": result.stdout
                }
            else:
                logger.error(f"❌ エラー: {script_name}")
                return {
                    "status": "error",
                    "region": region,
                    "script": script_name,
                    "error": result.stderr
                }
                
        except subprocess.TimeoutExpired:
            logger.error(f"⏱️ タイムアウト: {script_name}")
            return {
                "status": "timeout",
                "region": region,
                "script": script_name
            }
        except Exception as e:
            logger.error(f"例外発生: {script_name} - {str(e)}")
            return {
                "status": "exception",
                "region": region,
                "script": script_name,
                "error": str(e)
            }
            
    def collect_region_data(self, region_key: str, region_info: Dict) -> List[Dict]:
        """地域ごとのデータ収集"""
        results = []
        
        logger.info(f"\n{'='*60}")
        logger.info(f"【{region_info['name']}】データ収集開始")
        logger.info(f"{'='*60}")
        
        if not region_info["scripts"]:
            # 岡山県などスクリプトがない場合は基本データ収集
            result = self.collect_basic_opendata(region_key, region_info)
            results.append(result)
        else:
            # 既存スクリプトを実行
            for script in region_info["scripts"]:
                result = self.run_collection_script(script, region_key)
                results.append(result)
                
        return results
        
    def collect_basic_opendata(self, region_key: str, region_info: Dict) -> Dict:
        """基本的なオープンデータ収集（スクリプトがない地域用）"""
        logger.info(f"{region_info['name']}の基本データ収集を実行")
        
        # e-Stat APIを使用して基本統計データを収集
        try:
            import requests
            
            # 人口データの例
            estat_url = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"
            params = {
                "appId": os.environ.get("ESTAT_API_KEY", ""),
                "statsDataId": "0003411825",  # 人口推計
                "cdArea": region_info["code"] + "000"  # 都道府県コード
            }
            
            if params["appId"]:
                response = requests.get(estat_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    
                    # データ保存
                    output_dir = self.data_dir / region_key / "statistics"
                    output_dir.mkdir(parents=True, exist_ok=True)
                    
                    output_file = output_dir / f"population_{datetime.now().strftime('%Y%m%d')}.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
                        
                    return {
                        "status": "success",
                        "region": region_key,
                        "type": "basic_statistics",
                        "file": str(output_file)
                    }
                    
            return {
                "status": "no_api_key",
                "region": region_key,
                "message": "e-Stat APIキーが設定されていません"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "region": region_key,
                "error": str(e)
            }
            
    def collect_common_data(self):
        """全地域共通データの収集"""
        logger.info("\n【全地域共通データ収集】")
        
        common_scripts = [
            "collect_estat_data_v2.py",  # 政府統計
            "collect_plateau_data.py",    # 3D都市モデル
            "integrate_gbizinfo_api.py",  # 企業情報
            "collect_odpt_data.py"        # 公共交通
        ]
        
        results = []
        for script in common_scripts:
            if (self.scripts_dir / script).exists():
                result = self.run_collection_script(script, "common")
                results.append(result)
                
        return results
        
    def integrate_collected_data(self, all_results: Dict) -> Dict:
        """収集したデータを統合"""
        logger.info("\n【データ統合処理】")
        
        integration_summary = {
            "timestamp": datetime.now().isoformat(),
            "regions": {},
            "common_data": {},
            "statistics": {
                "total_regions": len(self.regions),
                "successful_collections": 0,
                "failed_collections": 0,
                "total_files": 0
            }
        }
        
        # 地域別データの統合
        for region, results in all_results["regions"].items():
            region_summary = {
                "name": self.regions[region]["name"],
                "code": self.regions[region]["code"],
                "collections": []
            }
            
            for result in results:
                if result["status"] == "success":
                    integration_summary["statistics"]["successful_collections"] += 1
                    region_summary["collections"].append({
                        "type": result.get("script", result.get("type", "unknown")),
                        "status": "success"
                    })
                else:
                    integration_summary["statistics"]["failed_collections"] += 1
                    region_summary["collections"].append({
                        "type": result.get("script", result.get("type", "unknown")),
                        "status": result["status"],
                        "error": result.get("error", "")
                    })
                    
            integration_summary["regions"][region] = region_summary
            
        # 共通データの統合
        for result in all_results["common"]:
            data_type = result.get("script", "unknown").replace(".py", "")
            integration_summary["common_data"][data_type] = {
                "status": result["status"],
                "error": result.get("error", "") if result["status"] != "success" else None
            }
            
        # 統合結果を保存
        summary_file = self.integrated_dir / f"integration_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(integration_summary, f, ensure_ascii=False, indent=2)
            
        logger.info(f"統合サマリー保存: {summary_file}")
        
        return integration_summary
        
    def generate_unified_database_schema(self):
        """統一データベーススキーマ生成"""
        logger.info("\n【統一データベーススキーマ生成】")
        
        schema_sql = """
-- 6地域統合データベーススキーマ
-- Generated: {timestamp}

-- 地域マスタテーブル
CREATE TABLE IF NOT EXISTS regions (
    region_code VARCHAR(2) PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL,
    region_name_en VARCHAR(50),
    priority INTEGER DEFAULT 3
);

-- 地域データ初期化
INSERT INTO regions (region_code, region_name, region_name_en, priority) VALUES
    ('34', '広島県', 'Hiroshima', 1),
    ('35', '山口県', 'Yamaguchi', 1),
    ('40', '福岡県', 'Fukuoka', 2),
    ('27', '大阪府', 'Osaka', 2),
    ('13', '東京都', 'Tokyo', 2),
    ('33', '岡山県', 'Okayama', 3)
ON CONFLICT (region_code) DO NOTHING;

-- 統合人口データテーブル
CREATE TABLE IF NOT EXISTS integrated_population (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(2) REFERENCES regions(region_code),
    city_code VARCHAR(5),
    city_name VARCHAR(100),
    population INTEGER,
    households INTEGER,
    data_year INTEGER,
    data_month INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 統合観光データテーブル
CREATE TABLE IF NOT EXISTS integrated_tourism (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(2) REFERENCES regions(region_code),
    facility_name VARCHAR(200),
    facility_type VARCHAR(50),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    visitor_count INTEGER,
    data_year INTEGER,
    data_month INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 統合イベントデータテーブル
CREATE TABLE IF NOT EXISTS integrated_events (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(2) REFERENCES regions(region_code),
    event_name VARCHAR(200),
    event_type VARCHAR(50),
    venue VARCHAR(200),
    start_date DATE,
    end_date DATE,
    expected_visitors INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 統合交通データテーブル
CREATE TABLE IF NOT EXISTS integrated_transport (
    id SERIAL PRIMARY KEY,
    region_code VARCHAR(2) REFERENCES regions(region_code),
    route_name VARCHAR(200),
    transport_type VARCHAR(50),
    operator VARCHAR(100),
    stop_count INTEGER,
    route_length_km DECIMAL(10, 2),
    geom GEOMETRY(LineString, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_population_region ON integrated_population(region_code);
CREATE INDEX idx_tourism_region ON integrated_tourism(region_code);
CREATE INDEX idx_events_region ON integrated_events(region_code);
CREATE INDEX idx_transport_region ON integrated_transport(region_code);

-- 空間インデックス
CREATE INDEX idx_tourism_geom ON integrated_tourism USING GIST (ST_MakePoint(longitude, latitude));
CREATE INDEX idx_events_geom ON integrated_events USING GIST (ST_MakePoint(longitude, latitude));
CREATE INDEX idx_transport_geom ON integrated_transport USING GIST (geom);
""".format(timestamp=datetime.now().isoformat())
        
        # スキーマファイル保存
        schema_file = self.integrated_dir / "unified_schema.sql"
        with open(schema_file, 'w', encoding='utf-8') as f:
            f.write(schema_sql)
            
        logger.info(f"統一スキーマ生成: {schema_file}")
        
        return schema_file
        
    def collect_all_regions(self):
        """全6地域のデータを収集"""
        all_results = {
            "regions": {},
            "common": []
        }
        
        # 優先度順にソート
        sorted_regions = sorted(
            self.regions.items(),
            key=lambda x: x[1]["priority"]
        )
        
        # 並列実行用のエグゼキュータ
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            # 地域ごとのデータ収集をサブミット
            future_to_region = {}
            
            for region_key, region_info in sorted_regions:
                future = executor.submit(
                    self.collect_region_data,
                    region_key,
                    region_info
                )
                future_to_region[future] = region_key
                
            # 結果を収集
            for future in concurrent.futures.as_completed(future_to_region):
                region_key = future_to_region[future]
                try:
                    results = future.result()
                    all_results["regions"][region_key] = results
                except Exception as e:
                    logger.error(f"地域データ収集エラー ({region_key}): {e}")
                    all_results["regions"][region_key] = [{
                        "status": "error",
                        "region": region_key,
                        "error": str(e)
                    }]
                    
        # 共通データ収集
        all_results["common"] = self.collect_common_data()
        
        return all_results
        
    def generate_final_report(self, integration_summary: Dict):
        """最終レポート生成"""
        report_lines = [
            "="*80,
            "6地域統合データ収集 最終レポート",
            "="*80,
            f"実行日時: {integration_summary['timestamp']}",
            "",
            "【収集統計】",
            f"- 対象地域数: {integration_summary['statistics']['total_regions']}",
            f"- 成功した収集: {integration_summary['statistics']['successful_collections']}",
            f"- 失敗した収集: {integration_summary['statistics']['failed_collections']}",
            "",
            "【地域別結果】"
        ]
        
        for region_key, region_data in integration_summary["regions"].items():
            report_lines.append(f"\n■ {region_data['name']} (コード: {region_data['code']})")
            for collection in region_data["collections"]:
                status_mark = "✅" if collection["status"] == "success" else "❌"
                report_lines.append(f"  {status_mark} {collection['type']}: {collection['status']}")
                if collection.get("error"):
                    report_lines.append(f"     エラー: {collection['error'][:100]}...")
                    
        report_lines.extend([
            "",
            "【共通データ収集結果】"
        ])
        
        for data_type, result in integration_summary["common_data"].items():
            status_mark = "✅" if result["status"] == "success" else "❌"
            report_lines.append(f"  {status_mark} {data_type}: {result['status']}")
            if result.get("error"):
                report_lines.append(f"     エラー: {result['error'][:100]}...")
                
        report_lines.extend([
            "",
            "【次のステップ】",
            "1. 収集したデータの検証",
            "2. PostgreSQLへのデータインポート",
            "3. フロントエンドとの接続テスト",
            "4. 不足データの追加収集",
            "",
            "="*80
        ])
        
        # レポート保存
        report_file = self.integrated_dir / f"final_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(report_lines))
            
        # コンソール出力
        print('\n'.join(report_lines))
        
        return report_file


def main():
    """メイン処理"""
    print("\n🚀 6地域統合データ収集システム起動")
    print("="*80)
    
    collector = SixRegionsIntegratedCollector()
    
    try:
        # 1. 全地域データ収集
        logger.info("ステップ1: データ収集開始...")
        all_results = collector.collect_all_regions()
        
        # 2. データ統合
        logger.info("\nステップ2: データ統合処理...")
        integration_summary = collector.integrate_collected_data(all_results)
        
        # 3. 統一スキーマ生成
        logger.info("\nステップ3: データベーススキーマ生成...")
        schema_file = collector.generate_unified_database_schema()
        
        # 4. 最終レポート生成
        logger.info("\nステップ4: 最終レポート生成...")
        report_file = collector.generate_final_report(integration_summary)
        
        print(f"\n✅ 処理完了！")
        print(f"統合データ: {collector.integrated_dir}")
        print(f"スキーマ: {schema_file}")
        print(f"レポート: {report_file}")
        
    except Exception as e:
        logger.error(f"処理中にエラーが発生しました: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
全オープンデータ一括ダウンロードスクリプト
広島、山口、福岡、大阪、東京の利用可能なデータを収集
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'app'))

import asyncio
import logging
from datetime import datetime
from pathlib import Path
import json

from data_collectors.download_manager import DownloadManager, DatasetRegistry
from data_collectors.comprehensive_collector import ComprehensiveDataCollector
from data_collectors.weather_collector import WeatherCollector
from data_collectors.event_collector import EventCollector

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('uesugi-engine-data/logs/download.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


async def download_phase1_basic_data():
    """フェーズ1: 基本データのダウンロード"""
    logger.info("=== Phase 1: Downloading Basic Open Data ===")
    
    manager = DownloadManager()
    
    # 優先度の高いデータセット
    priority_datasets = [
        # 人口統計
        {
            "url": "https://www.e-stat.go.jp/stat-search/files/data/000001/2020/34000.csv",
            "name": "hiroshima_population_2020.csv",
            "category": "statistics/population"
        },
        {
            "url": "https://www.e-stat.go.jp/stat-search/files/data/000001/2020/35000.csv",
            "name": "yamaguchi_population_2020.csv",
            "category": "statistics/population"
        },
        {
            "url": "https://www.e-stat.go.jp/stat-search/files/data/000001/2020/40000.csv",
            "name": "fukuoka_population_2020.csv",
            "category": "statistics/population"
        },
        {
            "url": "https://www.e-stat.go.jp/stat-search/files/data/000001/2020/27000.csv",
            "name": "osaka_population_2020.csv",
            "category": "statistics/population"
        },
        {
            "url": "https://www.e-stat.go.jp/stat-search/files/data/000001/2020/13000.csv",
            "name": "tokyo_population_2020.csv",
            "category": "statistics/population"
        },
        
        # 観光統計（サンプルURL - 実際のURLは要確認）
        {
            "url": "https://www.mlit.go.jp/kankocho/siryou/toukei/content/tourism_2023.csv",
            "name": "japan_tourism_statistics_2023.csv",
            "category": "statistics/tourism"
        }
    ]
    
    results = await manager.download_all(priority_datasets)
    return results


def collect_phase2_api_data():
    """フェーズ2: API経由のデータ収集"""
    logger.info("=== Phase 2: Collecting API Data ===")
    
    results = {}
    
    # 1. 気象データ（Open-Meteo）
    weather = WeatherCollector()
    weather_data = weather.collect_all_weather()
    results["weather"] = len(weather_data)
    
    # 2. イベントデータ
    event = EventCollector()
    event_data = event.collect_all_event_data()
    results["events"] = event_data
    
    return results


async def download_phase3_transport_data():
    """フェーズ3: 交通データのダウンロード"""
    logger.info("=== Phase 3: Downloading Transport Data ===")
    
    manager = DownloadManager()
    
    # GTFS データ
    gtfs_datasets = [
        {
            "url": "https://www.opendata.hiroden.co.jp/gtfs/latest.zip",
            "name": "hiroden_gtfs.zip",
            "category": "transport/gtfs"
        },
        # 他の事業者のGTFS（URLは要確認）
        {
            "url": "https://www.city.ube.yamaguchi.jp/opendata/gtfs/gtfs.zip",
            "name": "ube_city_gtfs.zip",
            "category": "transport/gtfs"
        }
    ]
    
    results = await manager.download_all(gtfs_datasets)
    return results


async def download_phase4_geographic_data():
    """フェーズ4: 地理空間データのダウンロード"""
    logger.info("=== Phase 4: Downloading Geographic Data ===")
    
    manager = DownloadManager()
    
    # OpenStreetMap データ（大容量注意）
    osm_datasets = [
        {
            "url": "https://download.geofabrik.de/asia/japan/chugoku-latest.osm.pbf",
            "name": "chugoku_region.osm.pbf",
            "category": "geographic/osm"
        },
        {
            "url": "https://download.geofabrik.de/asia/japan/kyushu-latest.osm.pbf",
            "name": "kyushu_region.osm.pbf",
            "category": "geographic/osm"
        },
        {
            "url": "https://download.geofabrik.de/asia/japan/kansai-latest.osm.pbf",
            "name": "kansai_region.osm.pbf",
            "category": "geographic/osm"
        },
        {
            "url": "https://download.geofabrik.de/asia/japan/kanto-latest.osm.pbf",
            "name": "kanto_region.osm.pbf",
            "category": "geographic/osm"
        }
    ]
    
    # 大容量のため個別にダウンロード
    results = {}
    for dataset in osm_datasets:
        logger.info(f"Downloading {dataset['name']}...")
        result = await manager.download_all([dataset])
        results.update(result)
        
    return results


def generate_download_report(all_results: Dict):
    """ダウンロードレポートを生成"""
    report = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_files": 0,
            "total_size": 0,
            "by_category": {}
        },
        "details": all_results
    }
    
    # 集計
    for phase, results in all_results.items():
        if isinstance(results, dict):
            for url, info in results.items():
                if isinstance(info, dict) and "filepath" in info:
                    report["summary"]["total_files"] += 1
                    size = info.get("size", 0)
                    report["summary"]["total_size"] += size
                    
                    category = info.get("category", "unknown")
                    if category not in report["summary"]["by_category"]:
                        report["summary"]["by_category"][category] = {
                            "count": 0,
                            "size": 0
                        }
                    report["summary"]["by_category"][category]["count"] += 1
                    report["summary"]["by_category"][category]["size"] += size
    
    # レポート保存
    report_path = Path("uesugi-engine-data/download_report.json")
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
        
    logger.info(f"Download report saved to {report_path}")
    
    # サマリー表示
    print("\n" + "="*60)
    print("DOWNLOAD SUMMARY")
    print("="*60)
    print(f"Total files downloaded: {report['summary']['total_files']}")
    print(f"Total size: {report['summary']['total_size']:,} bytes")
    print("\nBy category:")
    for category, stats in report['summary']['by_category'].items():
        print(f"  {category}: {stats['count']} files, {stats['size']:,} bytes")
    print("="*60)


async def main():
    """メイン処理"""
    logger.info("Starting comprehensive open data download...")
    
    # ログディレクトリ作成
    log_dir = Path("uesugi-engine-data/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    
    all_results = {}
    
    try:
        # フェーズ1: 基本データ
        phase1_results = await download_phase1_basic_data()
        all_results["phase1_basic"] = phase1_results
        
        # フェーズ2: APIデータ
        phase2_results = collect_phase2_api_data()
        all_results["phase2_api"] = phase2_results
        
        # フェーズ3: 交通データ
        phase3_results = await download_phase3_transport_data()
        all_results["phase3_transport"] = phase3_results
        
        # フェーズ4: 地理空間データ（オプション - 大容量）
        if input("\nDownload large geographic data (>1GB)? [y/N]: ").lower() == 'y':
            phase4_results = await download_phase4_geographic_data()
            all_results["phase4_geographic"] = phase4_results
            
    except Exception as e:
        logger.error(f"Error during download: {e}", exc_info=True)
        
    finally:
        # レポート生成
        generate_download_report(all_results)
        
    logger.info("Download process completed!")


if __name__ == "__main__":
    # 実行
    asyncio.run(main())
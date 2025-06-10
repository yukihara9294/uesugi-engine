"""
メインデータ収集スクリプト
すべてのデータコレクターを統合して実行
"""
import os
import json
import schedule
import time
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict

from estat_collector import EStatCollector
from weather_collector import WeatherCollector, EarthquakeCollector
from gtfs_collector import GTFSCollector
from event_collector import EventCollector

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataCollectionOrchestrator:
    """データ収集を統括するオーケストレーター"""
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data")
        self.collectors = {
            "estat": EStatCollector(),
            "weather": WeatherCollector(),
            "earthquake": EarthquakeCollector(),
            "gtfs": GTFSCollector(),
            "event": EventCollector()
        }
        
        # ログディレクトリ作成
        self.log_dir = self.data_dir / "logs"
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
    def collect_all_data(self) -> Dict:
        """
        すべてのデータを収集
        """
        start_time = datetime.now()
        logger.info("=== Starting data collection ===")
        
        results = {
            "start_time": start_time.isoformat(),
            "collectors": {}
        }
        
        # 1. マクロ統計データ（e-Stat）
        try:
            logger.info("Collecting e-Stat data...")
            estat_data = self.collectors["estat"].collect_basic_stats()
            results["collectors"]["estat"] = {
                "status": "success",
                "records": len(estat_data)
            }
        except Exception as e:
            logger.error(f"e-Stat collection failed: {e}")
            results["collectors"]["estat"] = {
                "status": "failed",
                "error": str(e)
            }
            
        # 2. 気象データ
        try:
            logger.info("Collecting weather data...")
            weather_data = self.collectors["weather"].collect_all_weather()
            results["collectors"]["weather"] = {
                "status": "success",
                "cities": len(weather_data)
            }
        except Exception as e:
            logger.error(f"Weather collection failed: {e}")
            results["collectors"]["weather"] = {
                "status": "failed",
                "error": str(e)
            }
            
        # 3. 地震データ
        try:
            logger.info("Collecting earthquake data...")
            earthquake_data = self.collectors["earthquake"].fetch_recent_earthquakes()
            results["collectors"]["earthquake"] = {
                "status": "success",
                "events": len(earthquake_data)
            }
        except Exception as e:
            logger.error(f"Earthquake collection failed: {e}")
            results["collectors"]["earthquake"] = {
                "status": "failed",
                "error": str(e)
            }
            
        # 4. 公共交通データ（GTFS）
        try:
            logger.info("Collecting GTFS data...")
            gtfs_data = self.collectors["gtfs"].collect_all_transport_data()
            results["collectors"]["gtfs"] = {
                "status": "success",
                "operators": gtfs_data
            }
        except Exception as e:
            logger.error(f"GTFS collection failed: {e}")
            results["collectors"]["gtfs"] = {
                "status": "failed",
                "error": str(e)
            }
            
        # 5. イベント・観光データ
        try:
            logger.info("Collecting event data...")
            event_data = self.collectors["event"].collect_all_event_data()
            results["collectors"]["event"] = {
                "status": "success",
                "prefectures": len(event_data.get("events", {}))
            }
        except Exception as e:
            logger.error(f"Event collection failed: {e}")
            results["collectors"]["event"] = {
                "status": "failed",
                "error": str(e)
            }
            
        # 完了時刻と処理時間
        end_time = datetime.now()
        results["end_time"] = end_time.isoformat()
        results["duration_seconds"] = (end_time - start_time).total_seconds()
        
        # 結果をログに保存
        self._save_collection_log(results)
        
        logger.info(f"=== Data collection completed in {results['duration_seconds']:.2f} seconds ===")
        return results
    
    def _save_collection_log(self, results: Dict):
        """
        収集結果のログを保存
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_path = self.log_dir / f"collection_log_{timestamp}.json"
        
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
            
    def setup_schedule(self):
        """
        定期実行のスケジュールを設定
        """
        # 毎日朝6時に実行
        schedule.every().day.at("06:00").do(self.collect_all_data)
        
        # 気象データは1時間ごと
        schedule.every().hour.do(self._collect_weather_only)
        
        # 地震データは30分ごと
        schedule.every(30).minutes.do(self._collect_earthquake_only)
        
        logger.info("Schedule setup completed")
        
    def _collect_weather_only(self):
        """気象データのみ収集"""
        try:
            self.collectors["weather"].collect_all_weather()
            logger.info("Weather data collection completed")
        except Exception as e:
            logger.error(f"Weather collection failed: {e}")
            
    def _collect_earthquake_only(self):
        """地震データのみ収集"""
        try:
            self.collectors["earthquake"].fetch_recent_earthquakes()
            logger.info("Earthquake data collection completed")
        except Exception as e:
            logger.error(f"Earthquake collection failed: {e}")
            
    def run_scheduler(self):
        """
        スケジューラーを実行
        """
        logger.info("Starting scheduler...")
        while True:
            schedule.run_pending()
            time.sleep(60)  # 1分ごとにチェック


def main():
    """
    メイン実行関数
    """
    orchestrator = DataCollectionOrchestrator()
    
    # 初回実行
    results = orchestrator.collect_all_data()
    
    # 結果サマリーを表示
    print("\n=== Collection Summary ===")
    for collector, result in results["collectors"].items():
        status = result.get("status", "unknown")
        print(f"{collector}: {status}")
        
    # スケジューラーを起動する場合
    # orchestrator.setup_schedule()
    # orchestrator.run_scheduler()


if __name__ == "__main__":
    main()
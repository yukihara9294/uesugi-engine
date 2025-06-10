"""
e-Stat API データ収集モジュール
政府統計の総合窓口（e-Stat）からデータを取得
"""
import os
import json
import requests
from datetime import datetime
from typing import Dict, List, Optional
import time
from pathlib import Path
import logging

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EStatCollector:
    """e-Stat APIを使用して統計データを収集"""
    
    BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json"
    
    # 広島県と山口県の地域コード
    AREA_CODES = {
        "広島県": "34000",
        "山口県": "35000",
        "福岡県": "40000",  # 参考用
    }
    
    # 取得する統計IDリスト（観光・人口関連）
    STAT_IDS = {
        "人口推計": "0003412316",
        "宿泊旅行統計": "0003165838", 
        "経済センサス": "0003210229",
        "観光地点等入込客数": "0003412320"
    }
    
    def __init__(self, app_id: str = None):
        """
        初期化
        Args:
            app_id: e-Stat APIのアプリケーションID（環境変数から取得）
        """
        self.app_id = app_id or os.getenv('ESTAT_APP_ID')
        if not self.app_id:
            logger.warning("e-Stat APP_ID not found. Using sample data.")
            self.app_id = "SAMPLE"  # デモ用
        
        self.data_dir = Path("uesugi-engine-data")
        
    def fetch_stat_list(self, search_word: str = "観光") -> List[Dict]:
        """
        統計表情報を検索
        """
        params = {
            "appId": self.app_id,
            "searchWord": search_word,
            "limit": 100
        }
        
        try:
            response = requests.get(f"{self.BASE_URL}/getStatsList", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("RESULT", {}).get("STATUS") != 0:
                logger.error(f"API Error: {data.get('RESULT', {}).get('ERROR_MSG')}")
                return []
                
            return data.get("GET_STATS_LIST", {}).get("DATALIST_INF", {}).get("TABLE_INF", [])
            
        except Exception as e:
            logger.error(f"Failed to fetch stat list: {e}")
            return []
    
    def fetch_stat_data(self, stats_data_id: str, area_code: str = None) -> Dict:
        """
        統計データを取得
        """
        params = {
            "appId": self.app_id,
            "statsDataId": stats_data_id,
            "limit": 10000
        }
        
        if area_code:
            params["cdArea"] = area_code
            
        try:
            response = requests.get(f"{self.BASE_URL}/getStatsData", params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get("RESULT", {}).get("STATUS") != 0:
                logger.error(f"API Error: {data.get('RESULT', {}).get('ERROR_MSG')}")
                return {}
                
            return self._format_stat_data(data)
            
        except Exception as e:
            logger.error(f"Failed to fetch stat data: {e}")
            return {}
    
    def _format_stat_data(self, raw_data: Dict) -> Dict:
        """
        e-Statデータを統一フォーマットに変換
        """
        formatted_data = {
            "data_layer": "macro_statistics",
            "source": "e-Stat",
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "stat_name": raw_data.get("GET_STATS_DATA", {}).get("STATISTICAL_DATA", {}).get("TABLE_INF", {}).get("TITLE", ""),
                "survey_date": raw_data.get("GET_STATS_DATA", {}).get("STATISTICAL_DATA", {}).get("TABLE_INF", {}).get("SURVEY_DATE", "")
            },
            "data": []
        }
        
        # データ部分の抽出
        data_values = raw_data.get("GET_STATS_DATA", {}).get("STATISTICAL_DATA", {}).get("DATA_INF", {}).get("VALUE", [])
        
        for value in data_values:
            # 地域情報の抽出
            area = value.get("@area", "")
            time_period = value.get("@time", "")
            
            formatted_data["data"].append({
                "area": area,
                "time": time_period,
                "value": value.get("$", ""),
                "unit": value.get("@unit", "")
            })
            
        return formatted_data
    
    def collect_basic_stats(self, prefectures: List[str] = ["広島県", "山口県"]) -> Dict:
        """
        基本統計データを収集
        """
        results = {}
        
        for prefecture in prefectures:
            area_code = self.AREA_CODES.get(prefecture)
            if not area_code:
                continue
                
            results[prefecture] = {}
            
            # 各統計データを取得
            for stat_name, stat_id in self.STAT_IDS.items():
                logger.info(f"Fetching {stat_name} for {prefecture}...")
                data = self.fetch_stat_data(stat_id, area_code)
                
                if data:
                    results[prefecture][stat_name] = data
                    
                # レート制限対策
                time.sleep(1)
        
        # 結果を保存
        self._save_results(results)
        return results
    
    def _save_results(self, data: Dict):
        """
        収集したデータを保存
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = self.data_dir / "raw" / f"estat_{timestamp}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Data saved to {output_path}")


# サンプル実行
if __name__ == "__main__":
    collector = EStatCollector()
    
    # 観光関連の統計を検索
    stat_list = collector.fetch_stat_list("観光 広島")
    logger.info(f"Found {len(stat_list)} statistics")
    
    # 基本統計データを収集
    # results = collector.collect_basic_stats()
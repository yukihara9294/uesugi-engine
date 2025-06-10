#!/usr/bin/env python3
"""
e-Stat APIを使用した統計データ収集スクリプト
"""
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'app'))

import requests
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import logging

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EStatCollector:
    """e-Stat APIデータコレクター"""
    
    def __init__(self):
        # .envファイルから直接読み込み
        self.api_key = "c11c2e7910b7810c15770f829b52bb1a75d283ed"
        self.base_url = "https://api.e-stat.go.jp/rest/3.0/app/json"
        self.data_dir = Path("uesugi-engine-data/estat")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def test_connection(self):
        """API接続テスト"""
        logger.info("e-Stat API接続テスト開始")
        
        url = f"{self.base_url}/getStatsList"
        params = {
            "appId": self.api_key,
            "lang": "J",
            "searchWord": "人口",
            "limit": 1
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "GET_STATS_LIST" in data:
                result = data["GET_STATS_LIST"]["RESULT"]
                if result["STATUS"] == 0:
                    logger.info("✅ e-Stat API接続成功")
                    return True
                else:
                    logger.error(f"APIエラー: {result.get('ERROR_MSG', 'Unknown error')}")
                    return False
                    
        except Exception as e:
            logger.error(f"接続エラー: {e}")
            return False
            
    def search_tourism_stats(self):
        """観光関連統計を検索"""
        logger.info("観光統計データ検索中...")
        
        url = f"{self.base_url}/getStatsList"
        params = {
            "appId": self.api_key,
            "lang": "J",
            "searchWord": "観光 旅行",
            "limit": 20
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            if "GET_STATS_LIST" in data:
                stat_list = data["GET_STATS_LIST"]
                if "DATALIST_INF" in stat_list:
                    list_inf = stat_list["DATALIST_INF"].get("LIST_INF", [])
                    
                    # 単一の結果の場合は配列に変換
                    if isinstance(list_inf, dict):
                        list_inf = [list_inf]
                        
                    for stat in list_inf:
                        results.append({
                            "id": stat.get("@id", ""),
                            "stat_name": stat.get("STAT_NAME", {}).get("$", ""),
                            "title": stat.get("TITLE", {}).get("$", ""),
                            "survey_date": stat.get("SURVEY_DATE", "")
                        })
                        
            logger.info(f"観光統計 {len(results)}件見つかりました")
            return results
            
        except Exception as e:
            logger.error(f"検索エラー: {e}")
            return []
            
    def get_population_data(self):
        """人口推計データを取得"""
        logger.info("人口推計データ取得中...")
        
        # 人口推計の統計表ID
        stats_data_id = "0003448237"
        
        # 対象都府県コード
        area_codes = {
            "13": "東京都",
            "27": "大阪府",
            "34": "広島県",
            "35": "山口県",
            "40": "福岡県"
        }
        
        results = {}
        
        for code, name in area_codes.items():
            url = f"{self.base_url}/getStatsData"
            params = {
                "appId": self.api_key,
                "lang": "J",
                "statsDataId": stats_data_id,
                "metaGetFlg": "Y",
                "cntGetFlg": "N",
                "cdArea": code,
                "cdTimeFrom": "2020000000",  # 2020年以降
                "limit": 100
            }
            
            try:
                logger.info(f"{name}のデータ取得中...")
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if "GET_STATS_DATA" in data:
                    results[name] = self._parse_stats_data(data["GET_STATS_DATA"])
                    logger.info(f"✓ {name}のデータ取得成功")
                    
            except Exception as e:
                logger.error(f"{name}のデータ取得エラー: {e}")
                
        return results
        
    def _parse_stats_data(self, stats_data):
        """統計データをパース"""
        parsed_data = []
        
        if "STATISTICAL_DATA" in stats_data:
            data_inf = stats_data["STATISTICAL_DATA"].get("DATA_INF", {})
            values = data_inf.get("VALUE", [])
            
            if isinstance(values, dict):
                values = [values]
                
            for value in values:
                if isinstance(value, dict):
                    parsed_data.append({
                        "value": value.get("$", ""),
                        "unit": value.get("@unit", ""),
                        "time": value.get("@time", ""),
                        "area": value.get("@area", "")
                    })
                    
        return parsed_data
        
    def save_results(self, data: Dict, filename: str):
        """結果を保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = self.data_dir / f"{filename}_{timestamp}.json"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"結果を保存: {filepath}")
        return filepath


def main():
    """メイン処理"""
    print("🏛️ e-Stat データ収集開始")
    print("=" * 60)
    
    collector = EStatCollector()
    
    # 1. 接続テスト
    if not collector.test_connection():
        print("❌ API接続に失敗しました")
        return
        
    # 2. 観光統計を検索
    print("\n観光統計データ検索:")
    tourism_stats = collector.search_tourism_stats()
    if tourism_stats:
        print(f"📊 {len(tourism_stats)}件の観光統計が見つかりました")
        for i, stat in enumerate(tourism_stats[:5]):  # 最初の5件を表示
            print(f"  {i+1}. {stat['stat_name']} - {stat['title']}")
            
    # 3. 人口データ取得
    print("\n人口推計データ取得:")
    population_data = collector.get_population_data()
    
    # 4. 結果を保存
    results = {
        "timestamp": datetime.now().isoformat(),
        "tourism_stats": tourism_stats,
        "population_data": population_data
    }
    
    saved_path = collector.save_results(results, "estat_collection")
    
    print("\n✅ データ収集完了！")
    print(f"保存先: {saved_path}")
    
    # サマリー表示
    print("\n" + "="*60)
    print("収集サマリー:")
    print(f"- 観光統計: {len(tourism_stats)}件")
    print(f"- 人口データ: {len(population_data)}都府県")
    print("="*60)


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
e-Stat APIを使用した統計データ収集スクリプト（改善版）
"""
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src', 'backend', 'app'))

import requests
import json
from datetime import datetime
from pathlib import Path
import logging

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class EStatCollectorV2:
    """e-Stat APIデータコレクター改善版"""
    
    def __init__(self):
        self.api_key = "c11c2e7910b7810c15770f829b52bb1a75d283ed"
        self.base_url = "https://api.e-stat.go.jp/rest/3.0/app/json"
        self.data_dir = Path("uesugi-engine-data/estat")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def get_tourism_statistics(self):
        """宿泊旅行統計データを取得"""
        logger.info("宿泊旅行統計データ取得開始")
        
        # 宿泊旅行統計調査のstatsCode
        stats_codes = {
            "00200321": "宿泊旅行統計調査"
        }
        
        results = {}
        
        for code, name in stats_codes.items():
            url = f"{self.base_url}/getStatsList"
            params = {
                "appId": self.api_key,
                "lang": "J",
                "statsCode": code,
                "limit": 10
            }
            
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if "GET_STATS_LIST" in data:
                    stat_list = data["GET_STATS_LIST"]
                    if stat_list["RESULT"]["STATUS"] == 0:
                        list_inf = stat_list.get("DATALIST_INF", {}).get("LIST_INF", [])
                        
                        if isinstance(list_inf, dict):
                            list_inf = [list_inf]
                            
                        logger.info(f"{name}: {len(list_inf)}件の統計表が見つかりました")
                        
                        # 最新のデータを取得
                        if list_inf:
                            latest_stat = list_inf[0]
                            stat_id = latest_stat.get("@id", "")
                            
                            if stat_id:
                                stat_data = self.get_detailed_stats(stat_id)
                                results[name] = {
                                    "stat_id": stat_id,
                                    "title": latest_stat.get("TITLE", {}).get("$", ""),
                                    "survey_date": latest_stat.get("SURVEY_DATE", ""),
                                    "data": stat_data
                                }
                                
            except Exception as e:
                logger.error(f"{name}の取得エラー: {e}")
                
        return results
        
    def get_population_by_prefecture(self):
        """都道府県別人口データを取得（簡易版）"""
        logger.info("都道府県別人口データ取得開始")
        
        # 国勢調査の統計表ID（2020年）
        url = f"{self.base_url}/getStatsList"
        params = {
            "appId": self.api_key,
            "lang": "J", 
            "searchWord": "都道府県 人口 総数",
            "statsCode": "00200521",  # 国勢調査
            "limit": 5
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = []
            if "GET_STATS_LIST" in data:
                stat_list = data["GET_STATS_LIST"]
                if stat_list["RESULT"]["STATUS"] == 0:
                    list_inf = stat_list.get("DATALIST_INF", {}).get("LIST_INF", [])
                    
                    if isinstance(list_inf, dict):
                        list_inf = [list_inf]
                        
                    for stat in list_inf:
                        stat_id = stat.get("@id", "")
                        title = stat.get("TITLE", {}).get("$", "")
                        
                        # 都道府県別人口のデータを探す
                        if "都道府県" in title and "人口" in title:
                            logger.info(f"統計表発見: {title}")
                            
                            # データ取得
                            stat_data = self.get_detailed_stats(stat_id, limit=200)
                            
                            results.append({
                                "stat_id": stat_id,
                                "title": title,
                                "data": stat_data
                            })
                            break
                            
            return results
            
        except Exception as e:
            logger.error(f"人口データ取得エラー: {e}")
            return []
            
    def get_detailed_stats(self, stats_data_id, limit=100):
        """統計データの詳細を取得"""
        url = f"{self.base_url}/getStatsData"
        params = {
            "appId": self.api_key,
            "lang": "J",
            "statsDataId": stats_data_id,
            "metaGetFlg": "Y",
            "cntGetFlg": "N",
            "limit": limit
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "GET_STATS_DATA" in data:
                stats_data = data["GET_STATS_DATA"]
                
                # メタ情報を取得
                class_info = {}
                if "STATISTICAL_DATA" in stats_data:
                    class_obj = stats_data["STATISTICAL_DATA"].get("CLASS_INF", {}).get("CLASS_OBJ", [])
                    if isinstance(class_obj, dict):
                        class_obj = [class_obj]
                        
                    for cls in class_obj:
                        class_info[cls.get("@id", "")] = cls.get("@name", "")
                
                # データ値を取得
                values = []
                if "STATISTICAL_DATA" in stats_data:
                    data_values = stats_data["STATISTICAL_DATA"].get("DATA_INF", {}).get("VALUE", [])
                    if isinstance(data_values, dict):
                        data_values = [data_values]
                        
                    for i, val in enumerate(data_values[:50]):  # 最初の50件
                        if isinstance(val, dict):
                            values.append({
                                "value": val.get("$", ""),
                                "unit": val.get("@unit", ""),
                                "time": val.get("@time", ""),
                                "area": val.get("@area", ""),
                                "cat01": val.get("@cat01", "")
                            })
                            
                return {
                    "class_info": class_info,
                    "values": values,
                    "total_count": len(data_values) if isinstance(data_values, list) else 1
                }
                
        except Exception as e:
            logger.error(f"詳細データ取得エラー: {e}")
            return {}
            
    def save_summary(self, all_data):
        """収集結果のサマリーを保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON保存
        json_path = self.data_dir / f"estat_summary_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
            
        # テキストサマリー作成
        summary_path = self.data_dir / f"estat_summary_{timestamp}.txt"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("e-Stat データ収集サマリー\n")
            f.write("="*60 + "\n")
            f.write(f"実行時刻: {datetime.now()}\n\n")
            
            # 宿泊統計
            if "tourism" in all_data:
                f.write("【宿泊旅行統計】\n")
                for name, data in all_data["tourism"].items():
                    f.write(f"- {data['title']}\n")
                    f.write(f"  調査期間: {data['survey_date']}\n")
                    if data['data'] and 'values' in data['data']:
                        f.write(f"  データ件数: {data['data']['total_count']}\n")
                    f.write("\n")
                    
            # 人口統計
            if "population" in all_data and all_data["population"]:
                f.write("【人口統計】\n")
                for stat in all_data["population"]:
                    f.write(f"- {stat['title']}\n")
                    if stat['data'] and 'values' in stat['data']:
                        f.write(f"  データ件数: {stat['data']['total_count']}\n")
                        
                        # 対象都府県のデータを抽出して表示
                        target_areas = ["13", "27", "34", "35", "40"]  # 東京、大阪、広島、山口、福岡
                        area_names = {"13": "東京都", "27": "大阪府", "34": "広島県", "35": "山口県", "40": "福岡県"}
                        
                        f.write("  対象都府県の人口:\n")
                        for val in stat['data']['values']:
                            if val['area'] in target_areas:
                                f.write(f"    {area_names[val['area']]}: {val['value']}{val['unit']}\n")
                    f.write("\n")
                    
        logger.info(f"サマリー保存: {summary_path}")
        return json_path, summary_path


def main():
    """メイン処理"""
    print("🏛️ e-Stat データ収集開始（改善版）")
    print("=" * 60)
    
    collector = EStatCollectorV2()
    
    all_data = {}
    
    # 1. 宿泊旅行統計
    print("\n📊 宿泊旅行統計データ取得:")
    tourism_data = collector.get_tourism_statistics()
    all_data["tourism"] = tourism_data
    print(f"✓ {len(tourism_data)}件の統計データを取得")
    
    # 2. 人口統計
    print("\n👥 都道府県別人口データ取得:")
    population_data = collector.get_population_by_prefecture()
    all_data["population"] = population_data
    print(f"✓ {len(population_data)}件の統計データを取得")
    
    # 3. 結果保存
    json_path, summary_path = collector.save_summary(all_data)
    
    print("\n✅ データ収集完了！")
    print(f"JSON保存先: {json_path}")
    print(f"サマリー: {summary_path}")
    
    # サマリー内容を表示
    print("\n" + "="*60)
    print("収集データサマリー:")
    with open(summary_path, 'r', encoding='utf-8') as f:
        print(f.read())


if __name__ == "__main__":
    main()
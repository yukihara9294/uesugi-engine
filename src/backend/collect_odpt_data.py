#!/usr/bin/env python3
"""
ODPTデータ収集スクリプト

公共交通オープンデータセンター（ODPT）から鉄道・バスデータを収集し、
Uesugi Engine形式で保存します。
"""

import os
import sys
import json
import requests
from datetime import datetime
from pathlib import Path
import time
import logging

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ODPTCollector:
    """ODPTデータ収集クラス"""
    
    def __init__(self):
        self.api_key = os.environ.get('ODPT_API_KEY')
        if not self.api_key:
            # .envファイルから読み込み
            from dotenv import load_dotenv
            load_dotenv()
            self.api_key = os.environ.get('ODPT_API_KEY')
            
        if not self.api_key:
            raise ValueError("ODPT_API_KEY が設定されていません")
            
        self.base_url = "https://api.odpt.org/api/v4"
        # Docker環境の場合は/app/dataを使用
        if os.path.exists("/app"):
            self.data_dir = Path("/app/data/uesugi-engine-data")
        else:
            self.data_dir = Path(__file__).parent.parent / "uesugi-engine-data"
        
    def _make_request(self, endpoint, params=None):
        """APIリクエストを実行"""
        if params is None:
            params = {}
        params['acl:consumerKey'] = self.api_key
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"APIリクエストエラー: {e}")
            return None
            
    def collect_operators(self):
        """事業者情報を収集"""
        logger.info("事業者情報を収集中...")
        operators = self._make_request("odpt:Operator")
        
        if operators:
            logger.info(f"{len(operators)}件の事業者情報を取得しました")
            return operators
        return []
        
    def collect_railway_data(self, region="hiroshima"):
        """鉄道データを収集"""
        logger.info(f"{region}の鉄道データを収集中...")
        
        # 広島・山口エリアの主要事業者
        target_operators = {
            "hiroshima": [
                "odpt.Operator:JR-West",  # JR西日本
                "odpt.Operator:Hiroshima",  # 広島電鉄
                "odpt.Operator:HiroshimaRapidTransit",  # 広島高速交通（アストラムライン）
            ],
            "yamaguchi": [
                "odpt.Operator:JR-West",  # JR西日本
                "odpt.Operator:NishitetsuBus",  # 西鉄バス（一部山口も運行）
            ]
        }
        
        collected_data = {
            "operators": [],
            "railways": [],
            "stations": [],
            "station_timetables": [],
            "train_timetables": [],
            "railway_fares": []
        }
        
        # 対象事業者のデータを収集
        for operator_id in target_operators.get(region, []):
            logger.info(f"事業者 {operator_id} のデータを収集中...")
            
            # 路線情報
            railways = self._make_request("odpt:Railway", {"odpt:operator": operator_id})
            if railways:
                collected_data["railways"].extend(railways)
                logger.info(f"  {len(railways)}件の路線情報を取得")
                
                # 各路線の駅情報を収集
                for railway in railways:
                    railway_id = railway.get("owl:sameAs")
                    if railway_id:
                        # 駅情報
                        stations = self._make_request("odpt:Station", {"odpt:railway": railway_id})
                        if stations:
                            collected_data["stations"].extend(stations)
                            logger.info(f"  路線 {railway_id} の駅情報: {len(stations)}件")
                            
            # レート制限対策
            time.sleep(1)
            
        return collected_data
        
    def collect_bus_data(self, region="hiroshima"):
        """バスデータを収集"""
        logger.info(f"{region}のバスデータを収集中...")
        
        # 広島・山口エリアの主要バス事業者
        target_operators = {
            "hiroshima": [
                "odpt.Operator:HiroshimaBus",  # 広島バス
                "odpt.Operator:HiroshimaElectricRailway",  # 広島電鉄バス
                "odpt.Operator:GeiyoBus",  # 芸陽バス
                "odpt.Operator:ChugokuJRBus",  # 中国JRバス
            ],
            "yamaguchi": [
                "odpt.Operator:BoufuBus",  # 防府バス
                "odpt.Operator:UbeCityBus",  # 宇部市営バス
                "odpt.Operator:ChugokuJRBus",  # 中国JRバス
            ]
        }
        
        collected_data = {
            "bus_routes": [],
            "bus_stops": [],
            "bus_timetables": [],
            "buses": []  # リアルタイムバス位置情報
        }
        
        # 対象事業者のデータを収集
        for operator_id in target_operators.get(region, []):
            logger.info(f"バス事業者 {operator_id} のデータを収集中...")
            
            # バス路線情報
            routes = self._make_request("odpt:BusroutePattern", {"odpt:operator": operator_id})
            if routes:
                collected_data["bus_routes"].extend(routes)
                logger.info(f"  {len(routes)}件のバス路線情報を取得")
                
            # バス停情報
            stops = self._make_request("odpt:BusstopPole", {"odpt:operator": operator_id})
            if stops:
                collected_data["bus_stops"].extend(stops)
                logger.info(f"  {len(stops)}件のバス停情報を取得")
                
            # バス時刻表
            timetables = self._make_request("odpt:BusTimetable", {"odpt:operator": operator_id})
            if timetables:
                collected_data["bus_timetables"].extend(timetables)
                logger.info(f"  {len(timetables)}件のバス時刻表を取得")
                
            # リアルタイムバス位置情報
            buses = self._make_request("odpt:Bus", {"odpt:operator": operator_id})
            if buses:
                collected_data["buses"].extend(buses)
                logger.info(f"  {len(buses)}台のバス位置情報を取得")
                
            # レート制限対策
            time.sleep(1)
            
        return collected_data
        
    def save_data(self, data, region, transport_type):
        """データを保存"""
        output_dir = self.data_dir / region / "transport" / transport_type / "odpt"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 各データタイプごとに保存
        for data_type, items in data.items():
            if items:
                filename = f"{data_type}_{timestamp}.json"
                filepath = output_dir / filename
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump({
                        "data_type": data_type,
                        "region": region,
                        "transport_type": transport_type,
                        "timestamp": datetime.now().isoformat(),
                        "source": "ODPT",
                        "count": len(items),
                        "data": items
                    }, f, ensure_ascii=False, indent=2)
                    
                logger.info(f"{data_type} を保存しました: {filepath}")
                
    def convert_to_uesugi_format(self, odpt_data, data_type):
        """ODPTデータをUesugi Engine形式に変換"""
        converted_data = []
        
        if data_type == "stations":
            for station in odpt_data:
                converted = {
                    "id": station.get("owl:sameAs", ""),
                    "name": station.get("dc:title", ""),
                    "name_multi": station.get("odpt:stationTitle", {}),
                    "operator": station.get("odpt:operator", ""),
                    "railway": station.get("odpt:railway", ""),
                    "station_code": station.get("odpt:stationCode", ""),
                    "coordinates": {
                        "lat": station.get("geo:lat"),
                        "lon": station.get("geo:long")
                    },
                    "connecting_railways": station.get("odpt:connectingRailway", []),
                    "connecting_stations": station.get("odpt:connectingStation", [])
                }
                converted_data.append(converted)
                
        elif data_type == "bus_stops":
            for stop in odpt_data:
                converted = {
                    "id": stop.get("owl:sameAs", ""),
                    "name": stop.get("dc:title", ""),
                    "name_kana": stop.get("odpt:kana", ""),
                    "name_multi": stop.get("title", {}),
                    "operators": stop.get("odpt:operator", []),
                    "platform_number": stop.get("odpt:platformNumber", ""),
                    "coordinates": {
                        "lat": stop.get("geo:lat"),
                        "lon": stop.get("geo:long")
                    },
                    "bus_routes": stop.get("odpt:busroutePattern", [])
                }
                converted_data.append(converted)
                
        return converted_data
        
    def run(self, regions=None):
        """データ収集を実行"""
        if regions is None:
            regions = ["hiroshima", "yamaguchi"]
            
        logger.info("ODPTデータ収集を開始します")
        
        # 事業者情報を収集
        operators = self.collect_operators()
        
        for region in regions:
            logger.info(f"\n{region}地域のデータ収集を開始")
            
            # 鉄道データ収集
            railway_data = self.collect_railway_data(region)
            if railway_data:
                self.save_data(railway_data, region, "railway")
                
                # Uesugi Engine形式に変換して保存
                if railway_data.get("stations"):
                    converted_stations = self.convert_to_uesugi_format(
                        railway_data["stations"], "stations"
                    )
                    self.save_data(
                        {"stations_uesugi": converted_stations},
                        region, "railway"
                    )
                    
            # バスデータ収集
            bus_data = self.collect_bus_data(region)
            if bus_data:
                self.save_data(bus_data, region, "bus")
                
                # Uesugi Engine形式に変換して保存
                if bus_data.get("bus_stops"):
                    converted_stops = self.convert_to_uesugi_format(
                        bus_data["bus_stops"], "bus_stops"
                    )
                    self.save_data(
                        {"bus_stops_uesugi": converted_stops},
                        region, "bus"
                    )
                    
        logger.info("\nODPTデータ収集が完了しました")
        
        # サマリーを出力
        self._print_summary()
        
    def _print_summary(self):
        """収集結果のサマリーを出力"""
        logger.info("\n=== 収集結果サマリー ===")
        
        for region in ["hiroshima", "yamaguchi"]:
            for transport in ["railway", "bus"]:
                data_dir = self.data_dir / region / "transport" / transport / "odpt"
                if data_dir.exists():
                    files = list(data_dir.glob("*.json"))
                    if files:
                        logger.info(f"\n{region} - {transport}:")
                        for file in sorted(files):
                            logger.info(f"  - {file.name}")


def main():
    """メイン処理"""
    try:
        collector = ODPTCollector()
        collector.run()
    except Exception as e:
        logger.error(f"エラーが発生しました: {e}")
        raise


if __name__ == "__main__":
    main()
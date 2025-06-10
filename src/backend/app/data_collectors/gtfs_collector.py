"""
GTFS（公共交通データ）収集モジュール
GTFS-JPおよびODPTからデータを取得
"""
import os
import json
import zipfile
import requests
from datetime import datetime
from typing import Dict, List, Optional
import pandas as pd
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class GTFSCollector:
    """GTFS形式の公共交通データを収集"""
    
    # GTFS-JP掲載事業者（広島・山口関連）
    GTFS_SOURCES = {
        "広島電鉄": {
            "url": "https://www.opendata.hiroden.co.jp/gtfs/latest.zip",
            "prefecture": "広島県",
            "type": "路面電車・バス"
        },
        "広島バス": {
            "url": None,  # 要確認
            "prefecture": "広島県", 
            "type": "バス"
        },
        "宇部市交通局": {
            "url": "https://www.city.ube.yamaguchi.jp/opendata/gtfs/gtfs.zip",
            "prefecture": "山口県",
            "type": "バス"
        },
        "サンデン交通": {
            "url": None,  # 要確認
            "prefecture": "山口県",
            "type": "バス"
        }
    }
    
    # ODPT API設定
    ODPT_BASE_URL = "https://api.odpt.org/api/v4"
    
    def __init__(self, odpt_token: str = None):
        self.data_dir = Path("uesugi-engine-data")
        self.odpt_token = odpt_token or os.getenv('ODPT_ACCESS_TOKEN')
        
    def download_gtfs(self, operator_name: str) -> bool:
        """
        GTFS形式のデータをダウンロード
        """
        source = self.GTFS_SOURCES.get(operator_name)
        if not source or not source["url"]:
            logger.warning(f"No GTFS URL for {operator_name}")
            return False
            
        try:
            # ダウンロード
            response = requests.get(source["url"], stream=True)
            response.raise_for_status()
            
            # 保存先
            timestamp = datetime.now().strftime("%Y%m%d")
            output_dir = self.data_dir / "raw" / "gtfs" / f"{operator_name}_{timestamp}"
            output_dir.mkdir(parents=True, exist_ok=True)
            
            zip_path = output_dir / "gtfs.zip"
            
            # ZIPファイルを保存
            with open(zip_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            # 解凍
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(output_dir)
                
            logger.info(f"Downloaded GTFS data for {operator_name} to {output_dir}")
            
            # GTFSデータを解析
            self._parse_gtfs(output_dir, operator_name)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to download GTFS for {operator_name}: {e}")
            return False
    
    def _parse_gtfs(self, gtfs_dir: Path, operator_name: str):
        """
        GTFSデータを解析して統一フォーマットに変換
        """
        result = {
            "data_layer": "transport",
            "source": f"GTFS-{operator_name}",
            "timestamp": datetime.now().isoformat(),
            "operator": operator_name,
            "data": {}
        }
        
        # 主要なGTFSファイルを読み込み
        gtfs_files = {
            "stops": "stops.txt",
            "routes": "routes.txt", 
            "trips": "trips.txt",
            "stop_times": "stop_times.txt",
            "shapes": "shapes.txt"
        }
        
        for key, filename in gtfs_files.items():
            file_path = gtfs_dir / filename
            if file_path.exists():
                try:
                    df = pd.read_csv(file_path)
                    result["data"][key] = df.to_dict(orient="records")
                    logger.info(f"Loaded {len(df)} records from {filename}")
                except Exception as e:
                    logger.error(f"Failed to parse {filename}: {e}")
                    
        # 処理済みデータを保存
        output_path = self.data_dir / "processed" / f"gtfs_{operator_name}_{datetime.now().strftime('%Y%m%d')}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
            
    def fetch_odpt_data(self, data_type: str = "Station") -> List[Dict]:
        """
        ODPTからデータを取得
        """
        if not self.odpt_token:
            logger.warning("ODPT token not found")
            return []
            
        headers = {
            "acl:consumerKey": self.odpt_token
        }
        
        # 山口県・広島県の事業者を絞り込み
        params = {}
        
        try:
            response = requests.get(
                f"{self.ODPT_BASE_URL}/odpt:{data_type}",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            # 地域でフィルタリング
            filtered_data = []
            for item in data:
                # 簡易的なフィルタリング（実際はより詳細な判定が必要）
                if any(keyword in str(item) for keyword in ["広島", "山口", "Hiroshima", "Yamaguchi"]):
                    filtered_data.append(item)
                    
            return filtered_data
            
        except Exception as e:
            logger.error(f"Failed to fetch ODPT data: {e}")
            return []
    
    def collect_all_transport_data(self):
        """
        全交通データを収集
        """
        results = {
            "gtfs": {},
            "odpt": {}
        }
        
        # GTFSデータ収集
        for operator in self.GTFS_SOURCES.keys():
            logger.info(f"Collecting GTFS data for {operator}...")
            success = self.download_gtfs(operator)
            results["gtfs"][operator] = success
            
        # ODPTデータ収集
        for data_type in ["Station", "Railway", "Bus"]:
            logger.info(f"Collecting ODPT {data_type} data...")
            data = self.fetch_odpt_data(data_type)
            results["odpt"][data_type] = len(data)
            
        return results


# リアルタイム運行情報コレクター
class RealtimeTransportCollector:
    """リアルタイム運行情報を収集"""
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data")
        
    def fetch_train_delay(self) -> List[Dict]:
        """
        列車遅延情報を取得（仮実装）
        """
        # 実際にはJR西日本や各鉄道会社のAPIから取得
        return []
    
    def fetch_bus_location(self) -> List[Dict]:
        """
        バスロケーション情報を取得（仮実装）
        """
        # 実際には各バス会社のGTFS-RTから取得
        return []


if __name__ == "__main__":
    # GTFSデータ収集テスト
    collector = GTFSCollector()
    
    # 広島電鉄のGTFSをダウンロード
    # collector.download_gtfs("広島電鉄")
    
    # ODPTデータ取得テスト
    # stations = collector.fetch_odpt_data("Station")
#!/usr/bin/env python3
"""
広島県バス協会GTFSデータ収集スクリプト

広島県バス協会が提供するGTFS（General Transit Feed Specification）データを
ダウンロードして解析し、Uesugi Engine用のデータフォーマットに変換します。

参考URL: https://www.bus-kyo.or.jp/gtfs-open-data
"""

import requests
import zipfile
import os
import csv
import json
from datetime import datetime
from pathlib import Path
import logging
from typing import Dict, List, Optional
# pandas is not used in this script

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HiroshimaBusGTFSCollector:
    """広島県バス協会のGTFSデータを収集・処理するクラス"""
    
    def __init__(self):
        self.base_url = "https://www.bus-kyo.or.jp"
        self.data_dir = Path("uesugi-engine-data/hiroshima/transport/bus")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir = self.data_dir / "temp"
        self.temp_dir.mkdir(exist_ok=True)
        
    def download_gtfs_data(self) -> Optional[Path]:
        """GTFSデータをダウンロード"""
        logger.info("広島県バス協会のGTFSデータページを確認中...")
        
        # GTFSデータのダウンロードURLを構築
        # 広島県バス協会のGTFSデータ（各事業者別）
        gtfs_urls = [
            # 広島電鉄（広電）
            ("広島電鉄", "https://ajt-mobusta-gtfs.mcapps.jp/static/8/latest.zip"),
            ("広島電鉄（現在）", "https://ajt-mobusta-gtfs.mcapps.jp/static/8/current_data.zip"),
            # 広島バス
            ("広島バス", "https://ajt-mobusta-gtfs.mcapps.jp/static/9/latest.zip"),
            ("広島バス（現在）", "https://ajt-mobusta-gtfs.mcapps.jp/static/9/current_data.zip"),
        ]
        
        downloaded_file = None
        
        for name, url in gtfs_urls:
            try:
                logger.info(f"{name}のGTFSデータをダウンロード中: {url}")
                
                headers = {
                    'User-Agent': 'Uesugi-Engine/1.0 (Causal Inference Platform)',
                    'Accept': 'application/zip, application/octet-stream',
                    'Accept-Language': 'ja,en;q=0.9'
                }
                
                response = requests.get(url, headers=headers, timeout=30, stream=True)
                
                if response.status_code == 200:
                    # ファイル名を事業者名を含むものに
                    safe_name = name.replace(" ", "_").replace("（", "_").replace("）", "")
                    zip_path = self.temp_dir / f"{safe_name}_gtfs.zip"
                    
                    # ストリーミングダウンロード
                    with open(zip_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    logger.info(f"GTFSデータのダウンロード完了: {zip_path}")
                    downloaded_file = zip_path
                    break
                    
                elif response.status_code == 404:
                    logger.warning(f"データが見つかりません: {url}")
                else:
                    logger.warning(f"ダウンロード失敗 (HTTP {response.status_code}): {url}")
                    
            except Exception as e:
                logger.error(f"ダウンロードエラー: {url}, {str(e)}")
                
        if not downloaded_file:
            # 直接ダウンロードが失敗した場合の代替手段
            logger.info("直接ダウンロードに失敗。手動ダウンロードの手順を提供します。")
            self._provide_manual_download_instructions()
            
        return downloaded_file
    
    def _provide_manual_download_instructions(self):
        """手動ダウンロード手順を提供"""
        instructions = """
        ===== 手動ダウンロード手順 =====
        
        1. ブラウザで以下のURLにアクセス:
           https://www.bus-kyo.or.jp/gtfs-open-data
        
        2. ページ内のGTFSデータダウンロードリンクをクリック
        
        3. ダウンロードしたZIPファイルを以下のパスに配置:
           ~/projects/uesugi-engine/uesugi-engine-data/hiroshima/transport/bus/temp/hiroshima_bus_gtfs.zip
        
        4. 配置後、このスクリプトを再実行してください:
           python3 scripts/collect_hiroshima_bus_gtfs.py --skip-download
        
        ================================
        """
        print(instructions)
        
        # 手動ダウンロード用の情報をJSONに保存
        manual_info = {
            "download_url": "https://www.bus-kyo.or.jp/gtfs-open-data",
            "target_path": str(self.temp_dir / "hiroshima_bus_gtfs.zip"),
            "instructions": instructions,
            "timestamp": datetime.now().isoformat()
        }
        
        with open(self.data_dir / "manual_download_required.json", 'w', encoding='utf-8') as f:
            json.dump(manual_info, f, ensure_ascii=False, indent=2)
    
    def extract_gtfs_data(self, zip_path: Path) -> Path:
        """GTFSデータを解凍"""
        extract_dir = self.data_dir / "gtfs_extracted"
        extract_dir.mkdir(exist_ok=True)
        
        logger.info(f"GTFSデータを解凍中: {zip_path}")
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
            logger.info(f"解凍完了: {extract_dir}")
            return extract_dir
        except Exception as e:
            logger.error(f"解凍エラー: {str(e)}")
            raise
    
    def parse_gtfs_data(self, gtfs_dir: Path) -> Dict:
        """GTFSデータを解析してUesugi Engine用フォーマットに変換"""
        logger.info("GTFSデータの解析を開始...")
        
        result = {
            "metadata": {
                "source": "広島県バス協会",
                "data_type": "GTFS",
                "collected_at": datetime.now().isoformat(),
                "url": "https://www.bus-kyo.or.jp/gtfs-open-data"
            },
            "agencies": [],
            "routes": [],
            "stops": [],
            "stop_times": [],
            "shapes": [],
            "summary": {}
        }
        
        # 1. 事業者情報 (agency.txt)
        agency_file = gtfs_dir / "agency.txt"
        if agency_file.exists():
            logger.info("事業者情報を読み込み中...")
            agencies = self._read_csv_file(agency_file)
            result["agencies"] = agencies
            logger.info(f"事業者数: {len(agencies)}")
        
        # 2. 路線情報 (routes.txt)
        routes_file = gtfs_dir / "routes.txt"
        if routes_file.exists():
            logger.info("路線情報を読み込み中...")
            routes = self._read_csv_file(routes_file)
            result["routes"] = routes
            logger.info(f"路線数: {len(routes)}")
            
            # 路線タイプ別集計
            route_types = {}
            for route in routes:
                route_type = route.get('route_type', 'unknown')
                route_types[route_type] = route_types.get(route_type, 0) + 1
            result["summary"]["route_types"] = route_types
        
        # 3. 停留所情報 (stops.txt)
        stops_file = gtfs_dir / "stops.txt"
        if stops_file.exists():
            logger.info("停留所情報を読み込み中...")
            stops = self._read_csv_file(stops_file)
            result["stops"] = stops
            logger.info(f"停留所数: {len(stops)}")
            
            # 停留所の地理的分布
            if stops:
                lats = [float(s['stop_lat']) for s in stops if 'stop_lat' in s]
                lons = [float(s['stop_lon']) for s in stops if 'stop_lon' in s]
                if lats and lons:
                    result["summary"]["geographic_bounds"] = {
                        "min_lat": min(lats),
                        "max_lat": max(lats),
                        "min_lon": min(lons),
                        "max_lon": max(lons),
                        "center_lat": sum(lats) / len(lats),
                        "center_lon": sum(lons) / len(lons)
                    }
        
        # 4. 時刻表情報 (stop_times.txt) - サンプルのみ
        stop_times_file = gtfs_dir / "stop_times.txt"
        if stop_times_file.exists():
            logger.info("時刻表情報を読み込み中（サンプル）...")
            # 大きなファイルの可能性があるため、最初の1000行のみ
            stop_times = self._read_csv_file(stop_times_file, limit=1000)
            result["stop_times"] = stop_times
            
            # 全体の行数をカウント
            with open(stop_times_file, 'r', encoding='utf-8') as f:
                total_stop_times = sum(1 for line in f) - 1  # ヘッダー行を除く
            result["summary"]["total_stop_times"] = total_stop_times
            logger.info(f"時刻表データ数: {total_stop_times}")
        
        # 5. 形状情報 (shapes.txt) - オプション
        shapes_file = gtfs_dir / "shapes.txt"
        if shapes_file.exists():
            logger.info("路線形状情報を読み込み中...")
            shapes = self._read_csv_file(shapes_file, limit=5000)
            result["shapes"] = shapes
            logger.info(f"形状ポイント数: {len(shapes)}")
        
        return result
    
    def _read_csv_file(self, file_path: Path, limit: Optional[int] = None) -> List[Dict]:
        """CSVファイルを読み込んでリスト形式で返す"""
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    if limit and i >= limit:
                        break
                    data.append(dict(row))
        except Exception as e:
            logger.error(f"CSVファイル読み込みエラー: {file_path}, {str(e)}")
        return data
    
    def convert_to_uesugi_format(self, gtfs_data: Dict) -> Dict:
        """GTFSデータをUesugi Engine用のフォーマットに変換"""
        logger.info("Uesugi Engine用フォーマットへの変換を開始...")
        
        uesugi_data = {
            "data_type": "public_transport",
            "region": "広島県",
            "transport_mode": "bus",
            "timestamp": datetime.now().isoformat(),
            "source": gtfs_data["metadata"],
            "operators": [],
            "routes": [],
            "stops": [],
            "analytics": {
                "total_operators": len(gtfs_data["agencies"]),
                "total_routes": len(gtfs_data["routes"]),
                "total_stops": len(gtfs_data["stops"]),
                "coverage_area": gtfs_data["summary"].get("geographic_bounds", {}),
                "route_types": gtfs_data["summary"].get("route_types", {})
            }
        }
        
        # 事業者情報の変換
        for agency in gtfs_data["agencies"]:
            uesugi_data["operators"].append({
                "id": agency.get("agency_id"),
                "name": agency.get("agency_name"),
                "url": agency.get("agency_url"),
                "timezone": agency.get("agency_timezone")
            })
        
        # 路線情報の変換（上位50路線のみ）
        for route in gtfs_data["routes"][:50]:
            uesugi_data["routes"].append({
                "id": route.get("route_id"),
                "short_name": route.get("route_short_name"),
                "long_name": route.get("route_long_name"),
                "type": self._get_route_type_name(route.get("route_type")),
                "color": route.get("route_color"),
                "operator_id": route.get("agency_id")
            })
        
        # 停留所情報の変換（主要停留所のみ）
        major_stops = self._identify_major_stops(gtfs_data["stops"], gtfs_data.get("stop_times", []))
        for stop in major_stops[:200]:  # 上位200停留所
            uesugi_data["stops"].append({
                "id": stop.get("stop_id"),
                "name": stop.get("stop_name"),
                "coordinates": {
                    "lat": float(stop.get("stop_lat", 0)),
                    "lon": float(stop.get("stop_lon", 0))
                },
                "type": "bus_stop",
                "zone_id": stop.get("zone_id")
            })
        
        return uesugi_data
    
    def _get_route_type_name(self, route_type: str) -> str:
        """GTFSのroute_typeを分かりやすい名前に変換"""
        route_type_map = {
            "0": "路面電車",
            "1": "地下鉄",
            "2": "鉄道",
            "3": "バス",
            "4": "フェリー",
            "5": "ケーブルカー",
            "6": "ゴンドラ",
            "7": "ケーブルカー"
        }
        return route_type_map.get(str(route_type), "バス")
    
    def _identify_major_stops(self, stops: List[Dict], stop_times: List[Dict]) -> List[Dict]:
        """主要停留所を特定（乗降回数が多い順）"""
        if not stop_times:
            return stops[:200]  # 時刻表データがない場合は最初の200件
        
        # 停留所ごとの利用頻度をカウント
        stop_frequency = {}
        for st in stop_times:
            stop_id = st.get("stop_id")
            if stop_id:
                stop_frequency[stop_id] = stop_frequency.get(stop_id, 0) + 1
        
        # 頻度順にソート
        sorted_stops = sorted(stops, 
                            key=lambda s: stop_frequency.get(s.get("stop_id"), 0), 
                            reverse=True)
        
        return sorted_stops
    
    def save_data(self, data: Dict):
        """データを保存"""
        # JSON形式で保存
        output_file = self.data_dir / f"hiroshima_bus_data_{datetime.now().strftime('%Y%m%d')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"データ保存完了: {output_file}")
        
        # サマリー情報を別途保存
        summary_file = self.data_dir / "data_summary.json"
        summary = {
            "last_updated": datetime.now().isoformat(),
            "data_file": output_file.name,
            "analytics": data.get("analytics", {}),
            "total_data_points": {
                "operators": len(data.get("operators", [])),
                "routes": len(data.get("routes", [])),
                "stops": len(data.get("stops", []))
            }
        }
        
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        logger.info(f"サマリー保存完了: {summary_file}")
    
    def run(self, skip_download: bool = False):
        """メイン処理の実行"""
        logger.info("広島県バス協会GTFSデータ収集処理を開始...")
        
        try:
            # 1. データのダウンロード
            if skip_download:
                # 手動でダウンロードしたファイルを確認
                zip_path = self.temp_dir / "hiroshima_bus_gtfs.zip"
                if not zip_path.exists():
                    logger.error(f"GTFSファイルが見つかりません: {zip_path}")
                    return
            else:
                zip_path = self.download_gtfs_data()
                if not zip_path:
                    logger.warning("GTFSデータのダウンロードに失敗しました。")
                    return
            
            # 2. データの解凍
            gtfs_dir = self.extract_gtfs_data(zip_path)
            
            # 3. データの解析
            gtfs_data = self.parse_gtfs_data(gtfs_dir)
            
            # 4. Uesugi Engine形式への変換
            uesugi_data = self.convert_to_uesugi_format(gtfs_data)
            
            # 5. データの保存
            self.save_data(uesugi_data)
            
            logger.info("処理完了！")
            
            # 結果サマリーの表示
            print("\n===== 収集結果サマリー =====")
            print(f"事業者数: {uesugi_data['analytics']['total_operators']}")
            print(f"路線数: {uesugi_data['analytics']['total_routes']}")
            print(f"停留所数: {uesugi_data['analytics']['total_stops']}")
            print(f"カバーエリア: {uesugi_data['analytics'].get('coverage_area', {})}")
            print("=============================\n")
            
        except Exception as e:
            logger.error(f"処理中にエラーが発生しました: {str(e)}")
            raise


def main():
    """メイン関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='広島県バス協会GTFSデータ収集スクリプト')
    parser.add_argument('--skip-download', action='store_true', 
                       help='ダウンロードをスキップ（手動ダウンロード済みの場合）')
    
    args = parser.parse_args()
    
    collector = HiroshimaBusGTFSCollector()
    collector.run(skip_download=args.skip_download)


if __name__ == "__main__":
    main()
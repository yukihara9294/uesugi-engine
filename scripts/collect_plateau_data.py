#!/usr/bin/env python3
"""
PLATEAU 3D都市モデルデータ収集スクリプト

国土交通省のPLATEAUプロジェクトから建物属性データを取得し、
Uesugi Engine用に変換・保存します。
"""

import os
import sys
import json
import requests
from datetime import datetime
from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET
import logging
from typing import Dict, List, Optional
import geopandas as gpd
from shapely.geometry import Polygon, Point

# プロジェクトルートをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PLATEAUCollector:
    """PLATEAU 3D都市モデルデータ収集クラス"""
    
    # 対象都市と都市コード
    TARGET_CITIES = {
        "tokyo": {
            "name": "東京都",
            "codes": ["13100", "13101", "13102", "13103", "13104", "13105"],  # 23区の一部
            "available": True
        },
        "osaka": {
            "name": "大阪府",
            "codes": ["27100", "27127"],  # 大阪市
            "available": True
        },
        "fukuoka": {
            "name": "福岡県", 
            "codes": ["40130", "40100"],  # 福岡市、北九州市
            "available": True
        },
        "hiroshima": {
            "name": "広島県",
            "codes": ["34100"],  # 広島市
            "available": True
        },
        "yamaguchi": {
            "name": "山口県",
            "codes": [],  # PLATEAUデータなし
            "available": False
        }
    }
    
    def __init__(self):
        self.ckan_url = "https://www.geospatial.jp/ckan/api/3"
        self.data_dir = Path(__file__).parent.parent / "uesugi-engine-data" / "plateau"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def search_plateau_datasets(self, city_code: str) -> List[Dict]:
        """PLATEAUデータセットを検索"""
        logger.info(f"都市コード {city_code} のPLATEAUデータを検索中...")
        
        try:
            # CKAN APIでデータセット検索
            params = {
                "q": f"plateau {city_code} bldg",  # 建物（bldg）データを検索
                "rows": 100,
                "start": 0
            }
            
            response = requests.get(
                f"{self.ckan_url}/action/package_search",
                params=params,
                timeout=30
            )
            response.raise_for_status()
            
            result = response.json()
            if result.get("success"):
                datasets = result.get("result", {}).get("results", [])
                logger.info(f"{len(datasets)}件のデータセットが見つかりました")
                return datasets
            else:
                logger.error(f"検索失敗: {result.get('error')}")
                return []
                
        except requests.exceptions.RequestException as e:
            logger.error(f"API接続エラー: {e}")
            return []
            
    def get_building_attributes_url(self, dataset: Dict) -> Optional[str]:
        """データセットから建物属性データのURLを取得"""
        resources = dataset.get("resources", [])
        
        for resource in resources:
            # 建物属性データを含むリソースを探す
            name = resource.get("name", "").lower()
            format = resource.get("format", "").lower()
            
            if ("bldg" in name or "建物" in name) and format in ["zip", "citygml", "gml"]:
                return resource.get("url")
                
        return None
        
    def download_and_extract(self, url: str, city_code: str) -> Path:
        """データをダウンロードして展開"""
        city_dir = self.data_dir / city_code
        city_dir.mkdir(exist_ok=True)
        
        filename = url.split("/")[-1]
        if not filename.endswith(".zip"):
            filename += ".zip"
            
        filepath = city_dir / filename
        
        # 既存ファイルがあればスキップ
        if filepath.exists():
            logger.info(f"既存ファイルを使用: {filepath}")
            return city_dir
            
        logger.info(f"ダウンロード中: {url}")
        
        try:
            response = requests.get(url, stream=True, timeout=300)
            response.raise_for_status()
            
            with open(filepath, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            logger.info(f"ダウンロード完了: {filepath}")
            
            # ZIP展開
            with zipfile.ZipFile(filepath, 'r') as zip_ref:
                zip_ref.extractall(city_dir)
                
            logger.info(f"展開完了: {city_dir}")
            return city_dir
            
        except Exception as e:
            logger.error(f"ダウンロード/展開エラー: {e}")
            return None
            
    def parse_citygml_attributes(self, gml_file: Path) -> List[Dict]:
        """CityGMLから建物属性を抽出（簡易版）"""
        logger.info(f"CityGML解析中: {gml_file}")
        
        buildings = []
        
        try:
            # 名前空間の定義
            namespaces = {
                'core': 'http://www.opengis.net/citygml/2.0',
                'bldg': 'http://www.opengis.net/citygml/building/2.0',
                'gml': 'http://www.opengis.net/gml'
            }
            
            tree = ET.parse(gml_file)
            root = tree.getroot()
            
            # 建物要素を検索
            for building in root.findall('.//bldg:Building', namespaces):
                attrs = {}
                
                # 建物ID
                attrs['id'] = building.get('{http://www.opengis.net/gml}id', '')
                
                # 高さ
                height_elem = building.find('.//bldg:measuredHeight', namespaces)
                if height_elem is not None:
                    attrs['height'] = float(height_elem.text)
                    
                # 階数
                storeys_elem = building.find('.//bldg:storeysAboveGround', namespaces)
                if storeys_elem is not None:
                    attrs['storeys'] = int(storeys_elem.text)
                    
                # 用途
                usage_elem = building.find('.//bldg:usage', namespaces)
                if usage_elem is not None:
                    attrs['usage'] = usage_elem.text
                    
                # 建築年
                year_elem = building.find('.//bldg:yearOfConstruction', namespaces)
                if year_elem is not None:
                    attrs['year_built'] = int(year_elem.text)
                    
                # TODO: 座標情報の抽出（複雑なため省略）
                
                if attrs:
                    buildings.append(attrs)
                    
            logger.info(f"{len(buildings)}件の建物データを抽出")
            return buildings
            
        except Exception as e:
            logger.error(f"CityGML解析エラー: {e}")
            return []
            
    def convert_to_uesugi_format(self, buildings: List[Dict], city_name: str) -> Dict:
        """建物データをUesugi Engine形式に変換"""
        return {
            "type": "FeatureCollection",
            "metadata": {
                "source": "PLATEAU",
                "city": city_name,
                "collected_at": datetime.now().isoformat(),
                "building_count": len(buildings)
            },
            "features": [
                {
                    "type": "Feature",
                    "properties": {
                        "id": bldg.get("id"),
                        "height": bldg.get("height"),
                        "storeys": bldg.get("storeys"),
                        "usage": bldg.get("usage"),
                        "year_built": bldg.get("year_built"),
                        "earthquake_risk": self._calculate_earthquake_risk(bldg),
                        "estimated_population": self._estimate_population(bldg)
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [0, 0]  # TODO: 実際の座標を設定
                    }
                }
                for bldg in buildings
            ]
        }
        
    def _calculate_earthquake_risk(self, building: Dict) -> str:
        """建築年から地震リスクを推定"""
        year = building.get("year_built", 2000)
        
        if year < 1981:
            return "high"  # 旧耐震基準
        elif year < 2000:
            return "medium"  # 新耐震基準
        else:
            return "low"  # 2000年基準
            
    def _estimate_population(self, building: Dict) -> int:
        """建物用途と階数から居住人口を推定"""
        usage = building.get("usage", "").lower()
        storeys = building.get("storeys", 1)
        
        if "住宅" in usage or "マンション" in usage:
            # 1階あたり4世帯、1世帯2.5人と仮定
            return int(storeys * 4 * 2.5)
        else:
            return 0
            
    def collect_all_cities(self):
        """全対象都市のPLATEAUデータを収集"""
        results = {}
        
        for city_key, city_info in self.TARGET_CITIES.items():
            if not city_info["available"]:
                logger.info(f"{city_info['name']}はPLATEAUデータが利用できません")
                continue
                
            city_results = []
            
            for city_code in city_info["codes"]:
                logger.info(f"\n{city_info['name']} ({city_code}) の処理を開始")
                
                # データセット検索
                datasets = self.search_plateau_datasets(city_code)
                
                for dataset in datasets[:1]:  # デモのため最初の1件のみ処理
                    # 建物データURL取得
                    url = self.get_building_attributes_url(dataset)
                    if not url:
                        continue
                        
                    # ダウンロード・展開
                    extract_dir = self.download_and_extract(url, city_code)
                    if not extract_dir:
                        continue
                        
                    # CityGMLファイルを探す
                    gml_files = list(extract_dir.glob("**/*.gml"))
                    if not gml_files:
                        logger.warning("CityGMLファイルが見つかりません")
                        continue
                        
                    # 属性抽出（最初のファイルのみ）
                    buildings = self.parse_citygml_attributes(gml_files[0])
                    
                    # Uesugi形式に変換
                    uesugi_data = self.convert_to_uesugi_format(
                        buildings, 
                        city_info["name"]
                    )
                    
                    # 保存
                    output_file = self.data_dir / f"{city_code}_buildings.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(uesugi_data, f, ensure_ascii=False, indent=2)
                        
                    logger.info(f"保存完了: {output_file}")
                    city_results.append(output_file)
                    
            results[city_key] = city_results
            
        return results
        
    def create_summary_report(self, results: Dict):
        """収集結果のサマリーレポート作成"""
        summary = {
            "collection_date": datetime.now().isoformat(),
            "total_cities": len([r for r in results.values() if r]),
            "cities": {}
        }
        
        for city_key, files in results.items():
            city_info = self.TARGET_CITIES[city_key]
            summary["cities"][city_key] = {
                "name": city_info["name"],
                "available": city_info["available"],
                "files_collected": len(files),
                "file_paths": [str(f) for f in files]
            }
            
        summary_file = self.data_dir / "collection_summary.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        logger.info(f"サマリーレポート作成: {summary_file}")
        

def main():
    """メイン処理"""
    collector = PLATEAUCollector()
    
    logger.info("PLATEAU 3D都市モデルデータ収集を開始します")
    logger.info("対象: 東京都、大阪府、福岡県、広島県")
    
    # 全都市のデータ収集
    results = collector.collect_all_cities()
    
    # サマリーレポート作成
    collector.create_summary_report(results)
    
    logger.info("\nPLATEAUデータ収集が完了しました")
    

if __name__ == "__main__":
    main()
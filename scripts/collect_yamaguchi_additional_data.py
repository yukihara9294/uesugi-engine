#!/usr/bin/env python3
"""
山口県追加オープンデータ収集スクリプト
交通（GTFS）、医療施設、教育施設、防災施設等の追加データを収集
"""
import requests
import json
import csv
from datetime import datetime
from pathlib import Path
import logging
import time
import zipfile
import os

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class YamaguchiAdditionalDataCollector:
    """山口県追加データ収集クラス"""
    
    def __init__(self):
        self.base_url = "https://yamaguchi-opendata.jp/ckan/api/3/action"
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data" / "yamaguchi"
        
        # 追加カテゴリ用ディレクトリ作成
        self.transport_dir = self.data_dir / "transport"
        self.medical_dir = self.data_dir / "medical"
        self.education_dir = self.data_dir / "education" 
        self.disaster_dir = self.data_dir / "disaster"
        self.facilities_dir = self.data_dir / "facilities"
        
        for dir in [self.transport_dir, self.medical_dir, self.education_dir, 
                    self.disaster_dir, self.facilities_dir]:
            dir.mkdir(parents=True, exist_ok=True)
            
        # GTFSサブディレクトリ
        self.gtfs_dir = self.transport_dir / "gtfs"
        self.gtfs_dir.mkdir(exist_ok=True)
        
        # 収集結果を保存
        self.collection_results = {
            "timestamp": datetime.now().isoformat(),
            "transport": [],
            "medical": [],
            "education": [],
            "disaster": [],
            "facilities": []
        }
        
    def search_and_download(self, keywords, category, category_dir):
        """キーワードでデータを検索してダウンロード"""
        all_results = []
        
        for keyword in keywords:
            logger.info(f"🔍 検索中: {keyword}")
            url = f"{self.base_url}/package_search"
            params = {
                "q": keyword,
                "rows": 100
            }
            
            try:
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data["success"] and data["result"]["results"]:
                    results = data["result"]["results"]
                    logger.info(f"  → {len(results)}件のデータセットが見つかりました")
                    
                    for package in results:
                        package_info = {
                            "id": package["id"],
                            "title": package["title"],
                            "organization": package.get("organization", {}).get("title", ""),
                            "resources": []
                        }
                        
                        # リソースをダウンロード
                        for resource in package.get("resources", []):
                            if resource["format"].upper() in ["CSV", "JSON", "XLS", "XLSX", "ZIP"]:
                                file_path = self.download_resource(resource, category_dir)
                                if file_path:
                                    package_info["resources"].append({
                                        "name": resource["name"],
                                        "format": resource["format"],
                                        "file": str(file_path),
                                        "url": resource["url"]
                                    })
                                    
                                    # ZIPファイルの場合は展開
                                    if resource["format"].upper() == "ZIP" and file_path.suffix == ".zip":
                                        self.extract_zip(file_path, category_dir)
                        
                        if package_info["resources"]:
                            all_results.append(package_info)
                            
                time.sleep(1)  # API負荷軽減
                
            except Exception as e:
                logger.error(f"検索エラー ({keyword}): {e}")
                
        self.collection_results[category] = all_results
        return all_results
        
    def download_resource(self, resource, category_dir):
        """リソースファイルをダウンロード"""
        try:
            url = resource["url"]
            format = resource["format"].upper()
            
            # ファイル名を生成
            filename = resource["name"].replace('/', '_').replace('\\', '_')
            if not filename.endswith(f'.{format.lower()}'):
                filename += f'.{format.lower()}'
            
            # ダウンロード
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            file_path = category_dir / filename
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        
            logger.info(f"    ✅ ダウンロード: {filename}")
            return file_path
            
        except Exception as e:
            logger.error(f"    ❌ ダウンロードエラー: {e}")
            return None
            
    def extract_zip(self, zip_path, extract_dir):
        """ZIPファイルを展開（GTFSデータ用）"""
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                extract_path = extract_dir / zip_path.stem
                extract_path.mkdir(exist_ok=True)
                zip_ref.extractall(extract_path)
                logger.info(f"    📦 ZIP展開完了: {extract_path}")
                
                # GTFSファイルの確認
                gtfs_files = ['agency.txt', 'stops.txt', 'routes.txt', 'trips.txt', 'stop_times.txt']
                found_files = [f for f in gtfs_files if (extract_path / f).exists()]
                if found_files:
                    logger.info(f"    🚌 GTFSファイル検出: {', '.join(found_files)}")
                    
        except Exception as e:
            logger.error(f"    ❌ ZIP展開エラー: {e}")
            
    def collect_transport_data(self):
        """交通関連データの収集"""
        logger.info("\n=== 交通データ収集開始 ===")
        keywords = [
            "バス", "鉄道", "交通", "GTFS", "時刻表", "路線",
            "バス停", "駅", "公共交通", "運行", "交通機関"
        ]
        return self.search_and_download(keywords, "transport", self.transport_dir)
        
    def collect_medical_data(self):
        """医療施設データの収集"""
        logger.info("\n=== 医療施設データ収集開始 ===")
        keywords = [
            "病院", "診療所", "医療", "クリニック", "医療機関",
            "薬局", "歯科", "医院", "救急", "医療施設"
        ]
        return self.search_and_download(keywords, "medical", self.medical_dir)
        
    def collect_education_data(self):
        """教育施設データの収集"""
        logger.info("\n=== 教育施設データ収集開始 ===")
        keywords = [
            "学校", "小学校", "中学校", "高校", "大学",
            "幼稚園", "保育園", "教育", "学校一覧", "教育施設"
        ]
        return self.search_and_download(keywords, "education", self.education_dir)
        
    def collect_disaster_data(self):
        """防災関連データの収集"""
        logger.info("\n=== 防災データ収集開始 ===")
        keywords = [
            "避難所", "避難場所", "防災", "災害", "緊急",
            "防災施設", "避難施設", "防災拠点", "AED", "消防"
        ]
        return self.search_and_download(keywords, "disaster", self.disaster_dir)
        
    def collect_facilities_data(self):
        """公共施設データの収集"""
        logger.info("\n=== 公共施設データ収集開始 ===")
        keywords = [
            "公共施設", "市役所", "町役場", "公民館", "図書館",
            "体育館", "文化施設", "スポーツ施設", "コミュニティセンター"
        ]
        return self.search_and_download(keywords, "facilities", self.facilities_dir)
        
    def check_existing_gtfs(self):
        """既存のGTFSデータをチェック"""
        logger.info("\n=== 既存GTFSデータチェック ===")
        
        # 広島のGTFSデータパスをチェック
        hiroshima_gtfs = self.base_dir / "uesugi-engine-data" / "hiroshima" / "transport" / "bus" / "gtfs_extracted"
        if hiroshima_gtfs.exists():
            logger.info(f"✅ 広島GTFSデータ発見: {hiroshima_gtfs}")
            
        # 山口県内のGTFSを探す
        yamaguchi_gtfs_files = list(self.transport_dir.rglob("*.txt"))
        if yamaguchi_gtfs_files:
            logger.info(f"✅ 山口県GTFSファイル発見: {len(yamaguchi_gtfs_files)}個")
            for f in yamaguchi_gtfs_files[:5]:  # 最初の5個だけ表示
                logger.info(f"  - {f.name}")
                
    def save_collection_summary(self):
        """収集結果のサマリーを保存"""
        summary_path = self.data_dir / f"additional_data_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # 統計情報を追加
        stats = {
            "total_datasets": sum(len(v) for v in self.collection_results.values() if isinstance(v, list)),
            "by_category": {
                k: len(v) if isinstance(v, list) else 0 
                for k, v in self.collection_results.items() if k != "timestamp"
            }
        }
        self.collection_results["statistics"] = stats
        
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(self.collection_results, f, ensure_ascii=False, indent=2)
            
        logger.info(f"\n📊 収集サマリー保存: {summary_path}")
        logger.info(f"   総データセット数: {stats['total_datasets']}")
        for category, count in stats["by_category"].items():
            logger.info(f"   - {category}: {count}件")
            
    def run(self):
        """全カテゴリのデータを収集"""
        logger.info("山口県追加データ収集開始")
        logger.info(f"データ保存先: {self.data_dir}")
        
        # 既存データチェック
        self.check_existing_gtfs()
        
        # 各カテゴリのデータ収集
        self.collect_transport_data()
        self.collect_medical_data()
        self.collect_education_data()
        self.collect_disaster_data()
        self.collect_facilities_data()
        
        # サマリー保存
        self.save_collection_summary()
        
        logger.info("\n✅ 全データ収集完了！")


if __name__ == "__main__":
    collector = YamaguchiAdditionalDataCollector()
    collector.run()
#!/usr/bin/env python3
"""
6地域データ統合処理スクリプト
収集済みデータを統合してPostgreSQLに投入
"""
import json
import pandas as pd
from pathlib import Path
import logging
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SixRegionsDataIntegrator:
    """6地域データ統合クラス"""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data"
        self.integrated_dir = self.data_dir / "6regions_integrated"
        self.integrated_dir.mkdir(parents=True, exist_ok=True)
        
        # データベース接続情報
        self.db_config = {
            "host": os.environ.get("DB_HOST", "localhost"),
            "port": os.environ.get("DB_PORT", "5432"),
            "database": os.environ.get("DB_NAME", "uesugi_db"),
            "user": os.environ.get("DB_USER", "postgres"),
            "password": os.environ.get("DB_PASSWORD", "postgres")
        }
        
        # 地域情報
        self.regions = {
            "hiroshima": {"name": "広島県", "code": "34"},
            "yamaguchi": {"name": "山口県", "code": "35"},
            "fukuoka": {"name": "福岡県", "code": "40"},
            "osaka": {"name": "大阪府", "code": "27"},
            "tokyo": {"name": "東京都", "code": "13"},
            "okayama": {"name": "岡山県", "code": "33"}
        }
        
    def collect_existing_data(self):
        """既存の収集データを確認"""
        logger.info("収集済みデータの確認中...")
        
        data_summary = {}
        
        for region_key, region_info in self.regions.items():
            region_dir = self.data_dir / region_key
            data_summary[region_key] = {
                "name": region_info["name"],
                "code": region_info["code"],
                "data_types": {}
            }
            
            if region_dir.exists():
                # 各カテゴリのデータを確認
                categories = ["tourism", "population", "events", "policy", "transport"]
                
                for category in categories:
                    category_dir = region_dir / category
                    if category_dir.exists():
                        files = list(category_dir.glob("*"))
                        data_summary[region_key]["data_types"][category] = {
                            "file_count": len(files),
                            "files": [f.name for f in files[:5]]  # 最初の5ファイル
                        }
                        
        return data_summary
        
    def integrate_population_data(self):
        """人口データの統合"""
        logger.info("人口データ統合開始...")
        
        integrated_population = []
        
        # 山口県の人口データ処理
        yamaguchi_pop_dir = self.data_dir / "yamaguchi" / "population"
        if yamaguchi_pop_dir.exists():
            for csv_file in yamaguchi_pop_dir.glob("*.csv"):
                try:
                    df = pd.read_csv(csv_file, encoding='utf-8')
                    
                    # データフォーマットの推測と標準化
                    if '人口' in str(csv_file) or 'population' in str(csv_file):
                        # 基本的な人口データとして処理
                        record = {
                            "region_code": "35",
                            "region_name": "山口県",
                            "file_name": csv_file.name,
                            "data_type": "population",
                            "row_count": len(df),
                            "columns": list(df.columns)
                        }
                        integrated_population.append(record)
                        
                except Exception as e:
                    logger.error(f"CSVファイル読み込みエラー ({csv_file}): {e}")
                    
        # 統合結果を保存
        integration_file = self.integrated_dir / f"integrated_population_{datetime.now().strftime('%Y%m%d')}.json"
        with open(integration_file, 'w', encoding='utf-8') as f:
            json.dump(integrated_population, f, ensure_ascii=False, indent=2)
            
        logger.info(f"人口データ統合完了: {len(integrated_population)}ファイル")
        
        return integrated_population
        
    def integrate_transport_data(self):
        """交通データの統合"""
        logger.info("交通データ統合開始...")
        
        integrated_transport = []
        
        # 広島県のGTFSデータ処理
        hiroshima_gtfs = self.data_dir / "hiroshima" / "transport" / "bus" / "hiroshima_bus_data_20250611.json"
        if hiroshima_gtfs.exists():
            with open(hiroshima_gtfs, 'r', encoding='utf-8') as f:
                gtfs_data = json.load(f)
                
            integrated_transport.append({
                "region_code": "34",
                "region_name": "広島県",
                "transport_type": "bus",
                "operator": "広島電鉄",
                "routes": gtfs_data.get("routes_count", 0),
                "stops": gtfs_data.get("stops_count", 0),
                "data_source": "GTFS"
            })
            
        # 統合結果を保存
        integration_file = self.integrated_dir / f"integrated_transport_{datetime.now().strftime('%Y%m%d')}.json"
        with open(integration_file, 'w', encoding='utf-8') as f:
            json.dump(integrated_transport, f, ensure_ascii=False, indent=2)
            
        logger.info(f"交通データ統合完了: {len(integrated_transport)}件")
        
        return integrated_transport
        
    def integrate_opendata_catalogs(self):
        """オープンデータカタログの統合"""
        logger.info("オープンデータカタログ統合開始...")
        
        integrated_catalogs = []
        
        # 主要都市のカタログデータ
        major_cities_dir = self.data_dir / "major-cities"
        if major_cities_dir.exists():
            for json_file in major_cities_dir.glob("*_opendata_catalog.json"):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        catalog_data = json.load(f)
                        
                    city_name = json_file.stem.replace("_opendata_catalog", "")
                    
                    # 地域コードのマッピング
                    region_mapping = {
                        "tokyo": "13",
                        "osaka": "27",
                        "fukuoka": "40"
                    }
                    
                    if city_name in region_mapping:
                        integrated_catalogs.append({
                            "region_code": region_mapping[city_name],
                            "region_name": self.regions[city_name]["name"],
                            "catalog_source": catalog_data.get("source"),
                            "dataset_count": len(catalog_data.get("datasets", [])),
                            "categories": catalog_data.get("categories", []),
                            "last_updated": catalog_data.get("last_updated")
                        })
                        
                except Exception as e:
                    logger.error(f"カタログファイル読み込みエラー ({json_file}): {e}")
                    
        # 統合結果を保存
        integration_file = self.integrated_dir / f"integrated_catalogs_{datetime.now().strftime('%Y%m%d')}.json"
        with open(integration_file, 'w', encoding='utf-8') as f:
            json.dump(integrated_catalogs, f, ensure_ascii=False, indent=2)
            
        logger.info(f"カタログデータ統合完了: {len(integrated_catalogs)}件")
        
        return integrated_catalogs
        
    def create_integration_summary(self, results):
        """統合結果のサマリー作成"""
        summary = {
            "timestamp": datetime.now().isoformat(),
            "integration_results": {
                "population": len(results.get("population", [])),
                "transport": len(results.get("transport", [])),
                "catalogs": len(results.get("catalogs", [])),
                "total_regions_with_data": 0
            },
            "region_coverage": {},
            "next_steps": []
        }
        
        # 地域別カバレッジ
        covered_regions = set()
        
        for data_type, data_list in results.items():
            for item in data_list:
                if "region_code" in item:
                    covered_regions.add(item["region_code"])
                    
        summary["integration_results"]["total_regions_with_data"] = len(covered_regions)
        
        # 各地域のカバレッジ状況
        for region_key, region_info in self.regions.items():
            has_data = region_info["code"] in covered_regions
            summary["region_coverage"][region_key] = {
                "name": region_info["name"],
                "has_data": has_data,
                "status": "✅ データあり" if has_data else "❌ データなし"
            }
            
        # 次のステップ
        if len(covered_regions) < 6:
            summary["next_steps"].append("不足している地域のデータ収集を実施")
        summary["next_steps"].extend([
            "PostgreSQLへのデータインポート実行",
            "フロントエンドとのAPI接続テスト",
            "データ品質の検証"
        ])
        
        # サマリー保存
        summary_file = self.integrated_dir / f"integration_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        # レポート出力
        self._print_summary_report(summary)
        
        return summary_file
        
    def _print_summary_report(self, summary):
        """サマリーレポートの表示"""
        print("\n" + "="*70)
        print("6地域データ統合サマリー")
        print("="*70)
        print(f"実行時刻: {summary['timestamp']}")
        print(f"\n【統合結果】")
        print(f"- 人口データ: {summary['integration_results']['population']}件")
        print(f"- 交通データ: {summary['integration_results']['transport']}件")
        print(f"- カタログデータ: {summary['integration_results']['catalogs']}件")
        print(f"- データのある地域数: {summary['integration_results']['total_regions_with_data']}/6")
        
        print(f"\n【地域別カバレッジ】")
        for region, info in summary['region_coverage'].items():
            print(f"- {info['name']}: {info['status']}")
            
        print(f"\n【次のステップ】")
        for i, step in enumerate(summary['next_steps'], 1):
            print(f"{i}. {step}")
            
        print("\n" + "="*70)
        
    def setup_database(self):
        """データベースのセットアップ"""
        logger.info("データベース接続確認中...")
        
        try:
            conn = psycopg2.connect(**self.db_config)
            conn.close()
            logger.info("✅ データベース接続成功")
            return True
        except Exception as e:
            logger.error(f"❌ データベース接続失敗: {e}")
            logger.info("Docker環境でPostgreSQLが起動していることを確認してください")
            return False


def main():
    """メイン処理"""
    print("\n🔄 6地域データ統合処理")
    print("="*70)
    
    integrator = SixRegionsDataIntegrator()
    
    # 1. 既存データの確認
    logger.info("ステップ1: 収集済みデータの確認")
    data_summary = integrator.collect_existing_data()
    
    print("\n【収集済みデータ】")
    for region, info in data_summary.items():
        print(f"\n{info['name']} ({info['code']}):")
        if info['data_types']:
            for category, details in info['data_types'].items():
                print(f"  - {category}: {details['file_count']}ファイル")
        else:
            print("  - データなし")
            
    # 2. データ統合処理
    logger.info("\nステップ2: データ統合処理")
    
    results = {
        "population": integrator.integrate_population_data(),
        "transport": integrator.integrate_transport_data(),
        "catalogs": integrator.integrate_opendata_catalogs()
    }
    
    # 3. 統合サマリー作成
    logger.info("\nステップ3: 統合サマリー作成")
    summary_file = integrator.create_integration_summary(results)
    
    # 4. データベース接続確認
    logger.info("\nステップ4: データベース環境確認")
    db_ready = integrator.setup_database()
    
    if db_ready:
        print("\n✅ データベースへのインポート準備完了")
    else:
        print("\n⚠️ データベース接続に失敗しました")
        print("以下のコマンドでDocker環境を起動してください:")
        print("  cd ~/projects/uesugi-engine")
        print("  docker-compose up -d")
        
    print(f"\n統合結果: {integrator.integrated_dir}")
    print(f"サマリー: {summary_file}")
    
    print("\n" + "="*70)


if __name__ == "__main__":
    main()
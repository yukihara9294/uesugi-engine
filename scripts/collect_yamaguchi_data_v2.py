#!/usr/bin/env python3
"""
山口県オープンデータポータル データ収集スクリプト V2
実際のCSVファイルをダウンロードし、PostgreSQLへのインポート準備も行う
"""
import requests
import json
import csv
from datetime import datetime
from pathlib import Path
import logging
import time
from urllib.parse import urlparse
import os

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class YamaguchiDataCollectorV2:
    """山口県オープンデータ収集・ダウンロード版"""
    
    def __init__(self):
        self.base_url = "https://yamaguchi-opendata.jp/ckan/api/3/action"
        # プロジェクトルートからの相対パス
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data" / "yamaguchi"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # カテゴリ別ディレクトリ作成
        self.tourism_dir = self.data_dir / "tourism"
        self.population_dir = self.data_dir / "population"
        self.events_dir = self.data_dir / "events"
        self.policy_dir = self.data_dir / "policy"
        
        for dir in [self.tourism_dir, self.population_dir, self.events_dir, self.policy_dir]:
            dir.mkdir(exist_ok=True)
        
    def search_packages(self, query, rows=1000):
        """データセットを検索（最大件数取得）"""
        url = f"{self.base_url}/package_search"
        params = {
            "q": query,
            "rows": rows
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data["success"]:
                return data["result"]["results"]
            else:
                return []
                
        except Exception as e:
            logger.error(f"検索エラー: {e}")
            return []
            
    def download_resource(self, resource, category_dir):
        """リソースファイルをダウンロード"""
        try:
            url = resource["url"]
            format = resource["format"].upper()
            
            # ファイル名を生成（URLから取得またはリソース名から）
            if url.endswith(('.csv', '.json', '.xls', '.xlsx')):
                filename = os.path.basename(urlparse(url).path)
            else:
                filename = f"{resource['name']}.{format.lower()}"
            
            # 日本語ファイル名の処理
            filename = filename.replace('/', '_').replace('\\', '_')
            
            # ダウンロード
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            file_path = category_dir / filename
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        
            logger.info(f"✅ ダウンロード完了: {filename}")
            
            # CSVの場合は文字コード変換を試みる
            if format == "CSV":
                self.convert_csv_encoding(file_path)
                
            return file_path
            
        except Exception as e:
            logger.error(f"❌ ダウンロードエラー ({resource['name']}): {e}")
            return None
            
    def convert_csv_encoding(self, file_path):
        """CSVファイルの文字コードをUTF-8に変換"""
        try:
            # まずShift-JISとして読み込みを試みる
            encodings = ['shift_jis', 'cp932', 'utf-8', 'utf-8-sig']
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    
                    # UTF-8で書き直し
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    
                    logger.info(f"文字コード変換完了: {encoding} → UTF-8")
                    break
                except UnicodeDecodeError:
                    continue
                    
        except Exception as e:
            logger.warning(f"文字コード変換スキップ: {e}")
            
    def collect_all_data(self):
        """全カテゴリのデータを収集・ダウンロード"""
        logger.info("="*60)
        logger.info("山口県オープンデータ収集開始")
        logger.info("="*60)
        
        # 収集統計
        stats = {
            "tourism": {"count": 0, "downloaded": 0},
            "population": {"count": 0, "downloaded": 0},
            "events": {"count": 0, "downloaded": 0},
            "policy": {"count": 0, "downloaded": 0}
        }
        
        # 1. 観光データ
        logger.info("\n【観光関連データ収集】")
        tourism_keywords = ["観光", "宿泊", "観光客", "来訪者", "観光施設"]
        tourism_datasets = self._collect_by_keywords(tourism_keywords, self.tourism_dir, stats["tourism"])
        
        # 2. 人口データ
        logger.info("\n【人口統計データ収集】")
        population_keywords = ["人口", "世帯", "年齢別", "地域別人口"]
        population_datasets = self._collect_by_keywords(population_keywords, self.population_dir, stats["population"])
        
        # 3. イベントデータ
        logger.info("\n【イベント情報収集】")
        event_keywords = ["イベント", "祭り", "催し", "行事", "フェスティバル"]
        event_datasets = self._collect_by_keywords(event_keywords, self.events_dir, stats["events"])
        
        # 4. 政策関連データ
        logger.info("\n【政策・行政データ収集】")
        policy_keywords = ["予算", "決算", "計画", "施策", "事業", "統計"]
        policy_datasets = self._collect_by_keywords(policy_keywords, self.policy_dir, stats["policy"])
        
        # サマリー作成
        self._save_summary(stats, {
            "tourism": tourism_datasets,
            "population": population_datasets,
            "events": event_datasets,
            "policy": policy_datasets
        })
        
        return stats
        
    def _collect_by_keywords(self, keywords, category_dir, stats):
        """キーワードでデータを収集"""
        collected_ids = set()
        datasets = []
        
        for keyword in keywords:
            logger.info(f"'{keyword}'で検索中...")
            results = self.search_packages(keyword)
            
            for dataset in results:
                if dataset["id"] in collected_ids:
                    continue
                    
                collected_ids.add(dataset["id"])
                dataset_info = {
                    "id": dataset["id"],
                    "name": dataset["name"],
                    "title": dataset["title"],
                    "notes": dataset.get("notes", ""),
                    "organization": dataset.get("organization", {}).get("title", ""),
                    "resources": []
                }
                
                # CSV/Excel/JSONリソースをダウンロード
                for resource in dataset.get("resources", []):
                    if resource["format"].upper() in ["CSV", "JSON", "XLS", "XLSX"]:
                        file_path = self.download_resource(resource, category_dir)
                        if file_path:
                            dataset_info["resources"].append({
                                "name": resource["name"],
                                "format": resource["format"],
                                "file_path": str(file_path),
                                "url": resource["url"]
                            })
                            stats["downloaded"] += 1
                        time.sleep(0.5)  # サーバー負荷軽減
                        
                if dataset_info["resources"]:
                    datasets.append(dataset_info)
                    stats["count"] += 1
                    
        logger.info(f"収集完了: {stats['count']}件のデータセット, {stats['downloaded']}ファイル")
        return datasets
        
    def _save_summary(self, stats, all_data):
        """収集結果のサマリーを保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 統計情報
        summary = {
            "timestamp": datetime.now().isoformat(),
            "stats": stats,
            "total_datasets": sum(s["count"] for s in stats.values()),
            "total_files": sum(s["downloaded"] for s in stats.values()),
            "data": all_data
        }
        
        # JSON保存
        json_path = self.data_dir / f"collection_summary_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        # テキストレポート
        report_path = self.data_dir / f"collection_report_{timestamp}.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("山口県オープンデータ収集レポート\n")
            f.write("="*60 + "\n")
            f.write(f"実行時刻: {datetime.now()}\n")
            f.write(f"総データセット数: {summary['total_datasets']}件\n")
            f.write(f"総ダウンロードファイル数: {summary['total_files']}件\n\n")
            
            # カテゴリ別統計
            for category, stat in stats.items():
                f.write(f"\n【{category.upper()}】\n")
                f.write(f"データセット数: {stat['count']}件\n")
                f.write(f"ダウンロード数: {stat['downloaded']}ファイル\n")
                
                # 最初の5件を表示
                if category in all_data and all_data[category]:
                    f.write("主なデータセット:\n")
                    for ds in all_data[category][:5]:
                        f.write(f"- {ds['title']} ({len(ds['resources'])}ファイル)\n")
                        
        # PostgreSQL用インポートスクリプト生成
        self._generate_import_script(all_data)
        
        logger.info(f"\n✅ 収集完了！")
        logger.info(f"サマリー: {json_path}")
        logger.info(f"レポート: {report_path}")
        
        return json_path, report_path
        
    def _generate_import_script(self, all_data):
        """PostgreSQLインポート用スクリプト生成"""
        script_path = self.data_dir / "import_to_postgresql.sh"
        
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write("#!/bin/bash\n")
            f.write("# 山口県データPostgreSQLインポートスクリプト\n\n")
            
            f.write("# データベース接続情報\n")
            f.write("DB_HOST=${DB_HOST:-localhost}\n")
            f.write("DB_PORT=${DB_PORT:-5432}\n")
            f.write("DB_NAME=${DB_NAME:-uesugi_db}\n")
            f.write("DB_USER=${DB_USER:-postgres}\n\n")
            
            # カテゴリ別インポート
            for category, datasets in all_data.items():
                f.write(f"\n# {category.upper()} データインポート\n")
                
                for dataset in datasets:
                    for resource in dataset["resources"]:
                        if resource["format"].upper() == "CSV":
                            table_name = f"yamaguchi_{category}_{dataset['name'].replace('-', '_')}"
                            file_path = resource["file_path"]
                            
                            f.write(f"\n# {dataset['title']}\n")
                            f.write(f"echo 'Importing {dataset['title']}...'\n")
                            f.write(f"psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"\n")
                            f.write(f"  DROP TABLE IF EXISTS {table_name};\n")
                            f.write(f"  CREATE TABLE {table_name} AS\n")
                            f.write(f"  SELECT * FROM CSVREAD('{file_path}');\n")
                            f.write(f"\"\n")
                            
        os.chmod(script_path, 0o755)
        logger.info(f"インポートスクリプト生成: {script_path}")


def main():
    """メイン処理"""
    print("\n🏛️ 山口県オープンデータ収集・ダウンロード V2")
    print("="*60)
    
    collector = YamaguchiDataCollectorV2()
    
    # 全データ収集・ダウンロード実行
    stats = collector.collect_all_data()
    
    print("\n✅ 収集完了統計:")
    print(f"- 総データセット数: {sum(s['count'] for s in stats.values())}件")
    print(f"- 総ダウンロードファイル数: {sum(s['downloaded'] for s in stats.values())}件")
    print(f"\nデータ保存先: {collector.data_dir}")
    
    # インポート手順表示
    print("\n📝 PostgreSQLへのインポート:")
    print("1. Docker環境が起動していることを確認")
    print("2. cd uesugi-engine-data/yamaguchi")
    print("3. ./import_to_postgresql.sh を実行")


if __name__ == "__main__":
    main()
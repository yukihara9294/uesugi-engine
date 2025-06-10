#!/usr/bin/env python3
"""
山口県オープンデータポータル データ収集スクリプト
登録不要で利用可能
"""
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


class YamaguchiOpenDataCollector:
    """山口県オープンデータ収集"""
    
    def __init__(self):
        self.base_url = "https://yamaguchi-opendata.jp/ckan/api/3/action"
        self.data_dir = Path("uesugi-engine-data/yamaguchi")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
    def get_package_list(self):
        """データセット一覧を取得"""
        url = f"{self.base_url}/package_list"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            data = response.json()
            
            if data["success"]:
                return data["result"]
            else:
                logger.error("パッケージリスト取得失敗")
                return []
                
        except Exception as e:
            logger.error(f"エラー: {e}")
            return []
            
    def search_packages(self, query):
        """データセットを検索"""
        url = f"{self.base_url}/package_search"
        params = {
            "q": query,
            "rows": 100
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
            
    def get_package_details(self, package_id):
        """データセットの詳細情報を取得"""
        url = f"{self.base_url}/package_show"
        params = {"id": package_id}
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data["success"]:
                return data["result"]
            else:
                return None
                
        except Exception as e:
            logger.error(f"詳細取得エラー: {e}")
            return None
            
    def download_resource(self, resource_url, filename):
        """リソースファイルをダウンロード"""
        try:
            response = requests.get(resource_url, stream=True)
            response.raise_for_status()
            
            file_path = self.data_dir / filename
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
                    
            logger.info(f"ダウンロード完了: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"ダウンロードエラー: {e}")
            return None
            
    def collect_tourism_data(self):
        """観光関連データを収集"""
        logger.info("観光関連データ収集開始")
        
        # 観光関連キーワードで検索
        keywords = ["観光", "宿泊", "イベント", "観光客", "来訪者"]
        tourism_datasets = []
        
        for keyword in keywords:
            logger.info(f"'{keyword}'で検索中...")
            results = self.search_packages(keyword)
            
            for dataset in results:
                dataset_info = {
                    "id": dataset["id"],
                    "name": dataset["name"],
                    "title": dataset["title"],
                    "notes": dataset.get("notes", ""),
                    "resources": []
                }
                
                # リソース情報を取得
                for resource in dataset.get("resources", []):
                    if resource["format"].upper() in ["CSV", "JSON", "XLS", "XLSX"]:
                        dataset_info["resources"].append({
                            "name": resource["name"],
                            "format": resource["format"],
                            "url": resource["url"],
                            "size": resource.get("size", "unknown")
                        })
                        
                if dataset_info["resources"]:
                    tourism_datasets.append(dataset_info)
                    
        logger.info(f"観光関連データセット: {len(tourism_datasets)}件")
        return tourism_datasets
        
    def collect_population_data(self):
        """人口統計データを収集"""
        logger.info("人口統計データ収集開始")
        
        population_datasets = []
        results = self.search_packages("人口")
        
        for dataset in results:
            dataset_info = {
                "id": dataset["id"],
                "name": dataset["name"],
                "title": dataset["title"],
                "resources": []
            }
            
            # CSV/Excelファイルのみ対象
            for resource in dataset.get("resources", []):
                if resource["format"].upper() in ["CSV", "XLS", "XLSX"]:
                    dataset_info["resources"].append({
                        "name": resource["name"],
                        "format": resource["format"],
                        "url": resource["url"]
                    })
                    
            if dataset_info["resources"]:
                population_datasets.append(dataset_info)
                
        logger.info(f"人口統計データセット: {len(population_datasets)}件")
        return population_datasets
        
    def collect_event_data(self):
        """イベント情報を収集"""
        logger.info("イベント情報収集開始")
        
        event_datasets = []
        keywords = ["イベント", "祭り", "催し", "行事"]
        
        for keyword in keywords:
            results = self.search_packages(keyword)
            
            for dataset in results:
                if dataset["id"] not in [d["id"] for d in event_datasets]:
                    event_datasets.append({
                        "id": dataset["id"],
                        "name": dataset["name"], 
                        "title": dataset["title"],
                        "notes": dataset.get("notes", "")
                    })
                    
        logger.info(f"イベントデータセット: {len(event_datasets)}件")
        return event_datasets
        
    def save_summary(self, all_data):
        """収集結果のサマリーを保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # JSON保存
        json_path = self.data_dir / f"yamaguchi_summary_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
            
        # テキストサマリー
        summary_path = self.data_dir / f"yamaguchi_summary_{timestamp}.txt"
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write("山口県オープンデータ収集サマリー\n")
            f.write("="*60 + "\n")
            f.write(f"実行時刻: {datetime.now()}\n")
            f.write(f"APIステータス: ✅ 登録不要・利用可能\n\n")
            
            # 観光データ
            f.write(f"【観光関連データ】\n")
            f.write(f"データセット数: {len(all_data['tourism'])}件\n")
            for dataset in all_data['tourism'][:5]:
                f.write(f"- {dataset['title']}\n")
                
            f.write(f"\n【人口統計データ】\n")
            f.write(f"データセット数: {len(all_data['population'])}件\n")
            for dataset in all_data['population'][:5]:
                f.write(f"- {dataset['title']}\n")
                
            f.write(f"\n【イベント情報】\n")
            f.write(f"データセット数: {len(all_data['events'])}件\n")
            for dataset in all_data['events'][:5]:
                f.write(f"- {dataset['title']}\n")
                
        logger.info(f"サマリー保存: {summary_path}")
        return json_path, summary_path


def main():
    """メイン処理"""
    print("🏛️ 山口県オープンデータ収集開始")
    print("="*60)
    print("✅ APIキー不要・登録不要で利用可能！")
    print()
    
    collector = YamaguchiOpenDataCollector()
    
    # データ収集
    all_data = {
        "timestamp": datetime.now().isoformat(),
        "tourism": collector.collect_tourism_data(),
        "population": collector.collect_population_data(),
        "events": collector.collect_event_data()
    }
    
    # サマリー保存
    json_path, summary_path = collector.save_summary(all_data)
    
    print("\n✅ データ収集完了！")
    print(f"JSON保存先: {json_path}")
    print(f"サマリー: {summary_path}")
    
    # サマリー表示
    with open(summary_path, 'r', encoding='utf-8') as f:
        print("\n" + f.read())
        
    # ダウンロード可能なリソース数を表示
    total_resources = sum(len(d.get("resources", [])) for d in all_data["tourism"])
    print(f"\n📥 ダウンロード可能なリソース: {total_resources}件")
    
    # サンプルダウンロード（最初の1件）
    if all_data["tourism"] and all_data["tourism"][0]["resources"]:
        first_resource = all_data["tourism"][0]["resources"][0]
        print(f"\nサンプルダウンロード: {first_resource['name']}")
        # 実際のダウンロードはコメントアウト（必要に応じて有効化）
        # collector.download_resource(first_resource['url'], f"sample_{first_resource['name']}")


if __name__ == "__main__":
    main()
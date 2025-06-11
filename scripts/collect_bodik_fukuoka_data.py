#!/usr/bin/env python3
"""
BODIK（九州オープンデータ推進会議）福岡県データ収集スクリプト
BODIKはCKAN APIを提供しており、福岡県を含む九州各県のデータが利用可能
"""
import requests
import json
from datetime import datetime
from pathlib import Path
import logging
import time
import os

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BODIKFukuokaDataCollector:
    """BODIK経由で福岡県データを収集"""
    
    def __init__(self):
        self.base_url = "https://data.bodik.jp/api/3/action"
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data" / "fukuoka"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # カテゴリ別ディレクトリ
        self.tourism_dir = self.data_dir / "tourism"
        self.population_dir = self.data_dir / "population"
        self.transport_dir = self.data_dir / "transport"
        self.policy_dir = self.data_dir / "policy"
        
        for dir in [self.tourism_dir, self.population_dir, self.transport_dir, self.policy_dir]:
            dir.mkdir(exist_ok=True)
            
    def search_packages(self, query, organization=None, rows=100):
        """パッケージを検索"""
        url = f"{self.base_url}/package_search"
        params = {
            "q": query,
            "rows": rows,
            "start": 0
        }
        
        # 福岡県に限定
        if organization:
            params["fq"] = f"organization:{organization}"
        else:
            # 福岡関連のキーワードで絞り込み
            params["q"] = f"{query} AND (福岡 OR fukuoka)"
            
        all_results = []
        
        try:
            while True:
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data["success"]:
                    results = data["result"]["results"]
                    all_results.extend(results)
                    
                    # 次のページがあるか確認
                    if len(results) < rows:
                        break
                    params["start"] += rows
                    
                else:
                    logger.error(f"検索失敗: {data.get('error', 'Unknown error')}")
                    break
                    
        except Exception as e:
            logger.error(f"API エラー: {e}")
            
        return all_results
        
    def get_organizations(self):
        """組織一覧を取得（福岡県関連を特定）"""
        url = f"{self.base_url}/organization_list"
        
        try:
            response = requests.get(url, params={"all_fields": True})
            response.raise_for_status()
            data = response.json()
            
            if data["success"]:
                fukuoka_orgs = []
                for org in data["result"]:
                    if any(keyword in org.get("title", "").lower() or keyword in org.get("name", "").lower() 
                          for keyword in ["福岡", "fukuoka", "北九州", "kitakyushu"]):
                        fukuoka_orgs.append({
                            "name": org["name"],
                            "title": org["title"],
                            "package_count": org.get("package_count", 0)
                        })
                        
                return fukuoka_orgs
                
        except Exception as e:
            logger.error(f"組織リスト取得エラー: {e}")
            
        return []
        
    def download_resource(self, resource, category_dir):
        """リソースをダウンロード"""
        try:
            url = resource["url"]
            format = resource.get("format", "").upper()
            
            if format not in ["CSV", "JSON", "XLS", "XLSX"]:
                return None
                
            # ファイル名生成
            filename = resource.get("name", "").replace("/", "_").replace("\\", "_")
            if not filename:
                filename = f"resource_{resource.get('id', 'unknown')}"
            
            if not filename.endswith(f".{format.lower()}"):
                filename += f".{format.lower()}"
                
            # ダウンロード
            response = requests.get(url, stream=True, timeout=30)
            response.raise_for_status()
            
            file_path = category_dir / filename
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        
            logger.info(f"✅ ダウンロード完了: {filename}")
            return file_path
            
        except Exception as e:
            logger.error(f"❌ ダウンロードエラー: {e}")
            return None
            
    def collect_tourism_data(self):
        """観光関連データを収集"""
        logger.info("\n【観光データ収集】")
        
        keywords = ["観光", "宿泊", "イベント", "観光客", "ホテル"]
        datasets = []
        downloaded = 0
        
        for keyword in keywords:
            logger.info(f"検索中: {keyword}")
            results = self.search_packages(keyword)
            
            for package in results:
                # 福岡県関連か確認
                title = package.get("title", "")
                notes = package.get("notes", "")
                
                if not any(word in title + notes for word in ["福岡", "北九州", "久留米", "大牟田"]):
                    continue
                    
                dataset = {
                    "id": package["id"],
                    "title": title,
                    "organization": package.get("organization", {}).get("title", ""),
                    "resources": []
                }
                
                # リソースダウンロード
                for resource in package.get("resources", []):
                    if resource.get("format", "").upper() in ["CSV", "JSON", "XLS", "XLSX"]:
                        file_path = self.download_resource(resource, self.tourism_dir)
                        if file_path:
                            dataset["resources"].append({
                                "name": resource.get("name", ""),
                                "file_path": str(file_path)
                            })
                            downloaded += 1
                            time.sleep(0.5)  # サーバー負荷軽減
                            
                if dataset["resources"]:
                    datasets.append(dataset)
                    
        logger.info(f"観光データ: {len(datasets)}データセット, {downloaded}ファイル")
        return datasets
        
    def collect_transport_data(self):
        """交通関連データを収集"""
        logger.info("\n【交通データ収集】")
        
        keywords = ["交通", "バス", "鉄道", "地下鉄", "GTFS", "時刻表"]
        datasets = []
        downloaded = 0
        
        for keyword in keywords:
            logger.info(f"検索中: {keyword}")
            results = self.search_packages(keyword)
            
            for package in results[:20]:  # 最大20件
                dataset = {
                    "id": package["id"],
                    "title": package.get("title", ""),
                    "resources": []
                }
                
                for resource in package.get("resources", []):
                    if resource.get("format", "").upper() in ["CSV", "JSON", "GTFS"]:
                        file_path = self.download_resource(resource, self.transport_dir)
                        if file_path:
                            dataset["resources"].append({
                                "name": resource.get("name", ""),
                                "file_path": str(file_path)
                            })
                            downloaded += 1
                            time.sleep(0.5)
                            
                if dataset["resources"]:
                    datasets.append(dataset)
                    
        logger.info(f"交通データ: {len(datasets)}データセット, {downloaded}ファイル")
        return datasets
        
    def save_collection_summary(self, all_data):
        """収集結果のサマリーを保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        summary = {
            "timestamp": datetime.now().isoformat(),
            "source": "BODIK",
            "prefecture": "福岡県",
            "data": all_data,
            "stats": {
                "tourism": len(all_data.get("tourism", [])),
                "transport": len(all_data.get("transport", [])),
                "total_files": sum(
                    len(ds.get("resources", [])) 
                    for category in all_data.values() 
                    for ds in category
                )
            }
        }
        
        # JSON保存
        json_path = self.data_dir / f"bodik_collection_summary_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        # レポート作成
        report_path = self.data_dir / f"bodik_collection_report_{timestamp}.md"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# BODIK福岡県データ収集レポート\n\n")
            f.write(f"実行日時: {datetime.now()}\n")
            f.write(f"データソース: BODIK (https://data.bodik.jp/)\n\n")
            
            f.write("## 収集統計\n\n")
            f.write(f"- 観光データ: {summary['stats']['tourism']}データセット\n")
            f.write(f"- 交通データ: {summary['stats']['transport']}データセット\n")
            f.write(f"- 総ファイル数: {summary['stats']['total_files']}ファイル\n\n")
            
            # 主要データセット
            if all_data.get("tourism"):
                f.write("## 観光データセット\n\n")
                for ds in all_data["tourism"][:5]:
                    f.write(f"- {ds['title']} ({len(ds['resources'])}ファイル)\n")
                    
            if all_data.get("transport"):
                f.write("\n## 交通データセット\n\n")
                for ds in all_data["transport"][:5]:
                    f.write(f"- {ds['title']} ({len(ds['resources'])}ファイル)\n")
                    
        logger.info(f"\n📄 レポート保存:")
        logger.info(f"- JSON: {json_path}")
        logger.info(f"- Markdown: {report_path}")
        
        return json_path, report_path
        
    def run_collection(self):
        """データ収集を実行"""
        logger.info("="*60)
        logger.info("BODIK福岡県データ収集開始")
        logger.info("="*60)
        
        # 福岡県関連組織を確認
        logger.info("\n福岡県関連組織を検索中...")
        fukuoka_orgs = self.get_organizations()
        if fukuoka_orgs:
            logger.info(f"発見した福岡県関連組織: {len(fukuoka_orgs)}件")
            for org in fukuoka_orgs[:5]:
                logger.info(f"- {org['title']} ({org['package_count']}データセット)")
                
        # データ収集
        all_data = {
            "tourism": self.collect_tourism_data(),
            "transport": self.collect_transport_data()
        }
        
        # サマリー保存
        self.save_collection_summary(all_data)
        
        return all_data


def main():
    """メイン処理"""
    print("\n🏛️ BODIK福岡県データ収集")
    print("="*60)
    print("九州オープンデータ推進会議のBODIKから福岡県データを収集します")
    print()
    
    collector = BODIKFukuokaDataCollector()
    data = collector.run_collection()
    
    print("\n✅ 収集完了!")
    print(f"データ保存先: {collector.data_dir}")
    
    # 統計表示
    total_datasets = sum(len(v) for v in data.values())
    total_files = sum(
        len(ds.get("resources", [])) 
        for datasets in data.values() 
        for ds in datasets
    )
    
    print(f"\n📊 収集統計:")
    print(f"- 総データセット数: {total_datasets}")
    print(f"- 総ダウンロードファイル数: {total_files}")


if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
岡山県オープンデータポータル データ収集スクリプト
岡山県の観光・人口・イベント・政策データを収集
"""
import requests
import json
import csv
from datetime import datetime
from pathlib import Path
import logging
import time
from urllib.parse import urlparse, urljoin
import os

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OkayamaDataCollector:
    """岡山県オープンデータ収集クラス"""
    
    def __init__(self):
        # 岡山県オープンデータカタログサイト
        self.base_url = "https://www.okayama-opendata.jp/ckan/api/3/action"
        
        # データ保存ディレクトリ
        self.base_dir = Path(__file__).parent.parent
        self.data_dir = self.base_dir / "uesugi-engine-data" / "okayama"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # カテゴリ別ディレクトリ
        self.tourism_dir = self.data_dir / "tourism"
        self.population_dir = self.data_dir / "population"
        self.events_dir = self.data_dir / "events"
        self.policy_dir = self.data_dir / "policy"
        self.transport_dir = self.data_dir / "transport"
        
        for dir in [self.tourism_dir, self.population_dir, self.events_dir, 
                   self.policy_dir, self.transport_dir]:
            dir.mkdir(exist_ok=True)
            
        # 統計情報
        self.stats = {
            "total_datasets": 0,
            "downloaded_files": 0,
            "failed_downloads": 0
        }
        
    def search_packages(self, query="", rows=1000):
        """データセットを検索"""
        url = f"{self.base_url}/package_search"
        params = {
            "q": query,
            "rows": rows,
            "start": 0
        }
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data["success"]:
                logger.info(f"検索結果: {data['result']['count']}件のデータセット")
                return data["result"]["results"]
            else:
                logger.error("検索に失敗しました")
                return []
                
        except requests.RequestException as e:
            logger.error(f"API接続エラー: {e}")
            return []
            
    def get_package_details(self, package_id):
        """データセットの詳細情報を取得"""
        url = f"{self.base_url}/package_show"
        params = {"id": package_id}
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            if data["success"]:
                return data["result"]
            return None
            
        except requests.RequestException as e:
            logger.error(f"詳細取得エラー ({package_id}): {e}")
            return None
            
    def categorize_dataset(self, dataset):
        """データセットをカテゴリ分類"""
        title = dataset.get("title", "").lower()
        notes = dataset.get("notes", "").lower()
        tags = [tag["name"] for tag in dataset.get("tags", [])]
        tags_str = " ".join(tags).lower()
        
        # キーワードベースの分類
        tourism_keywords = ["観光", "宿泊", "ホテル", "旅館", "観光客", "観光施設", "温泉"]
        population_keywords = ["人口", "世帯", "住民", "年齢", "高齢者", "少子化"]
        event_keywords = ["イベント", "祭り", "催し", "行事", "フェスティバル", "祭典"]
        transport_keywords = ["交通", "バス", "鉄道", "道路", "駐車場", "空港"]
        
        # 優先度順にチェック
        for keyword in tourism_keywords:
            if keyword in title or keyword in notes or keyword in tags_str:
                return "tourism"
                
        for keyword in population_keywords:
            if keyword in title or keyword in notes or keyword in tags_str:
                return "population"
                
        for keyword in event_keywords:
            if keyword in title or keyword in notes or keyword in tags_str:
                return "events"
                
        for keyword in transport_keywords:
            if keyword in title or keyword in notes or keyword in tags_str:
                return "transport"
                
        # その他は政策関連
        return "policy"
        
    def download_resource(self, resource, category_dir):
        """リソースファイルをダウンロード"""
        try:
            url = resource.get("url", "")
            if not url:
                return None
                
            format_type = resource.get("format", "").upper()
            
            # 対応フォーマットのみダウンロード
            if format_type not in ["CSV", "JSON", "XLS", "XLSX", "GEOJSON"]:
                logger.info(f"非対応フォーマット: {format_type}")
                return None
                
            # ファイル名生成
            original_name = resource.get("name", "unknown")
            if url.endswith(('.csv', '.json', '.xls', '.xlsx', '.geojson')):
                filename = os.path.basename(urlparse(url).path)
            else:
                ext = format_type.lower()
                filename = f"{original_name}.{ext}"
                
            # 日本語ファイル名の処理
            filename = filename.replace('/', '_').replace('\\', '_')
            
            # ダウンロード実行
            logger.info(f"ダウンロード中: {filename}")
            response = requests.get(url, stream=True, timeout=60)
            response.raise_for_status()
            
            file_path = category_dir / filename
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        
            self.stats["downloaded_files"] += 1
            logger.info(f"✅ 保存完了: {filename}")
            
            # CSVの文字コード変換
            if format_type == "CSV":
                self.convert_csv_encoding(file_path)
                
            return file_path
            
        except Exception as e:
            self.stats["failed_downloads"] += 1
            logger.error(f"❌ ダウンロードエラー: {e}")
            return None
            
    def convert_csv_encoding(self, file_path):
        """CSVファイルの文字コードをUTF-8に変換"""
        encodings = ['shift_jis', 'cp932', 'utf-8', 'utf-8-sig', 'euc-jp']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    content = f.read()
                    
                # UTF-8で保存し直す
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                    
                logger.debug(f"文字コード変換: {encoding} → UTF-8")
                break
            except UnicodeDecodeError:
                continue
            except Exception as e:
                logger.warning(f"文字コード変換スキップ: {e}")
                break
                
    def collect_all_data(self):
        """全データを収集"""
        logger.info("="*60)
        logger.info("岡山県オープンデータ収集開始")
        logger.info("="*60)
        
        # カテゴリ別収集結果
        category_results = {
            "tourism": [],
            "population": [],
            "events": [],
            "transport": [],
            "policy": []
        }
        
        # 全データセット取得
        datasets = self.search_packages()
        self.stats["total_datasets"] = len(datasets)
        
        # データセットごとに処理
        for dataset in datasets:
            try:
                # カテゴリ判定
                category = self.categorize_dataset(dataset)
                
                # カテゴリに応じたディレクトリ選択
                category_dirs = {
                    "tourism": self.tourism_dir,
                    "population": self.population_dir,
                    "events": self.events_dir,
                    "transport": self.transport_dir,
                    "policy": self.policy_dir
                }
                
                target_dir = category_dirs.get(category, self.policy_dir)
                
                # データセット情報
                dataset_info = {
                    "id": dataset.get("id"),
                    "name": dataset.get("name"),
                    "title": dataset.get("title"),
                    "organization": dataset.get("organization", {}).get("title", ""),
                    "category": category,
                    "resources": []
                }
                
                # リソースをダウンロード
                for resource in dataset.get("resources", []):
                    file_path = self.download_resource(resource, target_dir)
                    if file_path:
                        dataset_info["resources"].append({
                            "name": resource.get("name"),
                            "format": resource.get("format"),
                            "file_path": str(file_path)
                        })
                        
                    # サーバー負荷軽減
                    time.sleep(0.5)
                    
                if dataset_info["resources"]:
                    category_results[category].append(dataset_info)
                    
            except Exception as e:
                logger.error(f"データセット処理エラー: {e}")
                continue
                
        # サマリー保存
        self._save_summary(category_results)
        
        return category_results
        
    def _save_summary(self, results):
        """収集結果のサマリー保存"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 統計情報サマリー
        summary = {
            "timestamp": datetime.now().isoformat(),
            "prefecture": "岡山県",
            "stats": {
                "total_datasets": self.stats["total_datasets"],
                "downloaded_files": self.stats["downloaded_files"],
                "failed_downloads": self.stats["failed_downloads"],
                "by_category": {}
            },
            "datasets": results
        }
        
        # カテゴリ別統計
        for category, datasets in results.items():
            summary["stats"]["by_category"][category] = {
                "datasets": len(datasets),
                "files": sum(len(ds["resources"]) for ds in datasets)
            }
            
        # JSON保存
        json_path = self.data_dir / f"okayama_summary_{timestamp}.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
            
        # テキストレポート
        report_path = self.data_dir / f"okayama_report_{timestamp}.txt"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("岡山県オープンデータ収集レポート\n")
            f.write("="*60 + "\n")
            f.write(f"実行時刻: {datetime.now()}\n")
            f.write(f"総データセット数: {self.stats['total_datasets']}件\n")
            f.write(f"ダウンロード成功: {self.stats['downloaded_files']}ファイル\n")
            f.write(f"ダウンロード失敗: {self.stats['failed_downloads']}ファイル\n\n")
            
            f.write("【カテゴリ別収集結果】\n")
            for category, stats in summary["stats"]["by_category"].items():
                f.write(f"\n{category.upper()}:\n")
                f.write(f"  データセット数: {stats['datasets']}件\n")
                f.write(f"  ファイル数: {stats['files']}件\n")
                
                # 主なデータセットリスト
                if category in results and results[category]:
                    f.write("  主なデータセット:\n")
                    for ds in results[category][:5]:  # 最初の5件
                        f.write(f"    - {ds['title']}\n")
                        
        logger.info(f"\n✅ 収集完了！")
        logger.info(f"サマリー: {json_path}")
        logger.info(f"レポート: {report_path}")
        
        return json_path, report_path
        
    def collect_alternative_sources(self):
        """代替データソースからの収集（オープンデータポータルが利用できない場合）"""
        logger.info("\n【代替データソース収集】")
        
        alternative_data = []
        
        # 1. e-Stat（政府統計）から岡山県データ
        try:
            estat_api_key = os.environ.get("ESTAT_API_KEY", "")
            if estat_api_key:
                import sys
                sys.path.append(str(self.base_dir / "scripts"))
                from collect_estat_data_v2 import collect_prefecture_statistics
                
                okayama_stats = collect_prefecture_statistics("33", "岡山県")
                if okayama_stats:
                    alternative_data.append({
                        "source": "e-Stat",
                        "type": "statistics",
                        "data": okayama_stats
                    })
                    
        except Exception as e:
            logger.error(f"e-Stat収集エラー: {e}")
            
        # 2. 国土数値情報から基本データ
        try:
            # 公共施設、観光資源等のデータ
            kokudo_urls = {
                "public_facilities": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P02-v2_0.html",
                "tourist_resources": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P12-v2_0.html"
            }
            
            for data_type, url in kokudo_urls.items():
                alternative_data.append({
                    "source": "国土数値情報",
                    "type": data_type,
                    "url": url,
                    "note": "手動ダウンロードが必要"
                })
                
        except Exception as e:
            logger.error(f"国土数値情報参照エラー: {e}")
            
        # 代替データ情報を保存
        alt_file = self.data_dir / "alternative_data_sources.json"
        with open(alt_file, 'w', encoding='utf-8') as f:
            json.dump(alternative_data, f, ensure_ascii=False, indent=2)
            
        logger.info(f"代替データソース情報: {alt_file}")
        
        return alternative_data


def main():
    """メイン処理"""
    print("\n🏛️ 岡山県オープンデータ収集")
    print("="*60)
    
    collector = OkayamaDataCollector()
    
    try:
        # メインのデータ収集
        results = collector.collect_all_data()
        
        # 代替データソース情報も収集
        alternative_sources = collector.collect_alternative_sources()
        
        # 結果表示
        print("\n✅ 収集完了統計:")
        print(f"- 総データセット数: {collector.stats['total_datasets']}件")
        print(f"- ダウンロード成功: {collector.stats['downloaded_files']}ファイル")
        print(f"- ダウンロード失敗: {collector.stats['failed_downloads']}ファイル")
        print(f"\nデータ保存先: {collector.data_dir}")
        
        # カテゴリ別結果
        print("\n【カテゴリ別収集結果】")
        for category, datasets in results.items():
            if datasets:
                print(f"{category}: {len(datasets)}データセット")
                
    except Exception as e:
        logger.error(f"収集処理エラー: {e}", exc_info=True)
        
    print("\n" + "="*60)


if __name__ == "__main__":
    main()
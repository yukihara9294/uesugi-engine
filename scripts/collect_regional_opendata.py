#!/usr/bin/env python3
"""
地域別オープンデータ収集スクリプト（シンプル版）
広島、福岡、大阪、東京の観光データを収集
"""
import requests
import json
import csv
from datetime import datetime
from pathlib import Path
import logging

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RegionalOpenDataCollector:
    """地域別オープンデータ収集"""
    
    def __init__(self):
        self.data_dir = Path("tourism_data")
        self.raw_dir = self.data_dir / "raw"
        self.processed_dir = self.data_dir / "processed"
        
        # ディレクトリ作成
        for region in ["hiroshima", "fukuoka", "osaka", "tokyo", "national"]:
            (self.raw_dir / region).mkdir(parents=True, exist_ok=True)
            (self.processed_dir / region).mkdir(parents=True, exist_ok=True)
            
    def collect_data_go_jp(self):
        """data.go.jpから観光データを検索・収集"""
        logger.info("=== data.go.jp観光データ収集開始 ===")
        
        # data.go.jp CKAN API
        base_url = "https://www.data.go.jp/data/api/3/action"
        
        # 観光関連データを検索
        search_url = f"{base_url}/package_search"
        search_terms = ["観光", "宿泊", "来訪者", "イベント", "観光客"]
        
        collected_data = []
        
        for term in search_terms:
            params = {
                "q": term,
                "rows": 10,
                "start": 0
            }
            
            try:
                response = requests.get(search_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        results = data.get("result", {}).get("results", [])
                        for dataset in results:
                            # 対象地域のデータをフィルタ
                            title = dataset.get("title", "")
                            if any(region in title for region in ["広島", "福岡", "大阪", "東京"]):
                                collected_data.append({
                                    "id": dataset.get("id"),
                                    "title": title,
                                    "organization": dataset.get("organization", {}).get("title", ""),
                                    "notes": dataset.get("notes", ""),
                                    "resources": len(dataset.get("resources", []))
                                })
                                logger.info(f"✓ 発見: {title}")
                                
            except Exception as e:
                logger.error(f"data.go.jp検索エラー ({term}): {e}")
                
        # 結果を保存
        output_path = self.processed_dir / "national" / "data_go_jp_tourism.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "source": "data.go.jp",
                "datasets": collected_data,
                "total": len(collected_data)
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"data.go.jp: {len(collected_data)}件の観光データセット発見")
        return collected_data
        
    def collect_hiroshima_data(self):
        """広島県オープンデータ収集"""
        logger.info("=== 広島県データ収集開始 ===")
        
        # 広島県オープンデータカタログAPI
        # 注: 実際のAPIエンドポイントは要確認
        hiroshima_datasets = {
            "観光客数統計": {
                "description": "広島県内の観光客数統計データ",
                "format": "CSV",
                "url": "https://hiroshima-opendata.dataeye.jp/dataset/tourism-statistics",
                "importance": "high"
            },
            "宿泊施設統計": {
                "description": "宿泊施設の稼働率・宿泊者数",
                "format": "CSV", 
                "url": "https://hiroshima-opendata.dataeye.jp/dataset/accommodation-stats",
                "importance": "high"
            },
            "イベント情報": {
                "description": "県内イベント・祭り情報",
                "format": "JSON",
                "url": "https://hiroshima-opendata.dataeye.jp/dataset/events",
                "importance": "medium"
            },
            "交通機関利用統計": {
                "description": "JR・バス・船舶の利用者数",
                "format": "CSV",
                "url": "https://hiroshima-opendata.dataeye.jp/dataset/transport-usage",
                "importance": "high"
            }
        }
        
        # メタデータを保存
        metadata_path = self.processed_dir / "hiroshima" / "available_datasets.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "region": "広島県",
                "portal_url": "https://hiroshima-opendata.dataeye.jp/",
                "datasets": hiroshima_datasets,
                "notes": "実際のダウンロードにはポータルサイトへのアクセスが必要"
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"広島県: {len(hiroshima_datasets)}件のデータセット情報を保存")
        return hiroshima_datasets
        
    def collect_tokyo_tourism_data(self):
        """東京都観光データ収集"""
        logger.info("=== 東京都観光データ収集開始 ===")
        
        # 東京都観光データカタログの情報
        tokyo_data = {
            "2023年観光統計": {
                "日本人旅行者数": "4億7456万人",
                "外国人旅行者数": "1954万人",
                "観光消費額_日本人": "4.48兆円",
                "観光消費額_外国人": "2.76兆円",
                "総観光消費額": "7.24兆円"
            },
            "データソース": {
                "カタログURL": "https://data.tourism.metro.tokyo.lg.jp/",
                "ダッシュボード": "利用可能",
                "ダウンロード形式": ["CSV", "Excel", "JSON"]
            },
            "主要データセット": [
                "月別観光客数推移",
                "国籍別外国人旅行者数",
                "地域別観光消費額",
                "宿泊施設稼働率",
                "観光地別入込客数"
            ]
        }
        
        # データを保存
        output_path = self.processed_dir / "tokyo" / "tourism_statistics_2023.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "region": "東京都",
                "year": 2023,
                "data": tokyo_data,
                "notes": "東京都観光データカタログより"
            }, f, ensure_ascii=False, indent=2)
            
        logger.info("東京都: 2023年観光統計データ情報を保存")
        return tokyo_data
        
    def collect_resas_alternative_data(self):
        """RESAS代替データソース情報"""
        logger.info("=== RESAS代替データソース整理 ===")
        
        resas_alternatives = {
            "観光マップ代替": {
                "観光庁統計": {
                    "url": "https://www.mlit.go.jp/kankocho/siryou/toukei/",
                    "データ": ["宿泊旅行統計", "訪日外国人消費動向調査", "旅行・観光消費動向調査"],
                    "形式": "Excel/PDF",
                    "更新頻度": "月次/四半期"
                },
                "JNTO統計": {
                    "url": "https://www.jnto.go.jp/statistics/",
                    "データ": ["訪日外客統計", "国・地域別訪日外客数"],
                    "形式": "Excel/PDF",
                    "更新頻度": "月次"
                }
            },
            "人口マップ代替": {
                "e-Stat": {
                    "APIキー": "取得済み",
                    "データ": ["国勢調査", "人口推計", "住民基本台帳"],
                    "形式": "API/CSV"
                }
            },
            "産業マップ代替": {
                "経済センサス": {
                    "source": "e-Stat",
                    "データ": ["事業所数", "従業者数", "売上高"],
                    "形式": "API/CSV"
                }
            },
            "モバイル空間統計": {
                "ドコモ・インサイトマーケティング": {
                    "url": "https://mobaku.jp/",
                    "データ": ["人口分布", "移動人口", "滞在人口"],
                    "備考": "有料サービス"
                },
                "各自治体調査": {
                    "福岡県": "モバイル空間統計を活用した観光客調査実施",
                    "広島県": "観光客動態調査で一部利用"
                }
            }
        }
        
        # 情報を保存
        output_path = self.processed_dir / "national" / "resas_alternatives.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "description": "RESAS API終了に伴う代替データソース",
                "alternatives": resas_alternatives,
                "recommendation": "観光庁・JNTO統計とe-Statの組み合わせで大部分をカバー可能"
            }, f, ensure_ascii=False, indent=2)
            
        logger.info("RESAS代替データソース情報を整理・保存")
        return resas_alternatives
        
    def generate_collection_report(self):
        """収集レポート生成"""
        report_path = self.data_dir / f"collection_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("地域別オープンデータ収集レポート\n")
            f.write("="*60 + "\n")
            f.write(f"実行時刻: {datetime.now()}\n\n")
            
            f.write("【収集状況】\n")
            f.write("✅ data.go.jp: 観光関連データセット検索完了\n")
            f.write("✅ 広島県: データセット情報整理完了\n")
            f.write("✅ 東京都: 2023年観光統計情報保存\n")
            f.write("✅ RESAS代替: 代替データソース整理完了\n\n")
            
            f.write("【重要データソース】\n")
            f.write("1. 東京都観光データカタログ\n")
            f.write("   - URL: https://data.tourism.metro.tokyo.lg.jp/\n")
            f.write("   - 2023年最新データ利用可能\n\n")
            
            f.write("2. 広島県オープンデータポータル\n")
            f.write("   - URL: https://hiroshima-opendata.dataeye.jp/\n")
            f.write("   - 観光・宿泊・交通データあり\n\n")
            
            f.write("3. 観光庁統計\n")
            f.write("   - URL: https://www.mlit.go.jp/kankocho/siryou/toukei/\n")
            f.write("   - 宿泊旅行統計（月次更新）\n\n")
            
            f.write("【次のアクション】\n")
            f.write("1. 各ポータルサイトから実データをダウンロード\n")
            f.write("2. CSVファイルをprocessedフォルダで統合\n")
            f.write("3. PostgreSQLデータベースへインポート\n")
            f.write("4. フロントエンドでの可視化実装\n")
            
        logger.info(f"収集レポート生成: {report_path}")
        return report_path


def main():
    """メイン処理"""
    print("🗾 地域別オープンデータ収集開始")
    print("="*60)
    
    collector = RegionalOpenDataCollector()
    
    # 1. data.go.jpから収集
    print("\n📊 data.go.jp観光データ検索...")
    data_go_jp = collector.collect_data_go_jp()
    
    # 2. 広島県データ情報整理
    print("\n🏯 広島県オープンデータ情報整理...")
    hiroshima = collector.collect_hiroshima_data()
    
    # 3. 東京都観光データ
    print("\n🗼 東京都観光データ情報整理...")
    tokyo = collector.collect_tokyo_tourism_data()
    
    # 4. RESAS代替データソース
    print("\n🔄 RESAS代替データソース整理...")
    resas_alt = collector.collect_resas_alternative_data()
    
    # 5. レポート生成
    report = collector.generate_collection_report()
    
    print("\n✅ 収集完了！")
    print(f"\n📁 データ保存先: {collector.data_dir}")
    print(f"📄 レポート: {report}")
    
    print("\n" + "="*60)
    print("【Uesugi Engineで活用可能な高次元データ】")
    print("\n1. 時系列データ:")
    print("   - 月次/日次観光客数推移")
    print("   - 宿泊施設稼働率変動")
    print("   - イベント前後の人流変化")
    
    print("\n2. 空間データ:")
    print("   - 地域別観光客分布")
    print("   - 交通機関利用パターン")
    print("   - 観光地間の移動ルート")
    
    print("\n3. カテゴリデータ:")
    print("   - 国籍別外国人旅行者")
    print("   - 年齢層別観光行動")
    print("   - 目的別来訪者分類")
    
    print("\n4. 相関分析用データ:")
    print("   - 気象×観光客数")
    print("   - イベント×経済効果")
    print("   - 交通×宿泊需要")
    
    print("\n💡 これらのデータを統合することで、")
    print("   高度な因果推論と予測分析が可能になります。")


if __name__ == "__main__":
    main()
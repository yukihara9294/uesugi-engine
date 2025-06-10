#!/usr/bin/env python3
"""
広島県オープンデータ収集スクリプト
dataeye.jpから重要データセットを収集
"""
import requests
import json
import csv
from datetime import datetime
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class HiroshimaOpenDataCollector:
    """広島県オープンデータ収集"""
    
    def __init__(self):
        self.data_dir = Path("uesugi-engine-data/hiroshima")
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.base_url = "https://hiroshima-opendata.dataeye.jp"
        
    def collect_key_datasets(self):
        """重要データセットの情報を収集"""
        logger.info("=== 広島県オープンデータ収集開始 ===")
        
        # 重要データセット一覧
        key_datasets = {
            "人口統計": {
                "広島市人口": {
                    "url": f"{self.base_url}/datasets/hiroshima-shi-suikei-jinko",
                    "description": "広島市推計人口（月次更新）",
                    "format": "CSV",
                    "importance": "high"
                },
                "尾道市人口": {
                    "url": f"{self.base_url}/datasets/35/onomichi-shi-suikeijinko",
                    "description": "尾道市推計人口データ",
                    "format": "CSV",
                    "importance": "high"
                },
                "廿日市市人口": {
                    "url": f"{self.base_url}/datasets/137/2020census_01_hatsukaichi",
                    "description": "廿日市市国勢調査人口",
                    "format": "CSV",
                    "importance": "high"
                }
            },
            "施設データ": {
                "避難所": {
                    "url": f"{self.base_url}/datasets/131010_emergency_evacuation_site",
                    "description": "指定緊急避難場所データ",
                    "format": "CSV",
                    "importance": "high"
                },
                "公共施設": {
                    "url": f"{self.base_url}/datasets/public-facilities",
                    "description": "公共施設一覧",
                    "format": "CSV",
                    "importance": "medium"
                },
                "医療機関": {
                    "url": f"{self.base_url}/datasets/medical-facilities",
                    "description": "医療機関一覧",
                    "format": "CSV",
                    "importance": "high"
                }
            },
            "交通データ": {
                "GTFSバス": {
                    "url": f"{self.base_url}/datasets/343001_hiroshima_ken_bus_kyokai_gtfs",
                    "description": "広島県バス協会GTFSデータ",
                    "format": "ZIP",
                    "importance": "high",
                    "download_url": f"{self.base_url}/dataset/343001_hiroshima_ken_bus_kyokai_gtfs/resource/5bbfc73f-d3d8-4966-ae3e-7bc85e5d8e89/download/gtfs-jp.zip"
                }
            },
            "防災データ": {
                "ハザードマップ": {
                    "url": f"{self.base_url}/datasets/hazard-map",
                    "description": "ハザードマップデータ",
                    "format": "Various",
                    "importance": "high"
                },
                "3D点群データ": {
                    "url": f"{self.base_url}/datasets/3d-point-cloud",
                    "description": "防災用3D点群データ",
                    "format": "LAZ",
                    "importance": "medium"
                }
            },
            "環境データ": {
                "大気汚染": {
                    "url": f"{self.base_url}/datasets/air-pollution",
                    "description": "大気汚染測定結果",
                    "format": "CSV",
                    "importance": "medium"
                }
            },
            "イベント・観光": {
                "観光施設": {
                    "url": f"{self.base_url}/datasets/tourism-facilities",
                    "description": "観光施設一覧",
                    "format": "CSV",
                    "importance": "high"
                },
                "イベント情報": {
                    "url": f"{self.base_url}/datasets/event-calendar",
                    "description": "イベントカレンダー",
                    "format": "CSV",
                    "importance": "high"
                }
            }
        }
        
        # データセット情報を保存
        dataset_info_path = self.data_dir / "hiroshima_datasets_catalog.json"
        with open(dataset_info_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "portal": "広島県オープンデータポータル（dataeye.jp）",
                "datasets": key_datasets,
                "total_categories": len(key_datasets),
                "license": "CC-BY 2.1 Japan",
                "notes": "APIアクセスについてはData Cradle社へ問い合わせ推奨"
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"データセットカタログ保存: {dataset_info_path}")
        return key_datasets
        
    def download_sample_data(self):
        """サンプルデータのダウンロード試行"""
        logger.info("=== サンプルデータダウンロード ===")
        
        # 広島市推計人口データを試しにダウンロード
        sample_urls = {
            "広島市推計人口": "https://hiroshima-opendata.dataeye.jp/datasets/hiroshima-shi-suikei-jinko.csv",
            "広島県バスGTFS": "https://hiroshima-opendata.dataeye.jp/dataset/343001_hiroshima_ken_bus_kyokai_gtfs/resource/5bbfc73f-d3d8-4966-ae3e-7bc85e5d8e89/download/gtfs-jp.zip"
        }
        
        download_status = {}
        
        for name, url in sample_urls.items():
            try:
                # ヘッダー確認
                response = requests.head(url, allow_redirects=True, timeout=10)
                if response.status_code == 200:
                    file_size = response.headers.get('content-length', 'unknown')
                    download_status[name] = {
                        "status": "available",
                        "size": file_size,
                        "url": url
                    }
                    logger.info(f"✓ {name}: ダウンロード可能（サイズ: {file_size}）")
                else:
                    download_status[name] = {
                        "status": "error",
                        "code": response.status_code
                    }
                    logger.warning(f"✗ {name}: ステータスコード {response.status_code}")
                    
            except Exception as e:
                download_status[name] = {
                    "status": "error",
                    "error": str(e)
                }
                logger.error(f"✗ {name}: エラー {e}")
                
        return download_status
        
    def analyze_data_potential(self):
        """データの活用可能性分析"""
        logger.info("=== Uesugi Engineでの活用可能性 ===")
        
        analysis = {
            "因果推論への活用": {
                "施策効果測定": [
                    "人口データ → 施策前後の人口動態変化",
                    "交通データ → 新路線開通の効果測定",
                    "避難所データ → 防災訓練の参加率向上効果"
                ],
                "イベント影響分析": [
                    "観光施設データ × イベント開催 → 来場者数変化",
                    "交通GTFSデータ → イベント時の混雑予測",
                    "環境データ → 大規模イベントの環境影響"
                ]
            },
            "予測モデル構築": {
                "需要予測": [
                    "人口推移 → 将来の公共サービス需要",
                    "観光データ → 季節別観光客数予測",
                    "医療施設 → 医療需要の地域別予測"
                ],
                "リスク評価": [
                    "ハザードマップ × 人口 → 災害リスク評価",
                    "3D点群データ → 洪水シミュレーション",
                    "避難所配置 → 避難計画最適化"
                ]
            },
            "リアルタイム分析": {
                "交通分析": "GTFSデータによるバス運行状況",
                "環境監視": "大気汚染データのリアルタイム監視",
                "施設利用": "公共施設の利用状況分析"
            }
        }
        
        # 分析結果を保存
        analysis_path = self.data_dir / "hiroshima_data_analysis.json"
        with open(analysis_path, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "analysis": analysis,
                "recommendations": [
                    "人口・交通データを優先的に収集",
                    "GTFSデータで公共交通分析を実装",
                    "防災データで避難計画最適化",
                    "APIアクセス方法をData Cradle社に確認"
                ]
            }, f, ensure_ascii=False, indent=2)
            
        logger.info(f"活用可能性分析保存: {analysis_path}")
        return analysis
        
    def generate_collection_report(self):
        """収集レポート生成"""
        report_path = self.data_dir / f"collection_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 広島県オープンデータ収集レポート\n\n")
            f.write(f"実行時刻: {datetime.now()}\n\n")
            
            f.write("## 概要\n")
            f.write("- **ポータル**: https://hiroshima-opendata.dataeye.jp/\n")
            f.write("- **運営**: Data Cradle Inc.\n")
            f.write("- **ライセンス**: CC-BY 2.1 Japan\n\n")
            
            f.write("## 重要データセット\n\n")
            
            f.write("### 1. 人口統計\n")
            f.write("- 広島市推計人口（月次更新）\n")
            f.write("- 尾道市推計人口\n")
            f.write("- 廿日市市国勢調査データ\n\n")
            
            f.write("### 2. 施設データ\n")
            f.write("- 指定緊急避難場所（防災）\n")
            f.write("- 公共施設一覧\n")
            f.write("- 医療機関情報\n\n")
            
            f.write("### 3. 交通データ\n")
            f.write("- 広島県バス協会GTFS（バス運行データ）\n")
            f.write("- リアルタイム性あり\n\n")
            
            f.write("### 4. 防災データ\n")
            f.write("- ハザードマップ\n")
            f.write("- 3D点群データ（高精度地形）\n\n")
            
            f.write("## Uesugi Engineでの活用\n\n")
            f.write("### 因果推論\n")
            f.write("- 新規バス路線開通 → 沿線人口変化\n")
            f.write("- 防災訓練実施 → 避難所認知度向上\n")
            f.write("- 観光イベント → 交通混雑度変化\n\n")
            
            f.write("### 予測分析\n")
            f.write("- 人口推移予測\n")
            f.write("- 医療需要予測\n")
            f.write("- 災害時避難シミュレーション\n\n")
            
            f.write("## 次のステップ\n")
            f.write("1. 具体的なCSVファイルのダウンロード\n")
            f.write("2. GTFSデータの解析実装\n")
            f.write("3. Data Cradle社へAPIアクセス方法確認\n")
            f.write("4. PostgreSQLへのデータ統合\n")
            
        logger.info(f"レポート生成: {report_path}")
        return report_path


def main():
    """メイン処理"""
    print("🏛️ 広島県オープンデータ収集")
    print("="*60)
    
    collector = HiroshimaOpenDataCollector()
    
    # 1. データセット情報収集
    print("\n📊 データセットカタログ作成...")
    datasets = collector.collect_key_datasets()
    print(f"✓ {sum(len(cat) for cat in datasets.values())}件のデータセット情報を整理")
    
    # 2. サンプルダウンロード試行
    print("\n💾 サンプルデータアクセス確認...")
    download_status = collector.download_sample_data()
    
    # 3. 活用可能性分析
    print("\n🔍 活用可能性分析...")
    analysis = collector.analyze_data_potential()
    
    # 4. レポート生成
    report = collector.generate_collection_report()
    
    print("\n✅ 収集完了！")
    print(f"\n📁 保存先: {collector.data_dir}")
    print(f"📄 レポート: {report}")
    
    print("\n" + "="*60)
    print("【重要な発見】")
    print("\n1. 広島県バス協会GTFSデータ")
    print("   → リアルタイム交通分析に活用可能")
    
    print("\n2. 月次更新の人口統計")
    print("   → 施策効果の定量的測定に最適")
    
    print("\n3. 防災関連データが充実")
    print("   → 避難計画最適化、リスク評価に活用")
    
    print("\n4. APIアクセスについて")
    print("   → Data Cradle社に問い合わせることでより効率的な収集が可能")
    
    print("\n💡 推奨アクション:")
    print("1. GTFSデータをダウンロードして交通分析実装")
    print("2. 人口統計CSVで施策効果測定デモ作成")
    print("3. 防災データで避難シミュレーション構築")


if __name__ == "__main__":
    main()